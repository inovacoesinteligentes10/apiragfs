"""
Configuracao do pool de conexoes PostgreSQL com asyncpg
"""
import asyncpg
from typing import Optional
from .settings import settings


class Database:
    """Gerenciador de conexoes com PostgreSQL"""

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Cria o pool de conexoes"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                dsn=settings.database_url,
                min_size=1,
                max_size=settings.db_pool_size,
                command_timeout=60,
            )

    async def disconnect(self):
        """Fecha o pool de conexoes"""
        if self.pool:
            await self.pool.close()
            self.pool = None

    async def fetch_one(self, query: str, *args):
        """Executa query e retorna uma linha"""
        async with self.pool.acquire() as conn:
            return await conn.fetchrow(query, *args)

    async def fetch_all(self, query: str, *args):
        """Executa query e retorna todas as linhas"""
        async with self.pool.acquire() as conn:
            return await conn.fetch(query, *args)

    async def execute(self, query: str, *args):
        """Executa query sem retorno (INSERT, UPDATE, DELETE)"""
        async with self.pool.acquire() as conn:
            return await conn.execute(query, *args)


# Instância global
db = Database()
