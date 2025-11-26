"""
Schemas Pydantic para documentos
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from enum import Enum


class DocumentStatus(str, Enum):
    """Status de processamento do documento"""
    UPLOADED = "uploaded"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    COMPLETED = "completed"
    ERROR = "error"


class DocumentCreate(BaseModel):
    """Dados para criação de documento"""
    name: str
    original_name: str
    type: str
    size: int


class DocumentResponse(BaseModel):
    """Resposta completa de documento"""
    id: str
    user_id: str
    name: str
    original_name: str
    type: str
    size: int
    minio_url: str
    minio_bucket: str
    text_length: Optional[int] = None
    extraction_method: Optional[str] = None
    department: Optional[str] = None
    chunks: Optional[int] = None
    processing_time: Optional[int] = None
    status: str
    progress_percent: Optional[int] = None
    status_message: Optional[str] = None
    error_message: Optional[str] = None
    rag_store_name: Optional[str] = None
    upload_date: datetime
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


class DocumentUploadResponse(BaseModel):
    """Resposta de upload de documento"""
    id: UUID
    name: str
    original_name: str
    type: str
    size: int
    minio_url: str
    rag_store_name: str
    status: str
    upload_date: datetime

    class Config:
        from_attributes = True


class DocumentListItem(BaseModel):
    """Item da lista de documentos"""
    id: UUID
    name: str
    original_name: str
    type: str
    size: int
    text_length: Optional[int] = None
    chunks: Optional[int] = None
    processing_time: Optional[int] = None
    status: str
    upload_date: datetime

    class Config:
        from_attributes = True


class DocumentDetail(BaseModel):
    """Detalhes completos do documento"""
    id: UUID
    user_id: UUID
    name: str
    original_name: str
    type: str
    size: int
    minio_url: str
    minio_bucket: str
    text_length: Optional[int] = None
    extraction_method: Optional[str] = None
    chunks: Optional[int] = None
    processing_time: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    upload_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
