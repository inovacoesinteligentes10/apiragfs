"""
Endpoints de gerenciamento de usuários (Admin)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
import uuid
from datetime import datetime

from app.schemas.auth import UserResponse, UserCreate
from app.schemas.user import UserUpdate, UserListResponse, UserStats
from app.utils.auth import hash_password
from app.middleware.auth import get_current_active_user, require_admin
from app.config.database import db

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("", response_model=List[UserListResponse], dependencies=[Depends(require_admin)])
async def list_users(
    role: Optional[str] = Query(None, description="Filtrar por role"),
    is_active: Optional[bool] = Query(None, description="Filtrar por status"),
    search: Optional[str] = Query(None, description="Buscar por nome ou email"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Listar todos os usuários (Admin only)

    Args:
        role: Filtro opcional por role
        is_active: Filtro opcional por status ativo
        search: Busca por nome ou email
        limit: Limite de resultados
        offset: Offset para paginação

    Returns:
        Lista de usuários com estatísticas
    """
    # Construir query dinamicamente
    conditions = []
    params = []
    param_count = 1

    if role:
        conditions.append(f"u.role = ${param_count}")
        params.append(role)
        param_count += 1

    if is_active is not None:
        conditions.append(f"u.is_active = ${param_count}")
        params.append(is_active)
        param_count += 1

    if search:
        conditions.append(f"(u.name ILIKE ${param_count} OR u.email ILIKE ${param_count})")
        params.append(f"%{search}%")
        param_count += 1

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    # Adicionar limit e offset
    params.append(limit)
    limit_param = f"${param_count}"
    param_count += 1

    params.append(offset)
    offset_param = f"${param_count}"

    query = f"""
        SELECT
            u.id,
            u.email,
            u.name,
            u.role,
            u.is_active,
            u.created_at,
            u.last_login,
            COUNT(DISTINCT d.id) as total_documents,
            COUNT(DISTINCT cs.id) as total_sessions,
            COUNT(DISTINCT m.id) as total_messages
        FROM users u
        LEFT JOIN documents d ON d.user_id::text = u.id::text
        LEFT JOIN chat_sessions cs ON cs.user_id::text = u.id::text
        LEFT JOIN messages m ON m.session_id = cs.id
        {where_clause}
        GROUP BY u.id, u.email, u.name, u.role, u.is_active, u.created_at, u.last_login
        ORDER BY u.created_at DESC
        LIMIT {limit_param}
        OFFSET {offset_param}
    """

    users = await db.fetch_all(query, *params)

    return [
        UserListResponse(
            id=str(user['id']),
            email=user['email'],
            name=user['name'],
            role=user['role'],
            is_active=user['is_active'],
            created_at=user['created_at'],
            last_login=user['last_login'],
            stats=UserStats(
                total_documents=user['total_documents'],
                total_sessions=user['total_sessions'],
                total_messages=user['total_messages']
            )
        )
        for user in users
    ]


@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_users_stats():
    """
    Obter estatísticas gerais de usuários (Admin only)

    Returns:
        Estatísticas agregadas de usuários
    """
    stats = await db.fetch_one("""
        SELECT
            COUNT(*) as total_users,
            COUNT(*) FILTER (WHERE is_active = TRUE) as active_users,
            COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_users,
            COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
            COUNT(*) FILTER (WHERE role = 'professor') as professor_count,
            COUNT(*) FILTER (WHERE role = 'student') as student_count,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
            COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as active_users_week
        FROM users
    """)

    return dict(stats)


