from fastapi import APIRouter

from app.api.v1 import agents, analytics, auth, deployments, users

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(deployments.router, prefix="/deployments", tags=["deployments"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
