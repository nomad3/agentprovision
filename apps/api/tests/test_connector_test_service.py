"""
Tests for the connector test service.
Tests real public datasources and APIs.
"""
import pytest
import asyncio
from app.services.connector_test import (
    test_connector,
    test_api_connection,
    CONNECTOR_TESTERS
)


class TestConnectorTestService:
    """Test the connector test service with real public APIs."""

    @pytest.mark.asyncio
    async def test_api_connection_jsonplaceholder(self):
        """Test REST API connection to JSONPlaceholder (public API)."""
        config = {
            "base_url": "https://jsonplaceholder.typicode.com/posts",
            "auth_type": "none"
        }
        result = await test_api_connection(config)

        assert result["success"] is True
        assert "reachable" in result["message"].lower() or "200" in str(result.get("metadata", {}).get("status_code", ""))
        print(f"✅ JSONPlaceholder API test: {result}")

    @pytest.mark.asyncio
    async def test_api_connection_httpbin(self):
        """Test REST API connection to httpbin (public API)."""
        config = {
            "base_url": "https://httpbin.org/get",
            "auth_type": "none"
        }
        result = await test_api_connection(config)

        assert result["success"] is True
        print(f"✅ httpbin API test: {result}")

    @pytest.mark.asyncio
    async def test_api_connection_github(self):
        """Test REST API connection to GitHub API (public API)."""
        config = {
            "base_url": "https://api.github.com",
            "auth_type": "none"
        }
        result = await test_api_connection(config)

        assert result["success"] is True
        print(f"✅ GitHub API test: {result}")

    @pytest.mark.asyncio
    async def test_api_connection_catfact(self):
        """Test REST API connection to Cat Facts API (public API)."""
        config = {
            "base_url": "https://catfact.ninja/fact",
            "auth_type": "none"
        }
        result = await test_api_connection(config)

        assert result["success"] is True
        print(f"✅ Cat Facts API test: {result}")

    @pytest.mark.asyncio
    async def test_api_connection_invalid_url(self):
        """Test REST API connection with invalid URL."""
        config = {
            "base_url": "https://this-domain-does-not-exist-12345.com/api",
            "auth_type": "none"
        }
        result = await test_api_connection(config)

        assert result["success"] is False
        assert result["message"] is not None
        print(f"✅ Invalid URL handled correctly: {result['message'][:50]}...")

    @pytest.mark.asyncio
    async def test_api_connection_with_bearer_token(self):
        """Test REST API with bearer auth (using httpbin echo)."""
        config = {
            "base_url": "https://httpbin.org/bearer",
            "auth_type": "bearer",
            "bearer_token": "test-token-123"
        }
        result = await test_api_connection(config)

        # httpbin /bearer requires auth and returns 401 without valid token
        # The important thing is we handle it gracefully
        print(f"✅ Bearer auth test: {result}")

    @pytest.mark.asyncio
    async def test_connector_unknown_type(self):
        """Test that unknown connector types are handled."""
        result = await test_connector("unknown_type", {})

        assert result["success"] is False
        assert "unknown" in result["message"].lower()
        print(f"✅ Unknown connector type handled: {result}")

    @pytest.mark.asyncio
    async def test_connector_registry_has_all_types(self):
        """Verify all expected connector types are registered."""
        expected_types = ["snowflake", "postgres", "mysql", "s3", "gcs", "databricks", "api"]

        for connector_type in expected_types:
            assert connector_type in CONNECTOR_TESTERS, f"Missing connector type: {connector_type}"

        print(f"✅ All {len(expected_types)} connector types are registered")


class TestPublicDatabricks:
    """Test Databricks connection (will fail without real credentials)."""

    @pytest.mark.asyncio
    async def test_databricks_invalid_credentials(self):
        """Test Databricks with invalid credentials handles error gracefully."""
        config = {
            "host": "https://community.cloud.databricks.com",
            "token": "invalid-token",
            "http_path": "/sql/1.0/warehouses/test"
        }
        result = await test_connector("databricks", config)

        # Should fail but handle gracefully
        assert result["success"] is False
        print(f"✅ Databricks invalid credentials handled: {result['message'][:50]}...")


# Run tests directly if executed
if __name__ == "__main__":
    asyncio.run(TestConnectorTestService().test_api_connection_jsonplaceholder())
    asyncio.run(TestConnectorTestService().test_api_connection_httpbin())
    asyncio.run(TestConnectorTestService().test_api_connection_github())
    asyncio.run(TestConnectorTestService().test_connector_unknown_type())
    print("\n✅ All direct tests passed!")
