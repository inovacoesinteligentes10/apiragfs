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
from ...middleware.auth import get_current_user

router = APIRouter(tags=["Chat"])


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria uma nova sessão de chat
    """
    user_id = current_user['id']

    print("═══════════════════════════════════════════════════════")
    print("🔍 DEBUG BACKEND: create_chat_session - Início")
    print(f"👤 User ID: {user_id}")
    print(f"📦 RAG Store Name recebido: {session_data.rag_store_name}")
    print("═══════════════════════════════════════════════════════")

    try:
        # Validar se o RAG store existe antes de criar a sessão
        gemini_service = GeminiService()
        print(f"🔍 Validando se RAG store existe: {session_data.rag_store_name}")

        store_exists = await gemini_service.validate_rag_store(session_data.rag_store_name)
        print(f"✅ Resultado da validação: {store_exists}")

        if not store_exists:
            print(f"❌ RAG store NÃO EXISTE: {session_data.rag_store_name}")
            raise HTTPException(
                status_code=400,
                detail=f"O RAG store '{session_data.rag_store_name}' não existe ou está inacessível. Por favor, verifique se os documentos foram processados corretamente."
            )

        session_id = str(uuid.uuid4())
        print(f"🆔 Session ID gerado: {session_id}")

        # Inserir sessão no banco (sem document_id e document_name)
        print(f"💾 Inserindo sessão no banco de dados...")
        await db.execute(
            """
            INSERT INTO chat_sessions (
                id, user_id, rag_store_name, started_at, created_at, updated_at
            ) VALUES ($1, $2, $3, NOW(), NOW(), NOW())
            """,
            session_id, user_id, session_data.rag_store_name
        )
        print(f"✅ Sessão inserida no banco!")

        # Buscar sessão criada
        session = await db.fetch_one(
            "SELECT * FROM chat_sessions WHERE id = $1",
            session_id
        )
        print(f"✅ Sessão criada com sucesso!")
        print(f"📦 Sessão completa: {dict(session)}")

        return ChatSessionResponse(**dict(session))

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERRO ao criar sessão: {str(e)}")
        print(f"❌ Tipo de erro: {type(e).__name__}")
        import traceback
        print(f"❌ Stack trace completo:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao criar sessão: {str(e)}")


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Lista sessões de chat do usuário (todas as sessões, incluindo finalizadas)
    """
    user_id = current_user['id']

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


@router.get("/sessions/{session_id}/validate")
async def validate_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Valida se a sessão existe e se o RAG store ainda está acessível
    Retorna status da validação sem marcar a sessão como finalizada
    """
    user_id = current_user['id']

    session = await db.fetch_one(
        """
        SELECT * FROM chat_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, user_id
    )

    if not session:
        return {
            "valid": False,
            "reason": "session_not_found",
            "message": "Sessão não encontrada"
        }

    # Validar se o RAG store ainda existe
    if session['rag_store_name']:
        gemini_service = GeminiService()
        try:
            store_exists = await gemini_service.validate_rag_store(session['rag_store_name'])

            if not store_exists:
                return {
                    "valid": False,
                    "reason": "rag_store_not_found",
                    "message": "O RAG store desta sessão não existe mais",
                    "rag_store_name": session['rag_store_name']
                }
        except Exception as e:
            print(f"❌ Erro ao validar RAG store: {str(e)}")
            return {
                "valid": False,
                "reason": "rag_store_error",
                "message": f"Erro ao validar RAG store: {str(e)}",
                "rag_store_name": session['rag_store_name']
            }

    return {
        "valid": True,
        "session_id": session_id,
        "rag_store_name": session['rag_store_name']
    }


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Busca sessão de chat por ID e valida se o RAG store ainda existe
    """
    user_id = current_user['id']

    session = await db.fetch_one(
        """
        SELECT * FROM chat_sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, user_id
    )

    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    # Validar se o RAG store ainda existe (se a sessão tiver um)
    if session['rag_store_name']:
        gemini_service = GeminiService()
        store_exists = await gemini_service.validate_rag_store(session['rag_store_name'])

        if not store_exists:
            # Marcar sessão como finalizada
            await db.execute(
                """
                UPDATE chat_sessions
                SET ended_at = NOW()
                WHERE id = $1
                """,
                session_id
            )
            raise HTTPException(
                status_code=410,  # Gone - recurso não existe mais
                detail="Esta sessão referencia um RAG store que não existe mais. A sessão foi marcada como finalizada."
            )

    return ChatSessionResponse(**dict(session))


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Busca mensagens de uma sessão
    """
    user_id = current_user['id']

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

    # Converter grounding_chunks de string JSON para dict antes de criar MessageResponse
    result = []
    for msg in messages:
        msg_dict = dict(msg)
        # Desserializar grounding_chunks se for string
        if isinstance(msg_dict.get('grounding_chunks'), str):
            try:
                msg_dict['grounding_chunks'] = json.loads(msg_dict['grounding_chunks'])
            except (json.JSONDecodeError, TypeError):
                msg_dict['grounding_chunks'] = None
        result.append(MessageResponse(**msg_dict))

    return result


@router.post("/sessions/{session_id}/query", response_model=ChatQueryResponse)
async def query_chat(
    session_id: str,
    query: ChatQueryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Envia uma query para o chat e retorna resposta
    """
    user_id = current_user['id']

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
    current_user: dict = Depends(get_current_user)
):
    """
    Envia uma query para o chat e retorna resposta com streaming (SSE)
    """
    user_id = current_user['id']

    print("═══════════════════════════════════════════════════════")
    print("🔍 DEBUG BACKEND: query_chat_stream - Início")
    print(f"📝 Session ID: {session_id}")
    print(f"👤 User ID: {user_id}")
    print(f"💬 Query: {query.message[:100]}...")
    print("═══════════════════════════════════════════════════════")

    async def event_generator():
        try:
            # Verificar se sessão existe
            print(f"🔍 Verificando se sessão existe: {session_id}")
            session = await db.fetch_one(
                """
                SELECT * FROM chat_sessions
                WHERE id = $1 AND user_id = $2
                """,
                session_id, user_id
            )

            if not session:
                print(f"❌ Sessão não encontrada no banco de dados")
                print(f"❌ Session ID procurado: {session_id}")
                print(f"❌ User ID: {user_id}")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Sessão não encontrada'})}\n\n"
                return

            print(f"✅ Sessão encontrada!")
            print(f"📦 RAG Store Name da sessão: {session['rag_store_name']}")
            print(f"📅 Iniciada em: {session['started_at']}")
            print(f"🔢 Message count: {session.get('message_count', 0)}")

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
            print(f"🤖 Iniciando query com Gemini...")
            print(f"📝 RAG Store que será usado: {session['rag_store_name']}")

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
                    print(f"🚀 Iniciando stream com RAG store: {session['rag_store_name']}")
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
                    print(f"❌ ERRO NO STREAM: {str(e)}")
                    print(f"❌ Tipo de erro: {type(e).__name__}")
                    print(f"❌ RAG Store que causou erro: {session['rag_store_name']}")
                    import traceback
                    print(f"❌ Stack trace completo:")
                    traceback.print_exc()
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


