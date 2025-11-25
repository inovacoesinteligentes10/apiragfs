"""
Rotas da API para gerenciamento de chat
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime
import uuid
import json

from ...config import settings
from ...config.database import db
from ...config.redis import redis_client
from ...schemas.chat import (
    ChatSessionCreate, ChatSessionResponse,
    MessageCreate, MessageResponse,
    ChatQueryRequest, ChatQueryResponse
)
from ...services.gemini_service import GeminiService

router = APIRouter()


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Cria uma nova sessão de chat
    """
    try:
        session_id = str(uuid.uuid4())

        # Inserir sessão no banco (sem document_id e document_name)
        await db.execute(
            """
            INSERT INTO chat_sessions (
                id, user_id, rag_store_name, started_at, created_at, updated_at
            ) VALUES ($1, $2, $3, NOW(), NOW(), NOW())
            """,
            session_id, user_id, session_data.rag_store_name
        )

        # Buscar sessão criada
        session = await db.fetch_one(
            "SELECT * FROM chat_sessions WHERE id = $1",
            session_id
        )

        return ChatSessionResponse(**dict(session))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar sessão: {str(e)}")


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    user_id: str = "default-user",  # TODO: Pegar do token JWT
    skip: int = 0,
    limit: int = 50
):
    """
    Lista sessões de chat do usuário
    """
    sessions = await db.fetch_all(
        """
        SELECT * FROM chat_sessions
        WHERE user_id = $1
        ORDER BY started_at DESC
        LIMIT $2 OFFSET $3
        """,
        user_id, limit, skip
    )

    return [ChatSessionResponse(**dict(session)) for session in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Busca sessão de chat por ID
    """
    session = await db.fetch_one(
        """
        SELECT * FROM chat_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, user_id
    )

    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    return ChatSessionResponse(**dict(session))


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Busca mensagens de uma sessão
    """
    # Verificar se sessão existe e pertence ao usuário
    session = await db.fetch_one(
        """
        SELECT * FROM chat_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, user_id
    )

    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    # Buscar mensagens
    messages = await db.fetch_all(
        """
        SELECT * FROM messages
        WHERE session_id = $1
        ORDER BY created_at ASC
        """,
        session_id
    )

    return [MessageResponse(**dict(msg)) for msg in messages]


