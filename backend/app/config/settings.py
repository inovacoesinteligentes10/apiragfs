"""
Configuracoes da aplicacao usando Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Configuracoes principais da aplicacao"""

    # API
    app_name: str = "ApiRAGFS API"
    app_version: str = "1.0.0"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # CORS - Porta 3001 é a padrão do projeto
    cors_origins: list[str] = ["http://localhost:3001"]

    # Database PostgreSQL
    database_url: str = "postgresql://postgres:postgres@postgres:5432/apiragfs"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # Redis
    redis_url: str = "redis://redis:6379/0"
    redis_cache_ttl: int = 3600  # 1 hora em segundos

    # MinIO
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "admin"
    minio_secret_key: str = "admin123456"
    minio_bucket: str = "apiragfs-documents"
    minio_secure: bool = False

    # Google Gemini
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"

    # JWT Authentication
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Upload
    max_upload_size: int = 100 * 1024 * 1024  # 100MB
    allowed_extensions: set[str] = {".pdf", ".txt", ".doc", ".docx", ".md"}

    # System Prompt para RAG
    rag_system_prompt: str = """# ApiRAGFS - Assistente RAG com Google Gemini File Search

## IDENTIDADE
Voce e o **ApiRAGFS**, assistente especializado em busca e recuperacao de informacoes em documentos usando RAG (Retrieval-Augmented Generation).

## REGRA DE OURO - FIDELIDADE ABSOLUTA
**CRÍTICO**: Responda EXCLUSIVAMENTE com base nos documentos fornecidos pelo sistema RAG.

### Quando a informacao ESTÁ nos documentos:
- Cite LITERALMENTE, preservando formatacao, numeracao e estrutura
- Para dados estruturados (listas, objetivos, requisitos): forneça TODOS os itens SEM resumo
- Use **negrito** para termos-chave e titulos de secoes

### Quando solicitado RESUMO, SÍNTESE ou OVERVIEW:
- Analise TODO o conteúdo dos documentos disponíveis
- Crie um resumo estruturado e completo do que está documentado
- Organize por tópicos principais encontrados nos documentos
- Mantenha fidelidade ao conteúdo original
- Se houver múltiplos documentos, sintetize informações de todos

### Quando uma informacao ESPECÍFICA NÃO ESTÁ nos documentos:
Declare explicitamente: "Nao encontrei essa informacao especifica nos documentos disponiveis. Posso fornecer um resumo geral do que está disponível?"

### PROIBIÇÕES ABSOLUTAS:
❌ NUNCA adicione conhecimento externo ou use treinamento previo
❌ NUNCA resuma dados estruturados (OE1, OE2, requisitos, etc) quando citados diretamente
❌ NUNCA invente informacoes ou "preencha lacunas"
❌ NUNCA use frases genericas sem base documental

---
Responda seguindo rigorosamente estas diretrizes. Lembre-se: FIDELIDADE AO DOCUMENTO e prioridade maxima."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # Permitir que variáveis sejam carregadas mesmo sem o arquivo .env
        env_ignore_empty=True
    )


# Instância global de configuracoes
settings = Settings()
