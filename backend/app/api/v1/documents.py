"""
Rotas da API para gerenciamento de documentos
"""
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, BackgroundTasks
from datetime import datetime
import uuid
import asyncio
import json

from ...config import settings
from ...config.database import db
from ...config.minio import minio_client
from ...config.redis import redis_client
from ...schemas.document import DocumentCreate, DocumentResponse, DocumentStatus
from ...services.gemini_service import GeminiService

router = APIRouter()


@router.post("/reprocess-documents")
async def reprocess_documents(background_tasks: BackgroundTasks, user_id: str = "default-user"):
    """
    Reprocessa documentos que estão com status 'uploaded' (sem RAG store)
    """
    try:
        # Buscar documentos que precisam ser reprocessados
        documents = await db.fetch_all(
            """
            SELECT id, name, type, minio_url, minio_bucket, department
            FROM documents
            WHERE user_id = $1 AND status = 'uploaded' AND rag_store_name IS NULL
            """,
            user_id
        )

        if not documents:
            return {"message": "Nenhum documento precisa ser reprocessado", "count": 0}

        # Baixar e reprocessar cada documento
        for doc in documents:
            # Baixar do MinIO - remover bucket do path se estiver duplicado
            object_name = doc['minio_url']
            if object_name.startswith(f"{doc['minio_bucket']}/"):
                object_name = object_name[len(f"{doc['minio_bucket']}/"):]

            response = minio_client.client.get_object(
                bucket_name=doc['minio_bucket'],
                object_name=object_name
            )
            file_data = response.read()
            response.close()
            response.release_conn()

            # Iniciar reprocessamento em background
            metadata = {"department": doc['department']} if doc['department'] else None

            background_tasks.add_task(
                process_document_background,
                doc['id'],
                file_data,
                doc['name'],
                user_id,
                metadata
            )

        return {
            "message": f"{len(documents)} documentos foram enviados para reprocessamento",
            "count": len(documents),
            "documents": [{"id": doc['id'], "name": doc['name']} for doc in documents]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao reprocessar documentos: {str(e)}")


@router.post("/validate-stores")
async def validate_and_fix_stores(user_id: str = "default-user"):
    """
    Valida todos os RAG stores e recria os que não existem mais no Gemini
    """
    try:
        gemini_service = GeminiService()

        # Buscar todos os documentos completos
        documents = await db.fetch_all(
            """
            SELECT DISTINCT department, rag_store_name
            FROM documents
            WHERE user_id = $1 AND status = 'completed' AND rag_store_name IS NOT NULL
            """,
            user_id
        )

        results = []
        for doc in documents:
            department = doc['department']
            rag_store_name = doc['rag_store_name']

            # Validar se o RAG store existe
            print(f"🔍 Validando RAG store de {department}: {rag_store_name}")
            store_exists = await gemini_service.validate_rag_store(rag_store_name)

            if not store_exists:
                print(f"⚠️ RAG store não existe. Marcando documentos para reprocessamento...")

                # Marcar documentos como pending para reprocessamento
                await db.execute(
                    """
                    UPDATE documents
                    SET status = 'uploaded', progress_percent = 0, rag_store_name = NULL
                    WHERE department = $1 AND user_id = $2
                    """,
                    department, user_id
                )

                results.append({
                    "department": department,
                    "status": "invalid",
                    "action": "marked_for_reprocess"
                })
            else:
                print(f"✅ RAG store válido")
                results.append({
                    "department": department,
                    "status": "valid",
                    "action": "none"
                })

        return {
            "message": "Validação concluída",
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao validar stores: {str(e)}")


async def process_document_background(
    document_id: str,
    file_content: bytes,
    file_name: str,
    user_id: str,
    metadata: Optional[dict] = None
):
    """Processa o documento em background com Gemini File Search"""
    try:
        start_time = datetime.now()
        gemini_service = GeminiService()

        # Status: Verificando RAG Store (20%)
        await db.execute(
            """
            UPDATE documents
            SET status = $1, progress_percent = $2, status_message = $3, updated_at = NOW()
            WHERE id = $4
            """,
            DocumentStatus.EXTRACTING, 20, "Verificando RAG Store global...", document_id
        )

        # Buscar informações do department/store
        store_info = await db.fetch_one(
            """
            SELECT name, display_name FROM rag_stores
            WHERE user_id = $1 AND name = $2
            """,
            user_id, metadata.get('department', 'geral') if metadata else 'geral'
        )

        department = store_info['name'] if store_info else 'geral'
        department_display = store_info['display_name'] if store_info else 'Geral'

        # Verificar se já existe RAG Store para este department
        existing_rag_store = await db.fetch_one(
            """
            SELECT rag_store_name FROM documents
            WHERE user_id = $1 AND department = $2 AND rag_store_name IS NOT NULL
            LIMIT 1
            """,
            user_id, department
        )

        if existing_rag_store and existing_rag_store['rag_store_name']:
            # Verificar se o RAG Store ainda existe no Gemini
            rag_store_name = existing_rag_store['rag_store_name']
            print(f"🔍 Verificando RAG Store de {department_display}: {rag_store_name}")

            store_exists = await gemini_service.validate_rag_store(rag_store_name)

            if store_exists:
                print(f"📦 Usando RAG Store existente de {department_display}: {rag_store_name}")
            else:
                print(f"⚠️ RAG Store não existe mais. Criando novo...")
                # Criar novo RAG Store
                rag_store_name = await gemini_service.create_rag_store(
                    display_name=f"{department_display} - {user_id}"
                )
                print(f"✨ Novo RAG Store criado para {department_display}: {rag_store_name}")
        else:
            # Criar novo RAG Store para este department
            rag_store_name = await gemini_service.create_rag_store(
                display_name=f"{department_display} - {user_id}"
            )
            print(f"✨ Novo RAG Store criado para {department_display}: {rag_store_name}")

        # Status: Fazendo upload para Gemini (50%)
        await db.execute(
            """
            UPDATE documents
            SET status = $1, progress_percent = $2, status_message = $3, updated_at = NOW()
            WHERE id = $4
            """,
            DocumentStatus.CHUNKING, 50, "Fazendo upload para Gemini File Search...", document_id
        )

        # Salvar arquivo temporariamente para upload
        import tempfile
        import os
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file_name)[1]) as tmp_file:
            tmp_file.write(file_content)
            tmp_file_path = tmp_file.name

        try:
            # Determinar MIME type
            mime_type = "application/pdf" if file_name.lower().endswith('.pdf') else "text/plain"

            # Upload para RAG Store com callback de progresso
            async def progress_callback(elapsed_seconds: int):
                # Atualizar progresso baseado no tempo decorrido
                # 50-80% durante upload (até 300s)
                progress = min(80, 50 + int((elapsed_seconds / 300.0) * 30))
                await db.execute(
                    """
                    UPDATE documents
                    SET progress_percent = $1,
                        status_message = $2,
                        updated_at = NOW()
                    WHERE id = $3
                    """,
                    progress,
                    f"Processando com Gemini... ({elapsed_seconds}s)",
                    document_id
                )

            file_info = await gemini_service.upload_to_rag_store(
                rag_store_name=rag_store_name,
                file_path=tmp_file_path,
                mime_type=mime_type,
                metadata=metadata,
                progress_callback=progress_callback
            )

            text_length = len(file_content)
            # Calcular chunks: mínimo 1, máximo baseado no tamanho
            # Cada chunk tem aproximadamente 1000 caracteres
            chunks = max(1, text_length // 1000)

            # Status: Indexando (80%)
            await db.execute(
                """
                UPDATE documents
                SET status = $1, progress_percent = $2, status_message = $3,
                    text_length = $4, chunks = $5, updated_at = NOW()
                WHERE id = $6
                """,
                DocumentStatus.INDEXING, 80, "Indexando no Gemini...",
                text_length, chunks, document_id
            )

            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

            # Status: Completo (100%)
            await db.execute(
                """
                UPDATE documents
                SET status = $1, progress_percent = $2, status_message = $3,
                    processing_time = $4, extraction_method = $5,
                    rag_store_name = $6, department = $7, updated_at = NOW()
                WHERE id = $8
                """,
                DocumentStatus.COMPLETED, 100, "Processamento concluído",
                processing_time, "Gemini File API", rag_store_name, department, document_id
            )

            # Gerar insights em background e cachear por 24 horas
            try:
                print(f"🔍 Gerando insights para RAG Store: {rag_store_name}")
                insights = await gemini_service.generate_insights(rag_store_name)

                if insights:
                    cache_key = f"insights:{rag_store_name}"
                    # Cache por 24 horas (86400 segundos)
                    await redis_client.set(cache_key, json.dumps(insights), 86400)
                    print(f"✅ Insights gerados e cacheados: {len(insights)} insights")
            except Exception as e:
                print(f"⚠️ Erro ao gerar insights (não crítico): {str(e)}")

        finally:
            # Limpar arquivo temporário
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except Exception as e:
        # Atualizar com erro
        await db.execute(
            """
            UPDATE documents
            SET status = $1, progress_percent = $2, status_message = $3,
                error_message = $4, updated_at = NOW()
            WHERE id = $5
            """,
            DocumentStatus.ERROR, 0, "Erro no processamento", str(e), document_id
        )


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None),
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Upload de documento com metadados opcionais

    Args:
        file: Arquivo para upload
        metadata: JSON string com metadados (ex: {"author": "Nome", "category": "Categoria", "tags": ["tag1", "tag2"]})
        user_id: ID do usuário
    """
    # Validar extensão
    file_extension = f".{file.filename.split('.')[-1].lower()}" if '.' in file.filename else ''
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Extensão de arquivo não permitida. Permitidos: {', '.join(settings.allowed_extensions)}"
        )

    # Parsear metadados se fornecidos
    metadata_dict = None
    if metadata:
        try:
            metadata_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Metadados inválidos. Deve ser um JSON válido.")

    # Ler conteúdo do arquivo
    file_content = await file.read()
    file_size = len(file_content)

    # Validar tamanho
    if file_size > settings.max_upload_size:
        raise HTTPException(
            status_code=400,
            detail=f"Arquivo muito grande. Máximo: {settings.max_upload_size / (1024*1024)}MB"
        )

    try:
        # Gerar ID único
        document_id = str(uuid.uuid4())

        # Upload para MinIO
        minio_path = f"documents/{user_id}/{document_id}/{file.filename}"
        minio_url = minio_client.upload_file(
            file_content=file_content,
            object_name=minio_path,
            content_type=file.content_type or "application/octet-stream"
        )

        # Inserir no banco com status "uploaded" e metadados
        await db.execute(
            """
            INSERT INTO documents (
                id, user_id, name, original_name, type, size,
                minio_url, minio_bucket, status, progress_percent, status_message,
                upload_date, extraction_method, metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12, $13::jsonb, NOW(), NOW())
            """,
            document_id, user_id, file.filename, file.filename,
            file_extension.replace('.', '').upper(), file_size,
            minio_url, minio_client.bucket, DocumentStatus.UPLOADED, 0,
            "Upload concluído, aguardando processamento...",
            "Gemini File API",
            json.dumps(metadata_dict) if metadata_dict else '{}'
        )

        # Processar documento em background
        background_tasks.add_task(
            process_document_background,
            document_id, file_content, file.filename, user_id, metadata_dict
        )

        # Buscar documento inserido
        document = await db.fetch_one(
            "SELECT * FROM documents WHERE id = $1",
            document_id
        )

        return DocumentResponse(**dict(document))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {str(e)}")


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    user_id: str = "default-user",  # TODO: Pegar do token JWT
    skip: int = 0,
    limit: int = 100
):
    """
    Lista documentos do usuário
    """
    documents = await db.fetch_all(
        """
        SELECT * FROM documents
        WHERE user_id = $1
        ORDER BY upload_date DESC
        LIMIT $2 OFFSET $3
        """,
        user_id, limit, skip
    )

    return [DocumentResponse(**dict(doc)) for doc in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Busca documento por ID
    """
    document = await db.fetch_one(
        """
        SELECT * FROM documents
        WHERE id = $1 AND user_id = $2
        """,
        document_id, user_id
    )

    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    return DocumentResponse(**dict(document))