@router.post("/cleanup-orphaned")
async def cleanup_orphaned_sessions(
    current_user: dict = Depends(get_current_user)
):
    """
    Limpa sessões órfãs (que referenciam RAG stores inexistentes)
    """
    user_id = current_user['id']

    try:
        # Buscar todas as sessões ativas
        sessions = await db.fetch_all(
            """
            SELECT id, rag_store_name FROM chat_sessions
            WHERE user_id = $1 AND ended_at IS NULL AND rag_store_name IS NOT NULL
            """,
            user_id
        )

        gemini_service = GeminiService()
        orphaned_count = 0

        for session in sessions:
            # Validar se o RAG store existe
            store_exists = await gemini_service.validate_rag_store(session['rag_store_name'])

            if not store_exists:
                # Marcar como finalizada
                await db.execute(
                    """
                    UPDATE chat_sessions
                    SET ended_at = NOW()
                    WHERE id = $1
                    """,
                    session['id']
                )
                orphaned_count += 1

        return {
            "message": f"{orphaned_count} sessões órfãs foram limpas",
            "total_checked": len(sessions),
            "orphaned_removed": orphaned_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao limpar sessões: {str(e)}")


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Deleta sessão de chat
    """
    user_id = current_user['id']

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

        # IMPORTANTE: NÃO deletar o RAG store do Gemini!
        # O RAG store é compartilhado entre múltiplas sessões do mesmo department.
        # Deletar o RAG store corromperia todos os documentos daquele store.
        # O RAG store deve ser gerenciado apenas quando documentos são deletados.
        #
        # REMOVIDO:
        # if session['rag_store_name']:
        #     gemini_service = GeminiService()
        #     await gemini_service.delete_rag_store(session['rag_store_name'])

        # Deletar do banco (cascade vai deletar mensagens)
        await db.execute(
            """
            UPDATE chat_sessions
            SET ended_at = NOW()
            WHERE id = $1
            """,
            session_id
        )

        print(f"✅ Sessão {session_id} encerrada (RAG store preservado)")

        return {"message": "Sessão encerrada com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar sessão: {str(e)}")


@router.get("/sessions/{session_id}/insights")
async def get_session_insights(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Busca insights dos documentos da sessão
    """
    user_id = current_user['id']

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
        # Verificar cache primeiro (insights são gerados após upload)
        cache_key = f"insights:{session['rag_store_name']}"
        cached_insights = await redis_client.get(cache_key)

        if cached_insights:
            print(f"✅ Insights retornados do cache para: {session['rag_store_name']}")
            return json.loads(cached_insights)

        # Se não estiver em cache, gerar agora (fallback)
        print(f"⚠️ Cache miss - Gerando insights sob demanda para: {session['rag_store_name']}")
        gemini_service = GeminiService()
        insights = await gemini_service.generate_insights(session['rag_store_name'])

        # Cachear por 24 horas (86400 segundos)
        await redis_client.set(cache_key, json.dumps(insights), 86400)

        return insights

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar insights: {str(e)}")
