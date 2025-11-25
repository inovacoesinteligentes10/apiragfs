"""
Schemas Pydantic para chat
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID


class ChatMessageRequest(BaseModel):
    """Requisicao de mensagem de chat"""
    message: str
    session_id: Optional[UUID] = None


class GroundingChunk(BaseModel):
    """Chunk de grounding do Gemini"""
    chunk_id: Optional[str] = None
    text: Optional[str] = None


class ChatMessageResponse(BaseModel):
    """Resposta de mensagem de chat"""
    role: str
    text: str
    grounding_chunks: List[GroundingChunk] = []
    created_at: datetime


class ChatSessionCreate(BaseModel):
    """Criacao de sessao de chat"""
    rag_store_name: str


class ChatSessionResponse(BaseModel):
    """Resposta de sessao de chat"""
    id: str
    user_id: str
    rag_store_name: str
    started_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    """Criação de mensagem"""
    role: str
    content: str


class MessageResponse(BaseModel):
    """Resposta de mensagem"""
    id: str
    session_id: str
    role: str
    content: str
    grounding_chunks: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatQueryRequest(BaseModel):
    """Request de query do chat"""
    message: str


class ChatQueryResponse(BaseModel):
    """Resposta de query do chat"""
    message: str
    grounding_chunks: List[dict] = []


class ChatHistoryResponse(BaseModel):
    """Historico de chat"""
    session_id: UUID
    messages: List[ChatMessageResponse]
