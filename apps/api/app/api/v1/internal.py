"""
Internal API endpoints for service-to-service communication
NOT exposed publicly via Nginx - only for MCP server access
"""

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from app.core.config import settings
from app.utils.logger import get_logger
from typing import Optional
import os

router = APIRouter()
logger = get_logger(__name__)


@router.get("/storage/datasets/{file_name}")
async def serve_dataset_file(
    file_name: str,
    authorization: Optional[str] = Header(None)
):
    """
    Serve parquet files to MCP server

    Security:
    - Requires MCP_API_KEY in Authorization header
    - Validates file exists
    - Prevents directory traversal attacks

    Args:
        file_name: Parquet file name (e.g., "abc-123.parquet")
        authorization: Bearer token (must match MCP_API_KEY)

    Returns:
        FileResponse with parquet file content
    """
    # Verify MCP API key
    expected_auth = f"Bearer {settings.MCP_API_KEY}"
    if not authorization or authorization != expected_auth:
        logger.warning(f"Unauthorized internal access attempt for file: {file_name}")
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Prevent directory traversal
    if ".." in file_name or "/" in file_name or "\\" in file_name:
        logger.warning(f"Directory traversal attempt: {file_name}")
        raise HTTPException(status_code=400, detail="Invalid file name")

    # Build file path
    file_path = os.path.join(settings.DATA_STORAGE_PATH, "datasets", file_name)

    # Validate file exists
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")

    # Validate it's actually a file (not directory)
    if not os.path.isfile(file_path):
        logger.error(f"Path is not a file: {file_path}")
        raise HTTPException(status_code=400, detail="Invalid file")

    logger.info(f"Serving file to MCP server: {file_name}")

    return FileResponse(
        path=file_path,
        media_type="application/octet-stream",
        filename=file_name
    )
