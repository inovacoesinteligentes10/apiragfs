"""
Rotas da API para gerenciamento de RAG Stores/Departments
Com controle de acesso baseado em permissões de usuário
"""
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime
import uuid

from ...config.database import db
from ...schemas.store import (
    StoreCreate,
    StoreResponse,
    StoreWithRagName,
    StorePermissionCreate,
    StorePermissionResponse,
    StoreWithPermissions
)
from ...middleware.auth import (
    get_current_user,
    has_store_access,
    can_manage_store,
    get_user_stores,
    add_store_permission,
    remove_store_permission
)

router = APIRouter()


@router.get("/", response_model=List[StoreWithPermissions])
async def list_stores(current_user: dict = Depends(get_current_user)):
    """
    Lista todos os stores/departments disponíveis para o usuário autenticado.

    - Admin: vê todos os stores
    - Usuário regular: vê apenas stores com permissão
    """
    user_id = current_user['id']
    role = current_user['role']

    # Query base
    if role == 'admin':
        # Admin vê todos os stores
        query = """
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
            LEFT JOIN documents d ON d.department = s.name
            GROUP BY s.id, s.user_id, s.name, s.display_name, s.description, s.icon, s.color, s.created_at, s.updated_at
            ORDER BY s.created_at DESC
        """
        stores = await db.fetch_all(query)
    else:
        # Usuário regular vê apenas stores com permissão
        query = """
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
            INNER JOIN user_store_permissions p ON p.store_id = s.id
            LEFT JOIN documents d ON d.department = s.name
            WHERE p.user_id = $1
            GROUP BY s.id, s.user_id, s.name, s.display_name, s.description, s.icon, s.color, s.created_at, s.updated_at
            ORDER BY s.created_at DESC
        """
        stores = await db.fetch_all(query, user_id)

    # Adicionar informações de permissão
    result = []
    for store in stores:
        store_dict = dict(store)
        store_dict['is_creator'] = str(store['user_id']) == user_id
        store_dict['can_manage'] = role == 'admin' or str(store['user_id']) == user_id
        result.append(store_dict)

    return result


@router.get("/{store_id}", response_model=StoreWithPermissions)
async def get_store(store_id: str, current_user: dict = Depends(get_current_user)):
    """
    Busca informações de um store específico.
    Requer permissão de acesso ao store.
    """
    user_id = current_user['id']
    role = current_user['role']

    # Verificar se tem acesso
    if not await has_store_access(user_id, store_id, role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este store"
        )

    # Buscar store
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
        LEFT JOIN documents d ON d.department = s.name
        WHERE s.id = $1
        GROUP BY s.id, s.user_id, s.name, s.display_name, s.description, s.icon, s.color, s.created_at, s.updated_at
        """,
        store_id
    )

    if not store:
        raise HTTPException(status_code=404, detail="Store não encontrado")

    store_dict = dict(store)
    store_dict['is_creator'] = str(store['user_id']) == user_id
    store_dict['can_manage'] = role == 'admin' or str(store['user_id']) == user_id

    return store_dict


@router.post("/", response_model=StoreResponse)
async def create_store(
    store: StoreCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Cria um novo store/department.
    O usuário criador e todos os admins recebem permissão automaticamente (via trigger).
    """
    user_id = current_user['id']

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

        # Buscar store criado (o trigger já adicionou as permissões)
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


