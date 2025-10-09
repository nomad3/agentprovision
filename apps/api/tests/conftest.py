import asyncio
import contextlib
import os
import socket
import subprocess
import time
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

HOST = os.getenv("INTEGRATION_HOST", "127.0.0.1")

os.environ.setdefault("DATABASE_URL", f"postgresql+asyncpg://postgres:postgres@{HOST}:55432/agentprovision")
os.environ.setdefault("REDIS_URL", f"redis://{HOST}:6379/0")
os.environ.setdefault("NEXT_PUBLIC_API_BASE_URL", f"http://{HOST}:8000")

COMPOSE_PROJECT = "agentprovision-integration-tests"
COMPOSE_FILE = os.getenv("INTEGRATION_COMPOSE_FILE", "docker-compose.yml")


def _wait_for_service(host: str, port: int, *, timeout: float = 60.0, interval: float = 1.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
            sock.settimeout(interval)
            try:
                if sock.connect_ex((host, port)) == 0:
                    return
            except OSError:
                pass
        time.sleep(interval)
    raise TimeoutError(f"Service {host}:{port} did not become ready within {timeout}s")


def _wait_for_http(url: str, *, timeout: float = 90.0, interval: float = 2.0, auth: tuple[str, str] | None = None) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            response = httpx.get(url, timeout=interval, auth=auth)
            if response.status_code < 500:
                return
        except (httpx.HTTPError, OSError):
            pass
        time.sleep(interval)
    raise TimeoutError(f"Endpoint {url} did not become ready within {timeout}s")


@pytest.fixture(scope="session", autouse=True)
def integration_stack() -> Generator[None, None, None]:
    up_cmd = [
        "docker",
        "compose",
        "-f",
        COMPOSE_FILE,
        "-p",
        COMPOSE_PROJECT,
        "up",
        "-d",
        "db",
        "redis",
        "api",
        "n8n",
    ]
    subprocess.run(up_cmd, check=True)

    try:
        _wait_for_service(HOST, 55432)
        _wait_for_service(HOST, 6379)
        _wait_for_service(HOST, 8000)
        _wait_for_service(HOST, 5678)
        _wait_for_http(f"http://{HOST}:8000/health/ready")
        n8n_auth = (
            os.getenv("N8N_BASIC_AUTH_USER", "admin"),
            os.getenv("N8N_BASIC_AUTH_PASSWORD", "changeme"),
        )
        _wait_for_http(f"http://{HOST}:5678/rest/health", auth=n8n_auth)
        yield
    finally:
        down_cmd = ["docker", "compose", "-f", COMPOSE_FILE, "-p", COMPOSE_PROJECT, "down", "-v"]
        subprocess.run(down_cmd, check=False)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def async_engine(integration_stack: None):
    engine = create_async_engine(os.environ["DATABASE_URL"], echo=False)
    async with engine.begin() as conn:
        from app.db.base import Base

        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def async_session_factory(async_engine):
    factory = async_sessionmaker(bind=async_engine, expire_on_commit=False)
    async with factory() as session:
        from app.db.init_db import seed_demo_data

        await seed_demo_data(session)
    return factory


@pytest_asyncio.fixture()
async def db_session(async_session_factory) -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
