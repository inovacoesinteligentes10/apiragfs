"""
Endpoints de autenticação
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import uuid

from app.schemas.auth import (
    UserCreate,
    UserLogin,
    LoginResponse,
    UserResponse,
    RefreshTokenRequest,
    TokenResponse
)
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_expiry
)
from app.middleware.auth import get_current_active_user
from app.config.database import db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Registrar novo usuário

    Args:
        user_data: Dados do usuário (email, nome, senha, role)

    Returns:
        Tokens de acesso e informações do usuário

    Raises:
        HTTPException: Se o email já está em uso
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

    # Criar tokens
    token_data = {
        "sub": str(user['id']),
        "email": user['email'],
        "name": user['name'],
        "role": user['role']
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Salvar refresh token no banco
    await db.execute(
        """
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')
        """,
        user['id'],
        refresh_token
    )

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])  # Convert UUID to string
    user_response = UserResponse(**user_dict)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=get_token_expiry(),
        user=user_response
    )


@router.post("/login", response_model=LoginResponse)
async def login(credentials: UserLogin):
    """
    Login de usuário

    Args:
        credentials: Email e senha

    Returns:
        Tokens de acesso e informações do usuário

    Raises:
        HTTPException: Se as credenciais são inválidas
    """
    # Buscar usuário
    user = await db.fetch_one(
        """
        SELECT id, email, name, role, password_hash, is_active, created_at, last_login
        FROM users
        WHERE email = $1
        """,
        credentials.email
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verificar senha
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verificar se usuário está ativo
    if not user['is_active']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Criar tokens
    token_data = {
        "sub": str(user['id']),
        "email": user['email'],
        "name": user['name'],
        "role": user['role']
    }

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Salvar refresh token no banco
    await db.execute(
        """
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')
        """,
        user['id'],
        refresh_token
    )

    # Atualizar last_login
    await db.execute(
        "UPDATE users SET last_login = NOW() WHERE id = $1",
        user['id']
    )

    user_dict = dict(user)
    user_dict['id'] = str(user_dict['id'])  # Convert UUID to string
    user_dict.pop('password_hash', None)  # Remover hash da senha
    user_response = UserResponse(**user_dict)

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=get_token_expiry(),
        user=user_response
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(refresh_data: RefreshTokenRequest):
    """
    Renovar access token usando refresh token

    Args:
        refresh_data: Refresh token

    Returns:
        Novo par de access token e refresh token

    Raises:
        HTTPException: Se o refresh token é inválido ou expirado
    """
    # Decodificar refresh token
    payload = decode_token(refresh_data.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    # Verificar se token existe no banco e não foi revogado
    token_record = await db.fetch_one(
        """
        SELECT user_id, expires_at, revoked
        FROM refresh_tokens
        WHERE token = $1
        """,
        refresh_data.refresh_token
    )

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    if token_record['revoked']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked"
        )

    if token_record['expires_at'] < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired"
        )

    # Buscar usuário
    user = await db.fetch_one(
        """
        SELECT id, email, name, role, is_active
        FROM users
        WHERE id = $1
        """,
        token_record['user_id']
    )

    if not user or not user['is_active']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Criar novos tokens
    token_data = {
        "sub": str(user['id']),
        "email": user['email'],
        "name": user['name'],
        "role": user['role']
    }

    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    # Revogar refresh token antigo e salvar novo
    await db.execute(
        """
        UPDATE refresh_tokens
        SET revoked = TRUE, revoked_at = NOW()
        WHERE token = $1
        """,
        refresh_data.refresh_token
    )

    await db.execute(
        """
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '7 days')
        """,
        user['id'],
        new_refresh_token
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=get_token_expiry()
    )


@router.post("/logout")
async def logout(
    refresh_data: RefreshTokenRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Logout do usuário (revoga refresh token)

    Args:
        refresh_data: Refresh token a ser revogado
        current_user: Usuário atual autenticado

    Returns:
        Mensagem de sucesso
    """
    # Revogar refresh token
    await db.execute(
        """
        UPDATE refresh_tokens
        SET revoked = TRUE, revoked_at = NOW()
        WHERE token = $1 AND user_id = $2
        """,
        refresh_data.refresh_token,
        current_user['id']
    )

    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """
    Obter informações do usuário atual

    Args:
        current_user: Usuário atual autenticado

    Returns:
        Informações do usuário
    """
    return UserResponse(**current_user)
