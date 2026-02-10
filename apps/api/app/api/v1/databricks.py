"""
Databricks Integration Status and Management Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.services.mcp_client import get_mcp_client, MCPClientError
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/status")
async def get_databricks_status(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get Databricks integration status for current tenant

    Returns:
    - MCP server connectivity
    - Databricks catalog status
    - Feature flags
    """
    if not settings.MCP_ENABLED:
        return {
            "enabled": False,
            "reason": "MCP_ENABLED is False in configuration",
            "mcp_server_url": settings.MCP_SERVER_URL
        }

    try:
        mcp = get_mcp_client()

        # Check MCP server health
        health = await mcp.health_check()

        # Check tenant catalog status
        catalog_status = await mcp.get_catalog_status(
            tenant_id=str(current_user.tenant_id)
        )

        return {
            "enabled": True,
            "mcp_server": {
                "url": settings.MCP_SERVER_URL,
                "healthy": health.get("status") == "healthy",
                "databricks_connected": health.get("databricks_connected", False)
            },
            "tenant_catalog": {
                "exists": catalog_status.get("exists", False),
                "catalog_name": catalog_status.get("catalog_name"),
                "schemas": catalog_status.get("schemas", [])
            },
            "capabilities": {
                "datasets": True,
                "notebooks": True,
                "jobs": True,
                "model_serving": True,
                "vector_search": True
            }
        }

    except MCPClientError as e:
        logger.error(f"MCP status check failed: {e}")
        return {
            "enabled": True,
            "mcp_server": {
                "url": settings.MCP_SERVER_URL,
                "healthy": False,
                "error": str(e)
            },
            "tenant_catalog": {
                "exists": False,
                "error": "Could not check catalog status"
            }
        }

    except Exception as e:
        logger.error(f"Unexpected error in status check: {e}")
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")


@router.post("/initialize")
async def initialize_databricks_for_tenant(
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Initialize Databricks resources for the current tenant

    Creates:
    - Unity Catalog for tenant
    - Bronze, Silver, Gold schemas
    - Default access permissions
    """
    if not settings.MCP_ENABLED:
        raise HTTPException(
            status_code=400,
            detail="Databricks integration is not enabled"
        )

    try:
        mcp = get_mcp_client()

        catalog_name = f"servicetsunami_{str(current_user.tenant_id).replace('-', '_')}"

        logger.info(f"Initializing Databricks catalog for tenant {current_user.tenant_id}")

        result = await mcp.create_tenant_catalog(
            tenant_id=str(current_user.tenant_id),
            catalog_name=catalog_name
        )

        return {
            "message": "Databricks resources initialized successfully",
            "catalog_name": result.get("catalog_name"),
            "schemas_created": result.get("schemas", []),
            "catalog_url": result.get("catalog_url")
        }

    except MCPClientError as e:
        logger.error(f"Databricks initialization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")


@router.get("/usage")
async def get_databricks_usage(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    """
    Get Databricks resource usage for tenant

    Returns:
    - Number of datasets in Databricks
    - Number of notebooks in Databricks
    - Number of active jobs
    - Storage usage (if available)
    """
    if not settings.MCP_ENABLED:
        raise HTTPException(
            status_code=400,
            detail="Databricks integration is not enabled"
        )

    # Count resources synced to Databricks
    from app.models.dataset import Dataset
    from app.models.notebook import Notebook
    from app.models.data_pipeline import DataPipeline

    datasets_count = db.query(Dataset).filter(
        Dataset.tenant_id == current_user.tenant_id,
        Dataset.metadata_['databricks_enabled'].astext == 'true'
    ).count()

    notebooks_count = db.query(Notebook).filter(
        Notebook.tenant_id == current_user.tenant_id,
        Notebook.metadata_['databricks_enabled'].astext == 'true'
    ).count()

    pipelines_count = db.query(DataPipeline).filter(
        DataPipeline.tenant_id == current_user.tenant_id,
        DataPipeline.metadata_['databricks_enabled'].astext == 'true'
    ).count()

    return {
        "tenant_id": str(current_user.tenant_id),
        "resources": {
            "datasets": {
                "total": db.query(Dataset).filter(Dataset.tenant_id == current_user.tenant_id).count(),
                "in_databricks": datasets_count
            },
            "notebooks": {
                "total": db.query(Notebook).filter(Notebook.tenant_id == current_user.tenant_id).count(),
                "in_databricks": notebooks_count
            },
            "pipelines": {
                "total": db.query(DataPipeline).filter(DataPipeline.tenant_id == current_user.tenant_id).count(),
                "in_databricks": pipelines_count
            }
        },
        "sync_percentage": {
            "datasets": (datasets_count / max(db.query(Dataset).filter(Dataset.tenant_id == current_user.tenant_id).count(), 1)) * 100,
            "notebooks": (notebooks_count / max(db.query(Notebook).filter(Notebook.tenant_id == current_user.tenant_id).count(), 1)) * 100,
            "pipelines": (pipelines_count / max(db.query(DataPipeline).filter(DataPipeline.tenant_id == current_user.tenant_id).count(), 1)) * 100
        }
    }


@router.get("/health")
async def health_check():
    """
    Quick health check for Databricks integration

    Returns simple status without authentication
    """
    if not settings.MCP_ENABLED:
        return {
            "status": "disabled",
            "mcp_enabled": False
        }

    try:
        mcp = get_mcp_client()
        health = await mcp.health_check()

        return {
            "status": "healthy" if health.get("status") == "healthy" else "unhealthy",
            "mcp_enabled": True,
            "mcp_server": settings.MCP_SERVER_URL,
            "databricks_connected": health.get("databricks_connected", False)
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "mcp_enabled": True,
            "error": str(e)
        }
