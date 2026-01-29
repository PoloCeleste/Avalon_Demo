import asyncio
import json
import functools
from typing import Any, Callable, Set
from ..utils.redis_client import redis_client

# 현재 실행 중인 백그라운드 갱신 태스크들을 추적
_running_refresh_tasks: Set[str] = set()


# Redis 기반 백그라운드 캐시 갱신 on/off 플래그
BACKGROUND_REFRESH_KEY = "background_refresh_enabled"

async def is_background_refresh_enabled() -> bool:
    await redis_client.init()
    if redis_client.redis is None:
        return False
    value = await redis_client.redis.get(BACKGROUND_REFRESH_KEY)
    if value is None:
        # 없으면 False로 기본값 생성
        await redis_client.redis.set(BACKGROUND_REFRESH_KEY, "false")
        return False
    if isinstance(value, bytes):
        value = value.decode()
    return value == "true"


def cache_with_background_refresh(
    cache_time: int = 1800,  # 30분 기본
    background_refresh: bool = True,
    key_prefix: str = ""
):
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # 캐시 키 생성 (self는 제외하고 실제 파라미터만 사용)
            func_args = args[1:] if args and hasattr(args[0], '__class__') else args
            cache_key = f"{key_prefix}:{func.__name__}:{hash(str(func_args) + str(kwargs))}"
            
            # 1. 캐시에서 먼저 확인
            try:
                cache_key = f"{key_prefix}:{func.__name__}:{json.dumps({'args': func_args, 'kwargs': kwargs}, sort_keys=True, default=str)}"
            except Exception:
                cache_key = f"{key_prefix}:{func.__name__}:{str(func_args) + str(kwargs)}"
            await redis_client.init()
            # redis 연결 확인
            if redis_client.redis is None:
                raise RuntimeError("Redis 연결에 실패했습니다. redis_url을 확인하거나 서버 상태를 점검하세요.")
            # 1. 캐시에서 먼저 확인
            cached_data = await redis_client.redis.get(cache_key)
            if cached_data:
                try:
                    cached_result = json.loads(cached_data)
                    
                    # Redis 기반 백그라운드 캐시 갱신 on/off 플래그
                    if background_refresh and cache_key not in _running_refresh_tasks:
                        if await is_background_refresh_enabled():
                            _running_refresh_tasks.add(cache_key)
                            asyncio.create_task(_background_refresh_with_cleanup(
                                func, cache_key, cache_time, *args, **kwargs
                            ))
                    
                    return cached_result
                except (json.JSONDecodeError, Exception):
                    # 캐시 데이터가 손상된 경우 삭제
                    await redis_client.init()
                    await redis_client.redis.delete(cache_key)
            
            # 2. 캐시가 없으면 실제 함수 실행
            result = await func(*args, **kwargs)
            
            # 3. 결과를 캐시에 저장
            try:
                # Pydantic 모델 직렬화 처리
                if hasattr(result, 'model_dump'):
                    cache_data = json.dumps(result.model_dump())
                elif hasattr(result, 'dict'):
                    cache_data = json.dumps(result.dict())
                elif isinstance(result, list) and len(result) > 0:
                    # 리스트의 첫 번째 요소가 Pydantic 모델인지 확인
                    if hasattr(result[0], 'model_dump'):
                        cache_data = json.dumps([item.model_dump() for item in result])
                    elif hasattr(result[0], 'dict'):
                        cache_data = json.dumps([item.dict() for item in result])
                    else:
                        cache_data = json.dumps(result, default=str)
                elif isinstance(result, (dict, list)):
                    cache_data = json.dumps(result, default=str)
                else:
                    cache_data = json.dumps(result, default=str)
                
                await redis_client.init()
                await redis_client.redis.setex(cache_key, cache_time, cache_data)
            except Exception as e:
                print(f"Cache save failed for {cache_key}: {e}")
            
            return result
        return wrapper
    return decorator

async def _background_refresh_with_cleanup(func, cache_key, cache_time, *args, **kwargs):
    """백그라운드에서 캐시 갱신 (완료 후 정리)"""
    from app.core.database import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as db:
            # ReportService 인스턴스 생성 및 메서드 호출
            from app.services.report_service import ReportService
            service = ReportService(db)
            # 원본 함수 객체를 인스턴스에 바인딩해서 호출 (데코레이터 완전 우회)
            origin_func = func.__func__ if hasattr(func, '__func__') else func
            bound_method = origin_func.__get__(service, service.__class__)
            result = await bound_method(*args[1:], **kwargs)

            # Pydantic 모델 직렬화 처리
            if hasattr(result, 'model_dump'):
                cache_data = json.dumps(result.model_dump())
            elif hasattr(result, 'dict'):
                cache_data = json.dumps(result.dict())
            elif isinstance(result, list) and len(result) > 0:
                # 리스트의 첫 번째 요소가 Pydantic 모델인지 확인
                if hasattr(result[0], 'model_dump'):
                    cache_data = json.dumps([item.model_dump() for item in result])
                elif hasattr(result[0], 'dict'):
                    cache_data = json.dumps([item.dict() for item in result])
                else:
                    cache_data = json.dumps(result, default=str)
            elif isinstance(result, (dict, list)):
                cache_data = json.dumps(result, default=str)
            else:
                cache_data = json.dumps(result, default=str)

            await redis_client.init()
            if redis_client.redis is None:
                raise RuntimeError("Redis 연결에 실패했습니다. redis_url을 확인하거나 서버 상태를 점검하세요.")
            await redis_client.redis.setex(cache_key, cache_time, cache_data)
            print(f"Background cache refreshed for {cache_key}")
    except Exception as e:
        print(f"Background cache refresh failed for {cache_key}: {e}")
    finally:
        # 완료되면 실행 중 태스크 목록에서 제거
        _running_refresh_tasks.discard(cache_key)