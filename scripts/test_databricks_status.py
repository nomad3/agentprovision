#!/usr/bin/env python3
"""
Test script to verify Databricks integration status as displayed in Settings page
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_databricks_status():
    """Test the Databricks status endpoint that the Settings page uses"""

    # First, login to get a valid token
    print("1. Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "password"
        }
    )

    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return

    token = login_response.json()["access_token"]
    print(f"✅ Login successful, got token")

    # Now call the Databricks status endpoint
    print("\n2. Fetching Databricks status...")
    headers = {"Authorization": f"Bearer {token}"}
    status_response = requests.get(
        f"{BASE_URL}/api/v1/databricks/status",
        headers=headers
    )

    if status_response.status_code != 200:
        print(f"❌ Status check failed: {status_response.status_code}")
        print(status_response.text)
        return

    status_data = status_response.json()
    print(f"✅ Status check successful")
    print(f"\nFull response:")
    print(json.dumps(status_data, indent=2))

    # Analyze what the UI would display
    print("\n" + "="*60)
    print("SETTINGS PAGE DISPLAY:")
    print("="*60)

    if status_data.get("enabled"):
        print("✅ Databricks Integration: ENABLED")

        mcp_server = status_data.get("mcp_server", {})
        if mcp_server.get("healthy"):
            print(f"✅ MCP Server Connection: CONNECTED")
            print(f"   Server: {mcp_server.get('url')}")
        else:
            print(f"⚠️  MCP Server Connection: PENDING SETUP")
            if "error" in mcp_server:
                print(f"   Error: {mcp_server['error']}")

        tenant_catalog = status_data.get("tenant_catalog", {})
        if tenant_catalog.get("exists"):
            print(f"✅ Unity Catalog: INITIALIZED")
            print(f"   Catalog: {tenant_catalog.get('catalog_name')}")
            schemas = tenant_catalog.get("schemas", [])
            print(f"   Schemas: {', '.join(schemas)} ({len(schemas)} total)")
        else:
            print(f"⚠️  Unity Catalog: NOT INITIALIZED")

        capabilities = status_data.get("capabilities", {})
        enabled_caps = [k for k, v in capabilities.items() if v]
        print(f"\n✅ Available Capabilities:")
        for cap in enabled_caps:
            print(f"   • {cap.replace('_', ' ').title()}")
    else:
        print("❌ Databricks Integration: DISABLED")
        print(f"   Reason: {status_data.get('reason')}")

    print("="*60)

if __name__ == "__main__":
    test_databricks_status()
