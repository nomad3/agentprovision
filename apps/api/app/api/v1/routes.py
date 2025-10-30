from fastapi import APIRouter
from app.api.v1 import (
    auth,
    data_sources,
    data_pipelines,
    notebooks,
    agents,
    tools,
    connectors,
    deployments,
    analytics,
    vector_stores,
    agent_kits,
    datasets,
    chat,
    databricks,
)

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
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(vector_stores.router, prefix="/vector_stores", tags=["vector_stores"])
router.include_router(agent_kits.router, prefix="/agent_kits", tags=["agent_kits"])
router.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(databricks.router, prefix="/databricks", tags=["databricks"])
