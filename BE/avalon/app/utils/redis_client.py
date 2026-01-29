
import aioredis
from typing import Optional
from ..core.config import settings

class RedisClient:
    def __init__(self):
        self.redis = None

    async def init(self):
        if self.redis is None:
            self.redis = aioredis.from_url(settings.redis_url, decode_responses=True)

    async def set_refresh_token(self, user_id: int, token: str, expire_days: int = 7):
        await self.init()
        key = f"user:{user_id}"
        expire_seconds = expire_days * 24 * 60 * 60
        await self.redis.setex(key, expire_seconds, token)

    async def get_refresh_token(self, user_id: int) -> Optional[str]:
        await self.init()
        key = f"user:{user_id}"
        return await self.redis.get(key)

    async def delete_refresh_token(self, user_id: int):
        await self.init()
        key = f"user:{user_id}"
        await self.redis.delete(key)

    async def is_token_valid(self, user_id: int, token: str) -> bool:
        stored_token = await self.get_refresh_token(user_id)
        return stored_token == token

# 싱글톤 인스턴스
redis_client = RedisClient()