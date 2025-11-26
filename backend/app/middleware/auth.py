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
