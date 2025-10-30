"""
Enhanced Notebook Service with Databricks Integration

Provides Databricks notebook execution capabilities.
"""

from typing import Optional
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notebook import Notebook
from app.schemas.notebook import NotebookCreate, NotebookBase
from app.services.mcp_client import get_mcp_client, MCPClientError
from app.utils.logger import get_logger
from app.services import notebook as base_notebook

logger = get_logger(__name__)


async def create_databricks_notebook(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    item_in: NotebookCreate
) -> Notebook:
    """
    Create notebook in PostgreSQL and Databricks workspace

    Args:
        db: Database session
        tenant_id: Tenant UUID
        item_in: Notebook creation data

    Returns:
        Notebook with Databricks workspace path
    """
    # Create in PostgreSQL first
    logger.info(f"Creating notebook '{item_in.name}' for tenant {tenant_id}")
    db_item = base_notebook.create_tenant_notebook(
        db,
        item_in=item_in,
        tenant_id=tenant_id
    )

    # Create in Databricks if enabled
    if settings.MCP_ENABLED:
        logger.info("MCP enabled, creating notebook in Databricks")

        try:
            mcp = get_mcp_client()

            # Extract content for Databricks
            content = ""
            if item_in.content and isinstance(item_in.content, dict):
                # If content is structured (e.g., Jupyter format)
                cells = item_in.content.get("cells", [])
                content = "\n\n".join([
                    cell.get("source", "") if isinstance(cell.get("source"), str)
                    else "".join(cell.get("source", []))
                    for cell in cells
                ])
            elif isinstance(item_in.content, str):
                content = item_in.content

            # Create in Databricks
            result = await mcp.create_notebook(
                tenant_id=str(tenant_id),
                notebook_name=item_in.name.replace(" ", "_"),
                language="python",
                content=content or "# New notebook\n"
            )

            # Store Databricks metadata
            db_item.metadata_ = {
                "databricks_enabled": True,
                "databricks_path": result.get("path"),
                "databricks_object_id": result.get("object_id"),
                "databricks_language": result.get("language"),
                "databricks_url": result.get("url")
            }
            db.commit()
            db.refresh(db_item)

            logger.info(f"Notebook created in Databricks: {result.get('path')}")

        except MCPClientError as e:
            logger.error(f"Databricks notebook creation failed: {e}")
            db_item.metadata_ = {
                "databricks_enabled": False,
                "databricks_error": str(e)
            }
            db.commit()

    else:
        logger.info("MCP disabled, notebook metadata only")
        db_item.metadata_ = {
            "databricks_enabled": False,
            "reason": "MCP_ENABLED=False"
        }
        db.commit()

    return db_item


async def execute_databricks_notebook(
    db: Session,
    *,
    notebook_id: uuid.UUID,
    tenant_id: uuid.UUID,
    parameters: Optional[dict] = None
) -> dict:
    """
    Execute notebook in Databricks

    Args:
        db: Database session
        notebook_id: Notebook UUID
        tenant_id: Tenant UUID
        parameters: Notebook parameters

    Returns:
        Execution details with run_id
    """
    notebook = base_notebook.get_notebook(db, notebook_id)
    if not notebook or notebook.tenant_id != tenant_id:
        raise ValueError("Notebook not found")

    if not settings.MCP_ENABLED:
        raise ValueError("Databricks integration not enabled")

    if not notebook.metadata_ or not notebook.metadata_.get("databricks_enabled"):
        raise ValueError("Notebook not synced to Databricks")

    logger.info(f"Executing notebook {notebook_id} in Databricks")

    try:
        mcp = get_mcp_client()
        databricks_path = notebook.metadata_.get("databricks_path")

        result = await mcp.execute_notebook(
            tenant_id=str(tenant_id),
            notebook_path=databricks_path,
            parameters=parameters or {}
        )

        return {
            "notebook_id": str(notebook_id),
            "notebook_name": notebook.name,
            "run_id": result.get("run_id"),
            "status": "PENDING",
            "databricks_url": result.get("run_page_url"),
            "message": "Notebook execution started"
        }

    except MCPClientError as e:
        logger.error(f"Notebook execution failed: {e}")
        raise ValueError(f"Execution failed: {str(e)}")


