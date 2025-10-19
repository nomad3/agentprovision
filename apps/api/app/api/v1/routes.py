from fastapi import APIRouter
from app.api.v1 import auth, data_sources, data_pipelines, notebooks, agents, tools, connectors, deployments

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "AgentProvision API"}

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(data_sources.router, prefix="/data_sources", tags=["data_sources"])
router.include_router(data_pipelines.router, prefix="/data_pipelines", tags=["data_pipelines"])
router.include_router(notebooks.router, prefix="/notebooks", tags=["notebooks"])
router.include_router(agents.router, prefix="/agents", tags=["agents"])
router.include_router(tools.router, prefix="/tools", tags=["tools"])
router.include_router(connectors.router, prefix="/connectors", tags=["connectors"])
router.include_router(deployments.router, prefix="/deployments", tags=["deployments"])
