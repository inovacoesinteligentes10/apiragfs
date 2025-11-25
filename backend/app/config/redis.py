"""
Configuracao do cliente Redis
"""
import redis.asyncio as redis
from typing import Optional
from .settings import settings


class RedisClient:
    """Gerenciador de conexoes com Redis"""

    def __init__(self):
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        """Cria conexao com Redis"""
        if not self.client:
            self.client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )

    async def disconnect(self):
        """Fecha conexao com Redis"""
        if self.client:
            await self.client.close()
            self.client = None

    async def get(self, key: str) -> Optional[str]:
        """Busca valor por chave"""
        if self.client:
            return await self.client.get(key)
        return None

    async def set(self, key: str, value: str, ttl: int = settings.redis_cache_ttl):
        """Define valor com TTL"""
        if self.client:
            await self.client.setex(key, ttl, value)

    async def delete(self, key: str):
        """Remove chave"""
        if self.client:
            await self.client.delete(key)


# Instância global
redis_client = RedisClient()
