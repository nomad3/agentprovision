from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant


def generate_slug(name: str) -> str:
    slug = name.lower().strip().replace(" ", "-")
    return "-".join(filter(None, slug.split("-")))


async def get_tenant_by_slug(session: AsyncSession, slug: str) -> Optional[Tenant]:
    result = await session.execute(select(Tenant).where(Tenant.slug == slug))
    return result.scalar_one_or_none()


async def get_tenant(session: AsyncSession, tenant_id: UUID) -> Optional[Tenant]:
    result = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
    return result.scalar_one_or_none()


async def create_tenant(session: AsyncSession, name: str) -> Tenant:
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    while await get_tenant_by_slug(session, slug) is not None:
        counter += 1
        slug = f"{base_slug}-{counter}"
    tenant = Tenant(name=name, slug=slug)
    session.add(tenant)
    await session.commit()
    await session.refresh(tenant)
    return tenant
