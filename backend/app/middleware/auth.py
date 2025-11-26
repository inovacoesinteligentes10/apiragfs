"""
Middleware de autenticação JWT
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.utils.auth import decode_token
from app.config.database import db

# HTTP Bearer security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Dependency para obter o usuário atual a partir do token JWT

    Args:
        credentials: Credenciais HTTP Bearer (token JWT)

    Returns:
        Dados do usuário autenticado

    Raises:
        HTTPException: Se o token é inválido ou usuário não encontrado
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    # Decodificar token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    email: str = payload.get("email")

    if user_id is None or email is None:
        raise credentials_exception

    # Buscar usuário no banco de dados
    user = await db.fetch_one(
        """
        SELECT id, email, name, role, is_active, created_at, last_login
        FROM users
        WHERE id = $1
        """,
        user_id
    )

    if user is None:
        raise credentials_exception

    # Verificar se usuário está ativo
    if not user['is_active']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])  # Convert UUID to string
    return user_dict


async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency para garantir que o usuário está ativo

    Args:
        current_user: Usuário atual

    Returns:
        Dados do usuário ativo

    Raises:
        HTTPException: Se usuário não está ativo
    """
    if not current_user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency para garantir que o usuário é admin

    Args:
        current_user: Usuário atual

    Returns:
        Dados do usuário admin

    Raises:
        HTTPException: Se usuário não é admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required"
        )
    return current_user


class OptionalAuth:
    """
    Dependency que permite autenticação opcional
    Retorna o usuário se autenticado, None caso contrário
    """

    async def __call__(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
    ) -> Optional[dict]:
        if credentials is None:
            return None

        try:
            token = credentials.credentials
            payload = decode_token(token)

            if payload is None:
                return None

            user_id: str = payload.get("sub")
            if user_id is None:
                return None

            user = await db.fetch_one(
                """
                SELECT id, email, name, role, is_active
                FROM users
                WHERE id = $1 AND is_active = TRUE
                """,
                user_id
            )

            if user is None:
                return None

            user_dict = dict(user)
            user_dict['id'] = str(user_dict['id'])  # Convert UUID to string
            return user_dict

        except Exception:
            return None


# Instância para uso opcional
optional_auth = OptionalAuth()


# Alias para facilitar uso
require_admin = get_current_admin_user


# ===== Helper Functions para Store Permissions =====

async def has_store_access(user_id: str, store_id: str, role: str) -> bool:
    """
    Verifica se um usuário tem acesso a um store específico

    Args:
        user_id: ID do usuário
        store_id: ID do store
        role: Role do usuário

    Returns:
        True se tem acesso, False caso contrário
    """
    # Admin sempre tem acesso a todos os stores
    if role == 'admin':
        return True

    # Verificar se tem permissão na tabela
    permission = await db.fetch_one(
        """
        SELECT 1 FROM user_store_permissions
        WHERE user_id = $1 AND store_id = $2
        """,
        user_id, store_id
    )

    return permission is not None


async def can_manage_store(user_id: str, store_id: str, role: str) -> bool:
    """
    Verifica se um usuário pode gerenciar um store (modificar permissões)

    Args:
        user_id: ID do usuário
        store_id: ID do store
        role: Role do usuário

    Returns:
        True se pode gerenciar, False caso contrário
    """
    # Admin sempre pode gerenciar
    if role == 'admin':
        return True

    # Verificar se é o criador do store
    store = await db.fetch_one(
        """
        SELECT user_id FROM rag_stores
        WHERE id = $1
        """,
        store_id
    )

    if store and str(store['user_id']) == user_id:
        return True

    return False


async def get_user_stores(user_id: str, role: str) -> list:
    """
    Retorna lista de IDs de stores aos quais o usuário tem acesso

    Args:
        user_id: ID do usuário
        role: Role do usuário

    Returns:
        Lista de UUIDs de stores
    """
    # Admin tem acesso a todos
    if role == 'admin':
        stores = await db.fetch_all("SELECT id FROM rag_stores")
        return [str(s['id']) for s in stores]

    # Buscar stores com permissão
    permissions = await db.fetch_all(
        """
        SELECT store_id FROM user_store_permissions
        WHERE user_id = $1
        """,
        user_id
    )

    return [str(p['store_id']) for p in permissions]


async def add_store_permission(store_id: str, user_id: str, created_by: str) -> None:
    """
    Adiciona permissão de acesso a um store para um usuário

    Args:
        store_id: ID do store
        user_id: ID do usuário que receberá acesso
        created_by: ID do usuário que está criando a permissão
    """
    await db.execute(
        """
        INSERT INTO user_store_permissions (user_id, store_id, created_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, store_id) DO NOTHING
        """,
        user_id, store_id, created_by
    )


async def remove_store_permission(store_id: str, user_id: str) -> bool:
    """
    Remove permissão de acesso a um store

    Args:
        store_id: ID do store
        user_id: ID do usuário que perderá acesso

    Returns:
        True se removeu, False se não encontrou ou não pode remover

    Raises:
        ValueError: Se tentar remover permissão do criador do store
    """
    # Verificar se é o criador
    store = await db.fetch_one(
        "SELECT user_id FROM rag_stores WHERE id = $1",
        store_id
    )

    if store and str(store['user_id']) == user_id:
        raise ValueError("Não é possível remover permissão do criador do store")

    # Remover permissão
    result = await db.execute(
        """
        DELETE FROM user_store_permissions
        WHERE user_id = $1 AND store_id = $2
        """,
        user_id, store_id
    )

    return result != "DELETE 0"
