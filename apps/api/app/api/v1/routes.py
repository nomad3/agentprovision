from fastapi import APIRouter
from app.api.v1 import auth, data_sources, data_pipelines, notebooks

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "AgentProvision API"}

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(data_sources.router, prefix="/data_sources", tags=["data_sources"])
router.include_router(data_pipelines.router, prefix="/data_pipelines", tags=["data_pipelines"])
router.include_router(notebooks.router, prefix="/notebooks", tags=["notebooks"])
