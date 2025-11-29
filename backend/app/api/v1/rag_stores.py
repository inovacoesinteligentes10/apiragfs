"""
Rotas da API para gerenciamento de RAG Stores
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import uuid

from ...config.database import db
from ...schemas.rag_store import RAGStoreCreate, RAGStoreResponse, RAGStoreUpdate
from ...services.gemini_service import GeminiService

router = APIRouter()
gemini_service = GeminiService()

@router.post("/", response_model=RAGStoreResponse)
async def create_rag_store(
    rag_store_create: RAGStoreCreate,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Cria um novo RAG Store
    """
    try:
        # Criar RAG Store no Gemini
        rag_store_name = await gemini_service.create_rag_store(
            display_name=rag_store_create.display_name
        )

        # Inserir no banco
        new_rag_store_id = str(uuid.uuid4())
        await db.execute(
            """
            INSERT INTO rag_stores (
                id, user_id, display_name, rag_store_name, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, NOW(), NOW())
            """,
            new_rag_store_id, user_id, rag_store_create.display_name, rag_store_name
        )

        rag_store = await db.fetch_one(
            "SELECT * FROM rag_stores WHERE id = $1",
            new_rag_store_id
        )

        return RAGStoreResponse(**dict(rag_store))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar RAG Store: {str(e)}")

@router.get("/", response_model=List[RAGStoreResponse])
async def list_rag_stores(
    user_id: str = "default-user",  # TODO: Pegar do token JWT
    skip: int = 0,
    limit: int = 100
):
    """
    Lista RAG Stores do usuário
    """
    rag_stores = await db.fetch_all(
        """
        SELECT * FROM rag_stores
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        """,
        user_id, limit, skip
    )

    return [RAGStoreResponse(**dict(store)) for store in rag_stores]

@router.get("/{rag_store_id}", response_model=RAGStoreResponse)
async def get_rag_store(
    rag_store_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Busca RAG Store por ID
    """
    rag_store = await db.fetch_one(
        """
        SELECT * FROM rag_stores
        WHERE id = $1 AND user_id = $2
        """,
        rag_store_id, user_id
    )

    if not rag_store:
        raise HTTPException(status_code=404, detail="RAG Store não encontrado")

    return RAGStoreResponse(**dict(rag_store))

@router.delete("/{rag_store_id}")
async def delete_rag_store(
    rag_store_id: str,
    user_id: str = "default-user"  # TODO: Pegar do token JWT
):
    """
    Deleta um RAG Store
    """
    # Buscar RAG Store
    rag_store = await db.fetch_one(
        """
        SELECT * FROM rag_stores
        WHERE id = $1 AND user_id = $2
        """,
        rag_store_id, user_id
    )

    if not rag_store:
        raise HTTPException(status_code=404, detail="RAG Store não encontrado")

    try:
        # Deletar do Gemini
        await gemini_service.delete_rag_store(rag_store['rag_store_name'])

        # Deletar do banco
        await db.execute(
            "DELETE FROM rag_stores WHERE id = $1",
            rag_store_id
        )

        return {"message": "RAG Store deletado com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao deletar RAG Store: {str(e)}")

@router.put("/{rag_store_id}", response_model=RAGStoreResponse)
async def update_rag_store(
    rag_store_id: str,
    rag_store_update: RAGStoreUpdate,
    user_id: str = "default-user" # TODO: Pegar do token JWT
):
    """
    Atualiza um RAG Store existente
    """
    existing_rag_store = await db.fetch_one(
        """
        SELECT * FROM rag_stores
        WHERE id = $1 AND user_id = $2
        """,
        rag_store_id, user_id
    )

    if not existing_rag_store:
        raise HTTPException(status_code=404, detail="RAG Store não encontrado")

    update_fields = {}
    if rag_store_update.display_name is not None:
        update_fields["display_name"] = rag_store_update.display_name
        # Atualizar no Gemini também
        await gemini_service.update_rag_store(
            name=existing_rag_store['rag_store_name'],
            new_display_name=rag_store_update.display_name
        )

    if not update_fields:
        return RAGStoreResponse(**dict(existing_rag_store))

    set_clauses = ", ".join([f"{key} = ${i+3}" for i, key in enumerate(update_fields.keys())])
    values = list(update_fields.values())

    updated_rag_store = await db.fetch_one(
        f"""
        UPDATE rag_stores
        SET {set_clauses}, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
        """,
        rag_store_id, user_id, *values
    )

    return RAGStoreResponse(**dict(updated_rag_store))