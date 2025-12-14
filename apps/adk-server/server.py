"""
Custom ADK server wrapper with path prefix stripping middleware.

GCE Ingress forwards /adk/* paths without stripping the prefix.
This middleware strips the /adk prefix before passing to the ADK app.
"""
import os
import sys
import uvicorn
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class StripPrefixMiddleware(BaseHTTPMiddleware):
    """Middleware to strip /adk prefix from incoming requests."""

    def __init__(self, app, prefix: str = "/adk"):
        super().__init__(app)
        self.prefix = prefix

    async def dispatch(self, request: Request, call_next):
        # Strip prefix from path if present
        if request.scope["path"].startswith(self.prefix):
            request.scope["path"] = request.scope["path"][len(self.prefix):] or "/"
            if request.scope.get("raw_path"):
                raw_path = request.scope["raw_path"].decode()
                if raw_path.startswith(self.prefix):
                    request.scope["raw_path"] = (raw_path[len(self.prefix):] or "/").encode()

        response = await call_next(request)
        return response


def main():
    """Start ADK server with prefix-stripping middleware."""
    # Import ADK's FastAPI app factory
    from google.adk.cli.fast_api import get_fast_api_app

    # Get the base ADK app
    app = get_fast_api_app(
        agents_dir=".",
        web=False,
        allow_origins=["*"],
    )

    # Add prefix-stripping middleware
    app.add_middleware(StripPrefixMiddleware, prefix="/adk")

    # Get configuration from environment
    host = os.getenv("ADK_HOST", "0.0.0.0")
    port = int(os.getenv("ADK_PORT", "8080"))

    # Run the server
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