@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: str,
    store: StoreCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Atualiza um store/department existente (apenas display_name, description, icon, color).
    Requer permissão de gerenciamento do store.
    """
    user_id = current_user['id']
    role = current_user['role']

    # Verificar se pode gerenciar
    if not await can_manage_store(user_id, store_id, role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para gerenciar este store"
        )

    # Verificar se store existe
    existing = await db.fetch_one(
        "SELECT id, name FROM rag_stores WHERE id = $1",
        store_id
    )

    if not existing:
        raise HTTPException(status_code=404, detail="Store não encontrado")

    try:
        # Atualizar apenas campos editáveis (não permite mudar o 'name')
        await db.execute(
            """
            UPDATE rag_stores
            SET display_name = $2, description = $3, icon = $4, color = $5, updated_at = NOW()
            WHERE id = $1
            """,
            store_id, store.display_name, store.description, store.icon, store.color
        )

        # Buscar store atualizado
        updated_store = await db.fetch_one(
            """
            SELECT
                id, user_id, name, display_name, description, icon, color,
                created_at, updated_at,
                (SELECT COUNT(*) FROM documents WHERE department = $2) as document_count
            FROM rag_stores
            WHERE id = $1
            """,
            store_id, existing['name']
        )

        return dict(updated_store)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar store: {str(e)}")


@router.delete("/{store_id}")
async def delete_store(
    store_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Deleta um store/department (se não tiver documentos).
    Requer permissão de gerenciamento do store.
    """
    user_id = current_user['id']
    role = current_user['role']

    # Verificar se pode gerenciar
    if not await can_manage_store(user_id, store_id, role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para deletar este store"
        )

    # Buscar nome do store
    store = await db.fetch_one(
        "SELECT name FROM rag_stores WHERE id = $1",
        store_id
    )

    if not store:
        raise HTTPException(status_code=404, detail="Store não encontrado")

    # Verificar se tem documentos
    doc_count = await db.fetch_one(
        """
        SELECT COUNT(*) as count FROM documents
        WHERE department = $1
        """,
        store['name']
    )

    if doc_count and doc_count['count'] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível deletar store com {doc_count['count']} documentos. Delete os documentos primeiro."
        )

    # Deletar store (CASCADE vai deletar as permissões automaticamente)
    await db.execute("DELETE FROM rag_stores WHERE id = $1", store_id)

    return {"message": f"Store '{store['name']}' deletado com sucesso"}


# ===== Endpoints de Gerenciamento de Permissões =====

@router.get("/{store_id}/permissions", response_model=List[StorePermissionResponse])
async def list_store_permissions(
    store_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Lista todos os usuários que têm acesso a um store.
    Requer permissão de gerenciamento do store.
    """
    user_id = current_user['id']
    role = current_user['role']

    # Verificar se pode gerenciar
    if not await can_manage_store(user_id, store_id, role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para ver as permissões deste store"
        )

    # Buscar permissões
    permissions = await db.fetch_all(
        """
        SELECT
            p.id,
            p.user_id,
            p.store_id,
            p.created_at,
            p.created_by,
            u.name as user_name,
            u.email as user_email,
            u.role as user_role
        FROM user_store_permissions p
        INNER JOIN users u ON u.id = p.user_id
        WHERE p.store_id = $1
        ORDER BY u.name
        """,
        store_id
    )

    return [dict(p) for p in permissions]


@router.post("/{store_id}/permissions", status_code=status.HTTP_201_CREATED)
async def add_user_to_store(
    store_id: str,
    permission: StorePermissionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Adiciona permissão de acesso a um store para um usuário.
    Requer permissão de gerenciamento do store.
    """
    user_id = current_user['id']
    role = current_user['role']

    # Verificar se pode gerenciar
    if not await can_manage_store(user_id, store_id, role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para adicionar usuários a este store"
        )

    # Verificar se store existe
    store = await db.fetch_one("SELECT id FROM rag_stores WHERE id = $1", store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store não encontrado")

    # Verificar se usuário existe
    target_user = await db.fetch_one("SELECT id FROM users WHERE id = $1", permission.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    try:
        await add_store_permission(store_id, permission.user_id, user_id)
        return {"message": "Permissão adicionada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao adicionar permissão: {str(e)}")


@router.delete("/{store_id}/permissions/{target_user_id}")
async def remove_user_from_store(
    store_id: str,
    target_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove permissão de acesso a um store de um usuário.
    Não é possível remover o criador do store.
    Requer permissão de gerenciamento do store.
    """
    user_id = current_user['id']
    role = current_user['role']

    # Verificar se pode gerenciar
    if not await can_manage_store(user_id, store_id, role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para remover usuários deste store"
        )

    try:
        removed = await remove_store_permission(store_id, target_user_id)
        if removed:
            return {"message": "Permissão removida com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Permissão não encontrada")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover permissão: {str(e)}")
