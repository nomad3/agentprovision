import requests
import json
import os

BASE_URL = "https://agentprovision.com/api/v1"
USERNAME = "test@example.com"
PASSWORD = "password"

def login():
    print("Logging in...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": USERNAME, "password": PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def test_import_chatgpt(token):
    print("\nTesting ChatGPT Import...")
    file_path = "tests/fixtures/chatgpt_export.json"
    with open(file_path, "rb") as f:
        files = {"file": ("conversations.json", f, "application/json")}
        response = requests.post(
            f"{BASE_URL}/integrations/import/chatgpt",
            headers={"Authorization": f"Bearer {token}"},
            files=files
        )

    if response.status_code == 201:
        print("✅ ChatGPT Import Successful")
        print(response.json())
    else:
        print(f"❌ ChatGPT Import Failed: {response.status_code} - {response.text}")

def test_import_claude(token):
    print("\nTesting Claude Import...")
    file_path = "tests/fixtures/claude_export.json"
    with open(file_path, "rb") as f:
        files = {"file": ("conversations.json", f, "application/json")}
        response = requests.post(
            f"{BASE_URL}/integrations/import/claude",
            headers={"Authorization": f"Bearer {token}"},
            files=files
        )

    if response.status_code == 201:
        print("✅ Claude Import Successful")
        print(response.json())
    else:
        print(f"❌ Claude Import Failed: {response.status_code} - {response.text}")

def verify_sessions(token):
    print("\nVerifying Imported Sessions...")
    response = requests.get(
        f"{BASE_URL}/chat/sessions",
        headers={"Authorization": f"Bearer {token}"}
    )
    sessions = response.json()

    imported = [s for s in sessions if s.get("source") in ["chatgpt_import", "claude_import"]]
    print(f"Found {len(imported)} imported sessions.")
    for s in imported:
        print(f"- {s['title']} ({s['source']})")

def main():
    token = login()
    test_import_chatgpt(token)
    test_import_claude(token)
    verify_sessions(token)

if __name__ == "__main__":
    main()
