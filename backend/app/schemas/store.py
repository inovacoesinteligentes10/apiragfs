"""
Schemas Pydantic para RAG Stores/Departments
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class StoreBase(BaseModel):
    """Schema base para store"""
    name: str = Field(..., description="Nome interno do store (slug)")
    display_name: str = Field(..., description="Nome de exibição")
    description: Optional[str] = Field(None, description="Descrição do store")
    icon: str = Field(default="folder", description="Ícone do store")
    color: str = Field(default="blue", description="Cor do store")


class StoreCreate(StoreBase):
    """Schema para criar novo store"""
    pass


class StoreResponse(StoreBase):
    """Schema de resposta para um store"""
    id: str
    user_id: str
    document_count: int
    created_at: datetime
    updated_at: datetime

    @field_validator('id', 'user_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Converter UUID para string"""
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class StoreWithRagName(StoreResponse):
    """Schema de store com RAG store name do Gemini"""
    rag_store_name: Optional[str] = None


# ===== Schemas para Permissões de Store =====

class StorePermissionCreate(BaseModel):
    """Schema para criar permissão de acesso a store"""
    user_id: str = Field(..., description="ID do usuário que receberá acesso")


class StorePermissionResponse(BaseModel):
    """Schema de resposta para permissão de store"""
    id: str
    user_id: str
    store_id: str
    user_name: str
    user_email: str
    user_role: str
    created_at: datetime
    created_by: Optional[str] = None

    @field_validator('id', 'user_id', 'store_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Converter UUID para string"""
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class StoreWithPermissions(StoreWithRagName):
    """Schema de store com informações de permissões do usuário atual"""
    is_creator: bool = Field(default=False, description="Se o usuário atual é o criador do store")
    can_manage: bool = Field(default=False, description="Se o usuário pode gerenciar permissões")
