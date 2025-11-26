"""
Schemas para autenticação JWT
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Schema base para usuário"""
    email: EmailStr
    name: str


class UserCreate(UserBase):
    """Schema para criação de usuário"""
    password: str = Field(..., min_length=6, description="Senha deve ter no mínimo 6 caracteres")
    role: str = Field(default="student", description="Role do usuário: student, professor, admin")


class UserLogin(BaseModel):
    """Schema para login"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema de resposta de usuário (sem senha)"""
    id: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema de resposta de token"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos até expiração do access token


class LoginResponse(BaseModel):
    """Schema de resposta de login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema para refresh token"""
    refresh_token: str


class TokenPayload(BaseModel):
    """Payload do JWT token"""
    sub: str  # user_id
    email: str
    name: str
    role: str
    exp: int  # timestamp de expiração
    iat: int  # timestamp de emissão
