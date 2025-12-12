"""
Enhanced Data Pipeline Service with Databricks Integration

Provides Databricks Jobs API integration for pipeline orchestration.
"""

from typing import Optional, List, Dict, Any
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.data_pipeline import DataPipeline
from app.schemas.data_pipeline import DataPipelineCreate
from app.services.mcp_client import get_mcp_client, MCPClientError
from app.utils.logger import get_logger
from app.services import data_pipeline as base_pipeline

logger = get_logger(__name__)


def _convert_to_databricks_tasks(pipeline_config: dict) -> List[Dict[str, Any]]:
    """
    Convert pipeline configuration to Databricks job tasks

    Args:
        pipeline_config: Pipeline configuration dict

    Returns:
        List of Databricks task definitions
    """
    tasks = []

    # Extract tasks from config
    # Expected format: {"tasks": [{"name": "...", "type": "notebook|sql|python", "config": {...}}]}
    config_tasks = pipeline_config.get("tasks", [])

    for idx, task in enumerate(config_tasks):
        task_key = task.get("name", f"task_{idx}")
        task_type = task.get("type", "notebook")
        task_config = task.get("config", {})
        depends_on = task.get("depends_on", [])

        databricks_task = {
            "task_key": task_key,
            "depends_on": [{"task_key": dep} for dep in depends_on] if depends_on else []
        }

        if task_type == "notebook":
            databricks_task["notebook_task"] = {
                "notebook_path": task_config.get("notebook_path"),
                "base_parameters": task_config.get("parameters", {})
            }

        elif task_type == "sql":
            databricks_task["sql_task"] = {
                "query": {
                    "query": task_config.get("query")
                },
                "warehouse_id": task_config.get("warehouse_id")
            }

        elif task_type == "python":
            databricks_task["spark_python_task"] = {
                "python_file": task_config.get("python_file"),
                "parameters": task_config.get("parameters", [])
            }

        tasks.append(databricks_task)

    return tasks


async def create_databricks_job(
    db: Session,
    *,
    tenant_id: uuid.UUID,
    pipeline_in: DataPipelineCreate
) -> DataPipeline:
    """
    Create data pipeline as Databricks Job

    Args:
        db: Database session
        tenant_id: Tenant UUID
        pipeline_in: Pipeline creation data

    Returns:
        DataPipeline with Databricks job ID
    """
    # Create in PostgreSQL first
    logger.info(f"Creating pipeline '{pipeline_in.name}' for tenant {tenant_id}")
    db_item = base_pipeline.create_tenant_data_pipeline(
        db,
        item_in=pipeline_in,
        tenant_id=tenant_id
    )

    # Create Databricks Job if enabled
    if settings.MCP_ENABLED:
        logger.info("MCP enabled, creating Databricks job")

        try:
            mcp = get_mcp_client()

            # Convert pipeline config to Databricks tasks
            tasks = _convert_to_databricks_tasks(pipeline_in.config)

            # Extract schedule if provided
            schedule = pipeline_in.config.get("schedule")

            # Create job in Databricks
            result = await mcp.create_job(
                tenant_id=str(tenant_id),
                job_name=pipeline_in.name.replace(" ", "_"),
                tasks=tasks,
                schedule=schedule
            )

            # Store Databricks metadata
            db_item.metadata_ = {
                "databricks_enabled": True,
                "databricks_job_id": result.get("job_id"),
                "databricks_job_url": result.get("job_url"),
                "databricks_created_at": result.get("created_time"),
                "tasks_count": len(tasks)
            }
            db.commit()
            db.refresh(db_item)

            logger.info(f"Pipeline created as Databricks job: {result.get('job_id')}")

        except MCPClientError as e:
            logger.error(f"Databricks job creation failed: {e}")
            db_item.metadata_ = {
                "databricks_enabled": False,
                "databricks_error": str(e)
            }
            db.commit()

    else:
        logger.info("MCP disabled, pipeline metadata only")
        db_item.metadata_ = {
            "databricks_enabled": False,
            "reason": "MCP_ENABLED=False"
        }
        db.commit()

    return db_item


async def run_databricks_pipeline(
    db: Session,
    *,
    pipeline_id: uuid.UUID,
    tenant_id: uuid.UUID,
    parameters: Optional[dict] = None
) -> dict:
    """
    Trigger pipeline execution in Databricks

    Args:
        db: Database session
        pipeline_id: Pipeline UUID
        tenant_id: Tenant UUID
        parameters: Job parameters

    Returns:
        Execution details with run_id
    """
    pipeline = base_pipeline.get_data_pipeline(db, pipeline_id)
    if not pipeline or pipeline.tenant_id != tenant_id:
        raise ValueError("Pipeline not found")

    if not settings.MCP_ENABLED:
        raise ValueError("Databricks integration not enabled")

    if not pipeline.metadata_ or not pipeline.metadata_.get("databricks_enabled"):
        raise ValueError("Pipeline not synced to Databricks")

    logger.info(f"Running pipeline {pipeline_id} in Databricks")

    try:
        mcp = get_mcp_client()
        job_id = pipeline.metadata_.get("databricks_job_id")

        result = await mcp.run_job(
            tenant_id=str(tenant_id),
            job_id=job_id,
            parameters=parameters
        )

        return {
            "pipeline_id": str(pipeline_id),
            "pipeline_name": pipeline.name,
            "run_id": result.get("run_id"),
            "number_in_job": result.get("number_in_job"),
            "status": "PENDING",
            "databricks_url": result.get("run_page_url"),
            "message": "Pipeline execution started"
        }

    except MCPClientError as e:
        logger.error(f"Pipeline execution failed: {e}")
        raise ValueError(f"Execution failed: {str(e)}")


