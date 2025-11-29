"""
Schemas Pydantic para configurações do usuário
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
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


class UserSettingsUpdate(BaseModel):
    """Schema para atualizar configurações pessoais do usuário (não-admin)"""
    language: Optional[Literal["pt-BR", "en-US", "es-ES"]] = Field(None, description="Idioma da interface")
    theme: Optional[Literal["light", "dark", "auto"]] = Field(None, description="Tema da interface")
    notifications: Optional[bool] = Field(None, description="Ativar/desativar notificações")
    auto_save: Optional[bool] = Field(None, description="Ativar/desativar salvamento automático")


class SystemSettingsUpdate(BaseModel):
    """Schema para atualizar configurações de sistema (apenas admin)"""
    system_name: Optional[str] = Field(None, min_length=1, max_length=50, description="Nome customizado do sistema")
    system_description: Optional[str] = Field(None, max_length=200, description="Descrição customizada do sistema")
    system_logo: Optional[str] = Field(None, description="Emoji ou ícone para o logotipo do sistema")


class GeneralSettingsUpdate(BaseModel):
    """Schema para atualizar configurações gerais (completo - para compatibilidade)"""
    language: Optional[Literal["pt-BR", "en-US", "es-ES"]] = Field(None, description="Idioma da interface")
    theme: Optional[Literal["light", "dark", "auto"]] = Field(None, description="Tema da interface")
    notifications: Optional[bool] = Field(None, description="Ativar/desativar notificações")
    auto_save: Optional[bool] = Field(None, description="Ativar/desativar salvamento automático")
    system_name: Optional[str] = Field(None, min_length=1, max_length=50, description="Nome customizado do sistema")
    system_description: Optional[str] = Field(None, max_length=200, description="Descrição customizada do sistema")
    system_logo: Optional[str] = Field(None, description="Emoji ou ícone para o logotipo do sistema")


class GeneralSettingsResponse(BaseModel):
    """Schema de resposta para configurações gerais"""
    language: str = Field(default="pt-BR", description="Idioma da interface")
    theme: str = Field(default="light", description="Tema da interface")
    notifications: bool = Field(default=True, description="Notificações ativadas")
    auto_save: bool = Field(default=True, description="Auto-save ativado")
    system_name: str = Field(default="ApiRAGFS", description="Nome do sistema")
    system_description: str = Field(default="Sistema RAG com Google Gemini File Search", description="Descrição do sistema")
    system_logo: str = Field(default="📚", description="Logotipo do sistema")
    updated_at: datetime
    is_admin: bool = Field(default=False, description="Se o usuário tem permissões de admin")