@router.patch("/{document_id}/move-store")
async def move_document_to_store(
    document_id: str,
    target_store: str,
    background_tasks: BackgroundTasks,
    user_id: str = "default-user"
):
    """
    Move um documento para outro store (departamento)
    """
    try:
        # Buscar documento
        document = await db.fetch_one(
            """
            SELECT * FROM documents
            WHERE id = $1 AND user_id = $2
            """,
            document_id, user_id
        )

        if not document:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        # Verificar se o store de destino existe
        store = await db.fetch_one(
            """
            SELECT * FROM rag_stores
            WHERE user_id = $1 AND name = $2
            """,
            user_id, target_store
        )

        if not store:
            raise HTTPException(status_code=404, detail=f"Store '{target_store}' não encontrado")

        old_store = document['department']

        # Marcar documento como 'uploaded' para reprocessamento
        # Resetar todos os campos de processamento
        await db.execute(
            """
            UPDATE documents
            SET department = $1,
                status = 'uploaded',
                progress_percent = 0,
                status_message = NULL,
                error_message = NULL,
                rag_store_name = NULL,
                text_length = NULL,
                chunks = NULL,
                processing_time = NULL,
                extraction_method = NULL,
                updated_at = NOW()
            WHERE id = $2
            """,
            target_store, document_id
        )

        # Baixar arquivo do MinIO e reprocessar
        object_name = document['minio_url']
        if object_name.startswith(f"{document['minio_bucket']}/"):
            object_name = object_name[len(f"{document['minio_bucket']}/"):]

        response = minio_client.client.get_object(
            bucket_name=document['minio_bucket'],
            object_name=object_name
        )
        file_data = response.read()
        response.close()
        response.release_conn()

        # Reprocessar em background com novo department
        metadata = {"department": target_store}
        background_tasks.add_task(
            process_document_background,
            document_id,
            file_data,
            document['name'],
            user_id,
            metadata
        )

        return {
            "message": f"Documento movido de '{old_store}' para '{target_store}' e enviado para reprocessamento",
            "document_id": document_id,
            "old_store": old_store,
            "new_store": target_store
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao mover documento: {str(e)}")


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Deleta documento
    """
    # Buscar documento
    document = await db.fetch_one(
        """
        SELECT * FROM documents
        WHERE id = $1 AND user_id = $2
        """,
        document_id, user_id
    )

    if not document:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    try:
        # Deletar do MinIO
        minio_path = document['minio_url'].split(f"{minio_client.bucket}/")[-1]
        minio_client.delete_file(minio_path)

        # Deletar do banco (cascade vai deletar mensagens relacionadas)
        await db.execute(
            "DELETE FROM documents WHERE id = $1",
            document_id
        )

        # Invalidar cache de insights do RAG Store
        if document.get('rag_store_name'):
            cache_key = f"insights:{document['rag_store_name']}"
            await redis_client.delete(cache_key)
            print(f"🗑️ Cache de insights invalidado para: {document['rag_store_name']}")

        return {"message": "Documento deletado com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar documento: {str(e)}")
