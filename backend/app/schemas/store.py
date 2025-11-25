"""
Schemas Pydantic para RAG Stores/Departments
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


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

    class Config:
        from_attributes = True


class StoreWithRagName(StoreResponse):
    """Schema de store com RAG store name do Gemini"""
    rag_store_name: Optional[str] = None
