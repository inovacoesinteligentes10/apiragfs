"""
Schemas Pydantic para configurações do usuário
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SettingUpdate(BaseModel):
    """Schema para atualizar uma configuração"""
    setting_key: str = Field(..., description="Chave da configuração")
    setting_value: str = Field(..., description="Valor da configuração")


class SettingResponse(BaseModel):
    """Schema de resposta para uma configuração"""
    id: str
    user_id: str
    setting_key: str
    setting_value: str
    created_at: datetime
    updated_at: datetime


class SystemPromptUpdate(BaseModel):
    """Schema específico para atualizar o system prompt"""
    system_prompt: str = Field(..., min_length=10, description="Prompt do sistema RAG")


class SystemPromptResponse(BaseModel):
    """Schema de resposta para o system prompt"""
    system_prompt: str
    updated_at: datetime
