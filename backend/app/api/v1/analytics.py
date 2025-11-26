"""
Rotas da API para Analytics e métricas
"""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
import json

from ...config.database import db
from ...config.redis import redis_client

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_metrics(user_id: str = "default-user"):
    """
    Retorna métricas do dashboard principal
    """
    try:
        # Verificar cache
        cache_key = f"analytics:dashboard:{user_id}"
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        # Total de documentos
        total_docs_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM documents WHERE user_id = $1",
            user_id
        )
        total_documents = total_docs_result['count'] if total_docs_result else 0

        # Documentos completados
        completed_docs_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM documents WHERE user_id = $1 AND status = 'completed'",
            user_id
        )
        completed_documents = completed_docs_result['count'] if completed_docs_result else 0

        # Total de sessões de chat
        total_sessions_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = $1",
            user_id
        )
        total_sessions = total_sessions_result['count'] if total_sessions_result else 0

        # Total de mensagens
        total_messages_result = await db.fetch_one(
            """
            SELECT COUNT(*) as count FROM messages m
            JOIN chat_sessions cs ON m.session_id = cs.id
            WHERE cs.user_id = $1
            """,
            user_id
        )
        total_messages = total_messages_result['count'] if total_messages_result else 0

        # Documentos por tipo
        docs_by_type = await db.fetch_all(
            """
            SELECT type, COUNT(*) as count
            FROM documents
            WHERE user_id = $1
            GROUP BY type
            ORDER BY count DESC
            """,
            user_id
        )

        # Atividade dos últimos 7 dias
        seven_days_ago = datetime.now() - timedelta(days=7)
        activity = await db.fetch_all(
            """
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM analytics_events
            WHERE user_id = $1 AND created_at >= $2
            GROUP BY DATE(created_at)
            ORDER BY date ASC
            """,
            user_id, seven_days_ago
        )

        metrics = {
            "total_documents": total_documents,
            "completed_documents": completed_documents,
            "total_chat_sessions": total_sessions,
            "total_messages": total_messages,
            "documents_by_type": [dict(row) for row in docs_by_type],
            "activity_last_7_days": [
                {
                    "date": row['date'].isoformat(),
                    "count": row['count']
                }
                for row in activity
            ],
            "timestamp": datetime.now().isoformat()
        }

        # Cachear por 5 minutos
        await redis_client.set(cache_key, json.dumps(metrics, default=str), ttl=300)

        return metrics

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar métricas: {str(e)}")


@router.get("/activity")
async def get_activity_metrics(
    days: int = 30,
    user_id: str = "default-user"
):
    """
    Retorna métricas de atividade ao longo do tempo
    """
    try:
        start_date = datetime.now() - timedelta(days=days)

        # Atividade diária
        daily_activity = await db.fetch_all(
            """
            SELECT
                DATE(created_at) as date,
                event_type,
                COUNT(*) as count
            FROM analytics_events
            WHERE user_id = $1 AND created_at >= $2
            GROUP BY DATE(created_at), event_type
            ORDER BY date ASC, event_type
            """,
            user_id, start_date
        )

        # Organizar por data
        activity_by_date: Dict[str, List[Dict[str, Any]]] = {}
        for row in daily_activity:
            date_key = row['date'].isoformat()
            if date_key not in activity_by_date:
                activity_by_date[date_key] = []
            activity_by_date[date_key].append({
                "event_type": row['event_type'],
                "count": row['count']
            })

        return {
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": datetime.now().isoformat(),
            "activity": activity_by_date
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar atividade: {str(e)}")


@router.get("/queries")
async def get_top_queries(
    limit: int = 10,
    user_id: str = "default-user"
):
    """
    Retorna as queries mais frequentes
    """
    try:
        # Buscar queries do evento 'chat_message'
        queries = await db.fetch_all(
            """
            SELECT
                event_data->>'query' as query,
                COUNT(*) as frequency
            FROM analytics_events
            WHERE user_id = $1
                AND event_type = 'chat_message'
                AND event_data->>'query' IS NOT NULL
            GROUP BY event_data->>'query'
            ORDER BY frequency DESC
            LIMIT $2
            """,
            user_id, limit
        )

        return {
            "top_queries": [
                {
                    "query": row['query'],
                    "frequency": row['frequency']
                }
                for row in queries
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar queries: {str(e)}")


@router.post("/track")
async def track_event(
    event_type: str,
    event_data: Dict[str, Any],
    user_id: str = "default-user"
):
    """
    Registra um evento de analytics
    """
    try:
        await db.execute(
            """
            INSERT INTO analytics_events (user_id, event_type, event_data, created_at)
            VALUES ($1, $2, $3, NOW())
            """,
            user_id, event_type, json.dumps(event_data)
        )

        return {"success": True, "message": "Evento registrado"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao registrar evento: {str(e)}")


@router.get("/stats")
async def get_general_stats(user_id: str = "default-user"):
    """
    Retorna estatísticas gerais do sistema
    """
    try:
        # Tamanho total dos documentos
        total_size_result = await db.fetch_one(
            "SELECT COALESCE(SUM(size), 0) as total FROM documents WHERE user_id = $1",
            user_id
        )
        total_size = total_size_result['total'] if total_size_result else 0

        # Tempo médio de processamento
        avg_processing_result = await db.fetch_one(
            """
            SELECT AVG(processing_time) as avg_time
            FROM documents
            WHERE user_id = $1 AND processing_time IS NOT NULL
            """,
            user_id
        )
        avg_processing_time = float(avg_processing_result['avg_time']) if avg_processing_result and avg_processing_result['avg_time'] else 0

        # Total de chunks
        total_chunks_result = await db.fetch_one(
            "SELECT COALESCE(SUM(chunks), 0) as total FROM documents WHERE user_id = $1",
            user_id
        )
        total_chunks = total_chunks_result['total'] if total_chunks_result else 0

        # Sessões ativas
        active_sessions_result = await db.fetch_one(
            "SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = $1 AND ended_at IS NULL",
            user_id
        )
        active_sessions = active_sessions_result['count'] if active_sessions_result else 0

        return {
            "total_storage_bytes": total_size,
            "total_storage_mb": round(total_size / (1024 * 1024), 2),
            "avg_processing_time_seconds": round(avg_processing_time, 2),
            "total_chunks": total_chunks,
            "active_chat_sessions": active_sessions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")
