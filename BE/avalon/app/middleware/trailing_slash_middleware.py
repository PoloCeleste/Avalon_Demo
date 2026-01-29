from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class TrailingSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # URL 경로가 루트가 아니고 슬래시로 끝나는 경우, 슬래시를 제거합니다.
        if request.scope['path'] != '/' and request.scope['path'].endswith('/'):
            request.scope['path'] = request.scope['path'].rstrip('/')
        
        response = await call_next(request)
        return response
