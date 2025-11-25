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

    # CORS
    cors_origins: list[str] = ["http://localhost:3001", "http://localhost:3000"]

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