async def get_pipeline_run_status(
    run_id: str
) -> dict:
    """
    Get pipeline run status

    Args:
        run_id: Databricks run ID

    Returns:
        Run status with task details
    """
    if not settings.MCP_ENABLED:
        raise ValueError("Databricks integration not enabled")

    logger.info(f"Fetching run status for {run_id}")

    try:
        mcp = get_mcp_client()
        result = await mcp.get_job_run_status(run_id)

        return {
            "run_id": run_id,
            "state": result.get("state"),
            "life_cycle_state": result.get("life_cycle_state"),
            "state_message": result.get("state_message"),
            "start_time": result.get("start_time"),
            "end_time": result.get("end_time"),
            "execution_duration": result.get("execution_duration"),
            "run_page_url": result.get("run_page_url"),
            "tasks": result.get("tasks", [])
        }

    except MCPClientError as e:
        logger.error(f"Failed to fetch run status: {e}")
        raise ValueError(f"Status check failed: {str(e)}")


async def list_pipeline_runs(
    db: Session,
    *,
    pipeline_id: uuid.UUID,
    tenant_id: uuid.UUID,
    limit: int = 25
) -> List[dict]:
    """
    List recent pipeline runs

    Args:
        db: Database session
        pipeline_id: Pipeline UUID
        tenant_id: Tenant UUID
        limit: Number of runs to return

    Returns:
        List of run summaries
    """
    pipeline = base_pipeline.get_data_pipeline(db, pipeline_id)
    if not pipeline or pipeline.tenant_id != tenant_id:
        raise ValueError("Pipeline not found")

    if not settings.MCP_ENABLED:
        raise ValueError("Databricks integration not enabled")

    if not pipeline.metadata_ or not pipeline.metadata_.get("databricks_enabled"):
        return []

    logger.info(f"Listing runs for pipeline {pipeline_id}")

    try:
        mcp = get_mcp_client()
        job_id = pipeline.metadata_.get("databricks_job_id")

        result = await mcp.list_job_runs(job_id, limit=limit)

        runs = []
        for run in result.get("runs", []):
            runs.append({
                "run_id": run.get("run_id"),
                "run_number": run.get("number_in_job"),
                "state": run.get("state"),
                "start_time": run.get("start_time"),
                "end_time": run.get("end_time"),
                "run_page_url": run.get("run_page_url")
            })

        return runs

    except MCPClientError as e:
        logger.error(f"Failed to list runs: {e}")
        return []


async def cancel_pipeline_run(
    run_id: str
) -> dict:
    """
    Cancel running pipeline

    Args:
        run_id: Databricks run ID

    Returns:
        Cancellation status
    """
    if not settings.MCP_ENABLED:
        raise ValueError("Databricks integration not enabled")

    logger.info(f"Cancelling run {run_id}")

    try:
        mcp = get_mcp_client()
        await mcp.cancel_job_run(run_id)

        return {
            "run_id": run_id,
            "status": "CANCELLED",
            "message": "Pipeline run cancelled successfully"
        }

    except MCPClientError as e:
        logger.error(f"Failed to cancel run: {e}")
        raise ValueError(f"Cancellation failed: {str(e)}")


async def delete_databricks_pipeline(
    db: Session,
    *,
    pipeline_id: uuid.UUID,
    tenant_id: uuid.UUID
) -> None:
    """
    Delete pipeline from PostgreSQL and Databricks

    Args:
        db: Database session
        pipeline_id: Pipeline UUID
        tenant_id: Tenant UUID
    """
    pipeline = base_pipeline.get_data_pipeline(db, pipeline_id)
    if not pipeline or pipeline.tenant_id != tenant_id:
        raise ValueError("Pipeline not found")

    # Delete from Databricks if it exists there
    if settings.MCP_ENABLED and pipeline.metadata_ and pipeline.metadata_.get("databricks_enabled"):
        logger.info("Deleting pipeline job from Databricks")

        try:
            mcp = get_mcp_client()
            job_id = pipeline.metadata_.get("databricks_job_id")

            await mcp.delete_job(job_id)

            logger.info(f"Job deleted from Databricks: {job_id}")

        except MCPClientError as e:
            logger.error(f"Failed to delete from Databricks: {e}")

    # Delete from database
    base_pipeline.delete_data_pipeline(db, data_pipeline_id=pipeline_id)

    logger.info(f"Pipeline {pipeline_id} deleted successfully")
