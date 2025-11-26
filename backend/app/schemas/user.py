"""
Schemas para gerenciamento de usuários
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserUpdate(BaseModel):
    """Schema para atualização de usuário"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = Field(None, description="Role: student, professor, admin")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, description="Nova senha (opcional)")


class UserStats(BaseModel):
    """Estatísticas do usuário"""
    total_documents: int = 0
    total_sessions: int = 0
    total_messages: int = 0


class UserListResponse(BaseModel):
    """Schema de resposta para lista de usuários"""
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    stats: UserStats

    class Config:
        from_attributes = True