@router.post("/sessions/{session_id}/query", response_model=ChatQueryResponse)
async def query_chat(
    session_id: str,
    query: ChatQueryRequest,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Envia uma query para o chat e retorna resposta
    """
    try:
        # Verificar se sessão existe
        session = await db.fetch_one(
            """
            SELECT * FROM chat_sessions
            WHERE id = $1 AND user_id = $2
            """,
            session_id, user_id
        )

        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")

        # Salvar mensagem do usuário
        user_message_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO messages (id, session_id, role, content, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            """,
            user_message_id, session_id, "user", query.message
        )

        # Buscar histórico da sessão do Redis
        cache_key = f"chat_history:{session_id}"
        cached_history = await redis_client.get(cache_key)

        if cached_history:
            history = json.loads(cached_history)
        else:
            # Buscar do banco se não estiver em cache
            messages = await db.fetch_all(
                """
                SELECT role, content FROM messages
                WHERE session_id = $1
                ORDER BY created_at ASC
                """,
                session_id
            )
            history = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

        # Usar Gemini para responder
        gemini_service = GeminiService()
        response = await gemini_service.query_with_rag(
            rag_store_name=session['rag_store_name'],
            query=query.message,
            history=history
        )

        # Salvar resposta do modelo
        model_message_id = str(uuid.uuid4())
        grounding_chunks_json = json.dumps(response.get('grounding_chunks', []))

        await db.execute(
            """
            INSERT INTO messages (
                id, session_id, role, content, grounding_chunks, created_at
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
            """,
            model_message_id, session_id, "model",
            response['text'], grounding_chunks_json
        )

        # Atualizar contador de mensagens da sessão
        await db.execute(
            """
            UPDATE chat_sessions
            SET message_count = message_count + 2, updated_at = NOW()
            WHERE id = $1
            """,
            session_id
        )

        # Atualizar cache do histórico
        history.append({"role": "user", "content": query.message})
        history.append({"role": "model", "content": response['text']})
        await redis_client.set(
            cache_key,
            json.dumps(history),
            settings.redis_cache_ttl
        )

        return ChatQueryResponse(
            message=response['text'],
            grounding_chunks=response.get('grounding_chunks', [])
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar query: {str(e)}")


@router.post("/sessions/{session_id}/query-stream")
async def query_chat_stream(
    session_id: str,
    query: ChatQueryRequest,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Envia uma query para o chat e retorna resposta com streaming (SSE)
    """
    async def event_generator():
        try:
            # Verificar se sessão existe
            session = await db.fetch_one(
                """
                SELECT * FROM chat_sessions
                WHERE id = $1 AND user_id = $2
                """,
                session_id, user_id
            )

            if not session:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Sessão não encontrada'})}\n\n"
                return

            # Salvar mensagem do usuário
            user_message_id = str(uuid.uuid4())
            await db.execute(
                """
                INSERT INTO messages (id, session_id, role, content, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                """,
                user_message_id, session_id, "user", query.message
            )

            # Buscar histórico da sessão do Redis
            cache_key = f"chat_history:{session_id}"
            cached_history = await redis_client.get(cache_key)

            if cached_history:
                history = json.loads(cached_history)
            else:
                # Buscar do banco se não estiver em cache
                messages = await db.fetch_all(
                    """
                    SELECT role, content FROM messages
                    WHERE session_id = $1
                    ORDER BY created_at ASC
                    """,
                    session_id
                )
                history = [{"role": msg["role"], "content": msg["content"]} for msg in messages]

            # Usar Gemini para responder com streaming
            gemini_service = GeminiService()
            full_text = ""
            grounding_chunks = []

            # Executar o generator síncrono em um thread executor com streaming real
            import asyncio
            import queue
            import threading

            loop = asyncio.get_event_loop()
            chunk_queue = queue.Queue()

            # Função para processar chunks em thread separada
            def process_stream():
                try:
                    for chunk in gemini_service.query_with_rag_stream(
                        rag_store_name=session['rag_store_name'],
                        query=query.message,
                        history=history
                    ):
                        print(f"🔍 Chunk gerado: {chunk.get('type')} - {len(str(chunk))}")
                        if chunk.get('type') == 'grounding':
                            print(f"📚 Grounding chunks: {len(chunk.get('grounding_chunks', []))} chunks")
                        chunk_queue.put(chunk)
                except Exception as e:
                    print(f"❌ Erro no stream: {str(e)}")
                    chunk_queue.put({"type": "error", "message": str(e)})
                finally:
                    chunk_queue.put(None)  # Sinalizar fim do stream

            # Iniciar thread de processamento
            thread = threading.Thread(target=process_stream)
            thread.start()

            # Processar chunks conforme chegam
            while True:
                # Aguardar próximo chunk de forma não-bloqueante
                chunk = await loop.run_in_executor(None, chunk_queue.get)

                if chunk is None:  # Fim do stream
                    break
                if chunk["type"] == "content":
                    full_text += chunk["text"]
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk["type"] == "grounding":
                    grounding_chunks = chunk["grounding_chunks"]
                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk["type"] == "done":
                    full_text = chunk["full_text"]
                    grounding_chunks = chunk["grounding_chunks"]

                    # Salvar resposta do modelo
                    model_message_id = str(uuid.uuid4())
                    grounding_chunks_json = json.dumps(grounding_chunks)

                    await db.execute(
                        """
                        INSERT INTO messages (
                            id, session_id, role, content, grounding_chunks, created_at
                        )
                        VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
                        """,
                        model_message_id, session_id, "model",
                        full_text, grounding_chunks_json
                    )

                    # Atualizar contador de mensagens da sessão
                    await db.execute(
                        """
                        UPDATE chat_sessions
                        SET message_count = message_count + 2, updated_at = NOW()
                        WHERE id = $1
                        """,
                        session_id
                    )

                    # Atualizar cache do histórico
                    history.append({"role": "user", "content": query.message})
                    history.append({"role": "model", "content": full_text})
                    await redis_client.set(
                        cache_key,
                        json.dumps(history),
                        settings.redis_cache_ttl
                    )

                    yield f"data: {json.dumps(chunk)}\n\n"
                elif chunk["type"] == "error":
                    yield f"data: {json.dumps(chunk)}\n\n"

        except Exception as e:
            error_data = {"type": "error", "message": f"Erro ao processar query: {str(e)}"}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Deleta sessão de chat
    """
    # Verificar se sessão existe
    session = await db.fetch_one(
        """
        SELECT * FROM chat_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, user_id
    )

    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    try:
        # Deletar cache do Redis
        cache_key = f"chat_history:{session_id}"
        await redis_client.delete(cache_key)

        # Deletar do Gemini (RAG store)
        if session['rag_store_name']:
            gemini_service = GeminiService()
            await gemini_service.delete_rag_store(session['rag_store_name'])

        # Deletar do banco (cascade vai deletar mensagens)
        await db.execute(
            """
            UPDATE chat_sessions
            SET ended_at = NOW()
            WHERE id = $1
            """,
            session_id
        )

        return {"message": "Sessão encerrada com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar sessão: {str(e)}")


@router.get("/sessions/{session_id}/insights")
async def get_session_insights(
    session_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Busca insights dos documentos da sessão
    """
    # Verificar se sessão existe
    session = await db.fetch_one(
        """
        SELECT * FROM chat_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, user_id
    )

    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    try:
        # Verificar cache primeiro
        cache_key = f"insights:{session['rag_store_name']}"
        cached_insights = await redis_client.get(cache_key)

        if cached_insights:
            return json.loads(cached_insights)

        # Gerar insights usando Gemini
        gemini_service = GeminiService()
        insights = await gemini_service.generate_insights(session['rag_store_name'])

        # Cachear por 1 hora (3600 segundos)
        await redis_client.set(cache_key, json.dumps(insights), 3600)

        return insights

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar insights: {str(e)}")
