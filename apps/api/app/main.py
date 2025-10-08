from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import router as api_router
from app.core.config import settings
from app.db.base import Base
from app.db.init_db import seed_demo_data
from app.db.session import SessionLocal, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        await seed_demo_data(session)

    yield

    await engine.dispose()


def create_application() -> FastAPI:
    application = FastAPI(title=settings.project_name, version="0.1.0", lifespan=lifespan)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.get("/health/live", tags=["health"])  # pragma: no cover - simple probe
    async def live_healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/health/ready", tags=["health"])  # pragma: no cover - simple probe
    async def ready_healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_application()
