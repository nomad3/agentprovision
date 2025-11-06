from app.core.config import settings

def test_databricks_config_exists():
    """Test Databricks configuration settings are loaded"""
    assert hasattr(settings, 'DATABRICKS_SYNC_ENABLED')
    assert hasattr(settings, 'DATABRICKS_AUTO_SYNC')
    assert hasattr(settings, 'DATABRICKS_RETRY_ATTEMPTS')
    assert hasattr(settings, 'DATABRICKS_RETRY_INTERVAL')
    assert isinstance(settings.DATABRICKS_RETRY_ATTEMPTS, int)
    assert isinstance(settings.DATABRICKS_RETRY_INTERVAL, int)

def test_mcp_config_exists():
    """Test MCP configuration is present"""
    assert hasattr(settings, 'MCP_SERVER_URL')
    assert hasattr(settings, 'MCP_API_KEY')
    assert settings.MCP_SERVER_URL.startswith('http')