@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def get_user(user_id: str):
    """
    Obter detalhes de um usuário específico (Admin only)

    Args:
        user_id: ID do usuário

    Returns:
        Informações detalhadas do usuário
    """
    user = await db.fetch_one(
        """
        SELECT id, email, name, role, is_active, created_at, last_login
        FROM users
        WHERE id = $1
        """,
        uuid.UUID(user_id)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])

    return UserResponse(**user_dict)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_user(user_data: UserCreate):
    """
    Criar novo usuário (Admin only)

    Args:
        user_data: Dados do novo usuário

    Returns:
        Usuário criado
    """
    # Verificar se email já existe
    existing_user = await db.fetch_one(
        "SELECT id FROM users WHERE email = $1",
        user_data.email
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash da senha
    password_hash = hash_password(user_data.password)

    # Criar usuário
    user_id = str(uuid.uuid4())

    user = await db.fetch_one(
        """
        INSERT INTO users (id, email, name, role, password_hash, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING id, email, name, role, is_active, created_at, last_login
        """,
        user_id,
        user_data.email,
        user_data.name,
        user_data.role,
        password_hash
    )

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])

    return UserResponse(**user_dict)


@router.put("/{user_id}", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def update_user(user_id: str, user_data: UserUpdate):
    """
    Atualizar usuário existente (Admin only)

    Args:
        user_id: ID do usuário
        user_data: Dados para atualização

    Returns:
        Usuário atualizado
    """
    # Verificar se usuário existe
    existing_user = await db.fetch_one(
        "SELECT id FROM users WHERE id = $1",
        uuid.UUID(user_id)
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Construir query de atualização dinamicamente
    updates = []
    params = []
    param_count = 1

    if user_data.name is not None:
        updates.append(f"name = ${param_count}")
        params.append(user_data.name)
        param_count += 1

    if user_data.email is not None:
        # Verificar se email já está em uso por outro usuário
        email_check = await db.fetch_one(
            "SELECT id FROM users WHERE email = $1 AND id != $2",
            user_data.email,
            uuid.UUID(user_id)
        )
        if email_check:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )

        updates.append(f"email = ${param_count}")
        params.append(user_data.email)
        param_count += 1

    if user_data.role is not None:
        updates.append(f"role = ${param_count}")
        params.append(user_data.role)
        param_count += 1

    if user_data.is_active is not None:
        updates.append(f"is_active = ${param_count}")
        params.append(user_data.is_active)
        param_count += 1

    if user_data.password is not None:
        password_hash = hash_password(user_data.password)
        updates.append(f"password_hash = ${param_count}")
        params.append(password_hash)
        param_count += 1

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    # Adicionar user_id no final dos params
    params.append(uuid.UUID(user_id))
    user_id_param = f"${param_count}"

    query = f"""
        UPDATE users
        SET {', '.join(updates)}
        WHERE id = {user_id_param}
        RETURNING id, email, name, role, is_active, created_at, last_login
    """

    user = await db.fetch_one(query, *params)

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])

    return UserResponse(**user_dict)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Deletar usuário (Admin only)

    Args:
        user_id: ID do usuário a ser deletado
        current_user: Usuário atual (não pode deletar a si mesmo)

    Returns:
        Status 204 No Content
    """
    # Não permitir que admin delete a si mesmo
    if str(current_user['id']) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    # Verificar se usuário existe
    existing_user = await db.fetch_one(
        "SELECT id FROM users WHERE id = $1",
        uuid.UUID(user_id)
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Deletar usuário (cascade vai deletar refresh_tokens automaticamente)
    await db.execute(
        "DELETE FROM users WHERE id = $1",
        uuid.UUID(user_id)
    )

    return None


@router.patch("/{user_id}/toggle-status", response_model=UserResponse, dependencies=[Depends(require_admin)])
async def toggle_user_status(
    user_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Alternar status ativo/inativo do usuário (Admin only)

    Args:
        user_id: ID do usuário
        current_user: Usuário atual (não pode desativar a si mesmo)

    Returns:
        Usuário com status atualizado
    """
    # Não permitir que admin desative a si mesmo
    if str(current_user['id']) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    user = await db.fetch_one(
        """
        UPDATE users
        SET is_active = NOT is_active
        WHERE id = $1
        RETURNING id, email, name, role, is_active, created_at, last_login
        """,
        uuid.UUID(user_id)
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])

    return UserResponse(**user_dict)