async def get_notebook_run_status(
    run_id: str
) -> dict:
    """
    Get notebook execution status

    Args:
        run_id: Databricks run ID

    Returns:
        Run status and results
    """
    if not settings.MCP_ENABLED:
        raise ValueError("Databricks integration not enabled")

    logger.info(f"Fetching run status for {run_id}")

    try:
        mcp = get_mcp_client()
        result = await mcp.get_notebook_run_status(run_id)

        return {
            "run_id": run_id,
            "state": result.get("state"),
            "life_cycle_state": result.get("life_cycle_state"),
            "state_message": result.get("state_message"),
            "start_time": result.get("start_time"),
            "end_time": result.get("end_time"),
            "execution_duration": result.get("execution_duration"),
            "run_page_url": result.get("run_page_url"),
            "output": result.get("output")
        }

    except MCPClientError as e:
        logger.error(f"Failed to fetch run status: {e}")
        raise ValueError(f"Status check failed: {str(e)}")


async def update_databricks_notebook(
    db: Session,
    *,
    notebook_id: uuid.UUID,
    tenant_id: uuid.UUID,
    obj_in: NotebookBase
) -> Notebook:
    """
    Update notebook in PostgreSQL and sync to Databricks

    Args:
        db: Database session
        notebook_id: Notebook UUID
        tenant_id: Tenant UUID
        obj_in: Update data

    Returns:
        Updated notebook
    """
    notebook = base_notebook.get_notebook(db, notebook_id)
    if not notebook or notebook.tenant_id != tenant_id:
        raise ValueError("Notebook not found")

    # Update in PostgreSQL
    db_obj = base_notebook.update_notebook(db, db_obj=notebook, obj_in=obj_in)

    # Update in Databricks if enabled
    if settings.MCP_ENABLED and db_obj.metadata_ and db_obj.metadata_.get("databricks_enabled"):
        logger.info(f"Syncing notebook changes to Databricks")

        try:
            mcp = get_mcp_client()
            databricks_path = db_obj.metadata_.get("databricks_path")

            # Extract updated content
            content = ""
            if obj_in.content and isinstance(obj_in.content, dict):
                cells = obj_in.content.get("cells", [])
                content = "\n\n".join([
                    cell.get("source", "") if isinstance(cell.get("source"), str)
                    else "".join(cell.get("source", []))
                    for cell in cells
                ])
            elif isinstance(obj_in.content, str):
                content = obj_in.content

            await mcp.update_notebook(
                tenant_id=str(tenant_id),
                notebook_path=databricks_path,
                content=content
            )

            logger.info(f"Notebook synced to Databricks: {databricks_path}")

        except MCPClientError as e:
            logger.error(f"Failed to sync to Databricks: {e}")

    return db_obj


async def delete_databricks_notebook(
    db: Session,
    *,
    notebook_id: uuid.UUID,
    tenant_id: uuid.UUID
) -> None:
    """
    Delete notebook from PostgreSQL and Databricks

    Args:
        db: Database session
        notebook_id: Notebook UUID
        tenant_id: Tenant UUID
    """
    notebook = base_notebook.get_notebook(db, notebook_id)
    if not notebook or notebook.tenant_id != tenant_id:
        raise ValueError("Notebook not found")

    # Delete from Databricks if it exists there
    if settings.MCP_ENABLED and notebook.metadata_ and notebook.metadata_.get("databricks_enabled"):
        logger.info(f"Deleting notebook from Databricks")

        try:
            mcp = get_mcp_client()
            databricks_path = notebook.metadata_.get("databricks_path")

            await mcp.delete_notebook(
                tenant_id=str(tenant_id),
                notebook_path=databricks_path
            )

            logger.info(f"Notebook deleted from Databricks: {databricks_path}")

        except MCPClientError as e:
            logger.error(f"Failed to delete from Databricks: {e}")

    # Delete from database
    base_notebook.delete_notebook(db, notebook_id=notebook_id)

    logger.info(f"Notebook {notebook_id} deleted successfully")
