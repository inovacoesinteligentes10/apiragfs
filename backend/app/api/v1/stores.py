"""
Rotas da API para gerenciamento de RAG Stores/Departments
"""
from typing import List
from fastapi import APIRouter, HTTPException
from datetime import datetime
import uuid

from ...config.database import db
from ...schemas.store import StoreCreate, StoreResponse, StoreWithRagName

router = APIRouter()


@router.get("/", response_model=List[StoreWithRagName])
async def list_stores(user_id: str = "default-user"):
    """
    Lista todos os stores/departments disponíveis para o usuário
    """
    stores = await db.fetch_all(
        """
        SELECT
            s.id,
            s.user_id,
            s.name,
            s.display_name,
            s.description,
            s.icon,
            s.color,
            s.created_at,
            s.updated_at,
            COUNT(DISTINCT d.id) as document_count,
            MAX(d.rag_store_name) as rag_store_name
        FROM rag_stores s
        LEFT JOIN documents d ON d.user_id = s.user_id AND d.department = s.name
        WHERE s.user_id = $1
        GROUP BY s.id, s.user_id, s.name, s.display_name, s.description, s.icon, s.color, s.created_at, s.updated_at
        ORDER BY s.name
        """,
        user_id
    )

    return [dict(store) for store in stores]


@router.get("/{store_name}", response_model=StoreWithRagName)
async def get_store(store_name: str, user_id: str = "default-user"):
    """
    Busca informações de um store específico
    """
    store = await db.fetch_one(
        """
        SELECT
            s.id,
            s.user_id,
            s.name,
            s.display_name,
            s.description,
            s.icon,
            s.color,
            s.created_at,
            s.updated_at,
            COUNT(DISTINCT d.id) as document_count,
            MAX(d.rag_store_name) as rag_store_name
        FROM rag_stores s
        LEFT JOIN documents d ON d.user_id = s.user_id AND d.department = s.name
        WHERE s.user_id = $1 AND s.name = $2
        GROUP BY s.id, s.user_id, s.name, s.display_name, s.description, s.icon, s.color, s.created_at, s.updated_at
        """,
        user_id, store_name
    )

    if not store:
        raise HTTPException(status_code=404, detail="Store não encontrado")

    return dict(store)


@router.post("/", response_model=StoreResponse)
async def create_store(store: StoreCreate, user_id: str = "default-user"):
    """
    Cria um novo store/department
    """
    try:
        store_id = str(uuid.uuid4())

        await db.execute(
            """
            INSERT INTO rag_stores (id, user_id, name, display_name, description, icon, color, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            """,
            store_id, user_id, store.name, store.display_name,
            store.description, store.icon, store.color
        )

        # Buscar store criado
        created_store = await db.fetch_one(
            """
            SELECT
                id, user_id, name, display_name, description, icon, color,
                0 as document_count, created_at, updated_at
            FROM rag_stores
            WHERE id = $1
            """,
            store_id
        )

        return dict(created_store)

    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Store com este nome já existe")
        raise HTTPException(status_code=500, detail=f"Erro ao criar store: {str(e)}")


@router.delete("/{store_name}")
async def delete_store(store_name: str, user_id: str = "default-user"):
    """
    Deleta um store/department (se não tiver documentos)
    """
    # Verificar se tem documentos
    doc_count = await db.fetch_one(
        """
        SELECT COUNT(*) as count FROM documents
        WHERE user_id = $1 AND department = $2
        """,
        user_id, store_name
    )

    if doc_count and doc_count['count'] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível deletar store com {doc_count['count']} documentos. Delete os documentos primeiro."
        )

    # Deletar store
    result = await db.execute(
        "DELETE FROM rag_stores WHERE user_id = $1 AND name = $2",
        user_id, store_name
    )

    return {"message": f"Store '{store_name}' deletado com sucesso"}
