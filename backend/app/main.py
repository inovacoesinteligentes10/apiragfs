# -*- coding: utf-8 -*-
"""
Aplicacao FastAPI principal - ApiRAGFS Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .config.database import db
from .config.redis import redis_client
from .config.minio import minio_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicacao"""
    # Startup
    print("Iniciando ApiRAGFS Backend...")

    # Conectar ao PostgreSQL
    await db.connect()
    print("PostgreSQL conectado")

    # Conectar ao Redis
    await redis_client.connect()
    print("Redis conectado")

    # Garantir bucket MinIO existe
    minio_client.ensure_bucket()
    print("MinIO configurado")

    print(f"{settings.app_name} v{settings.app_version} iniciado com sucesso!")

    yield

    # Shutdown
    print("Encerrando ApiRAGFS Backend...")
    await db.disconnect()
    await redis_client.disconnect()
    print("Backend encerrado")


# Criar aplicacao FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API Backend para ApiRAGFS - RAG File Search com Google Gemini",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Rotas basicas
@app.get("/")
async def root():
    """Rota raiz"""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Healthcheck da aplicacao"""
    health_status = {
        "status": "healthy",
        "version": settings.app_version,
        "services": {}
    }

    # Check PostgreSQL
    try:
        await db.fetch_one("SELECT 1")
        health_status["services"]["postgres"] = "healthy"
    except Exception as e:
        health_status["services"]["postgres"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check Redis
    try:
        await redis_client.client.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check MinIO
    try:
        minio_client.client.bucket_exists(bucket_name=minio_client.bucket)
        health_status["services"]["minio"] = "healthy"
    except Exception as e:
        health_status["services"]["minio"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    return health_status


# Incluir routers da API v1
# Não definir tags aqui - deixar os routers definirem suas próprias tags
from .api.v1 import documents, chat, settings as settings_router, stores, analytics, auth, users
app.include_router(auth.router, prefix=f"{settings.api_v1_prefix}")
app.include_router(users.router, prefix=f"{settings.api_v1_prefix}")
app.include_router(documents.router, prefix=f"{settings.api_v1_prefix}/documents")
app.include_router(chat.router, prefix=f"{settings.api_v1_prefix}/chat")
app.include_router(settings_router.router, prefix=f"{settings.api_v1_prefix}/settings")
app.include_router(stores.router, prefix=f"{settings.api_v1_prefix}/stores")
app.include_router(analytics.router, prefix=f"{settings.api_v1_prefix}/analytics")
