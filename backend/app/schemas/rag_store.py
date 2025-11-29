"""
Schemas Pydantic para RAG Stores
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class RAGStoreCreate(BaseModel):
    """Dados para criação de um RAG Store"""
    display_name: str = Field(..., min_length=1, max_length=100)


class RAGStoreUpdate(BaseModel):
    """Dados para atualização de um RAG Store"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)


class RAGStoreResponse(BaseModel):
    """Resposta completa de um RAG Store"""
    id: str
    user_id: str
    display_name: str
    rag_store_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True