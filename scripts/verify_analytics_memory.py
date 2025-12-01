import requests
import json
import sys

BASE_URL = "https://agentprovision.com/api/v1"
USERNAME = "test@example.com"
PASSWORD = "password"

def login():
    print("Logging in...")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data={"username": USERNAME, "password": PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        response.raise_for_status()
        token = response.json()["access_token"]
        print("Logged in successfully.")
        return token
    except Exception as e:
        print(f"Login failed: {e}")
        sys.exit(1)

def verify_analytics(token):
    print("\n--- Verifying Analytics ---")
    try:
        response = requests.get(
            f"{BASE_URL}/analytics/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print("Analytics Summary:")
            print(json.dumps(data, indent=2))
            print("✅ Analytics endpoint is working.")
        else:
            print(f"❌ Failed to get Analytics: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error verifying Analytics: {e}")

def verify_knowledge_graph(token):
    print("\n--- Verifying Knowledge Graph ---")
    try:
        response = requests.get(
            f"{BASE_URL}/knowledge/entities",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} Knowledge Entities.")
            print("✅ Knowledge Graph endpoint is working.")
        else:
            print(f"❌ Failed to get Knowledge Entities: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error verifying Knowledge Graph: {e}")

def verify_memories(token):
    print("\n--- Verifying Memories ---")
    # First get an agent
    try:
        agents_resp = requests.get(
            f"{BASE_URL}/agents/",
            headers={"Authorization": f"Bearer {token}"}
        )
        agents = agents_resp.json()
        if not agents:
            print("⚠️ No agents found, skipping memory verification.")
            return

        agent_id = agents[0]['id']
        print(f"Checking memories for agent: {agents[0]['name']} ({agent_id})")

        response = requests.get(
            f"{BASE_URL}/memories/agent/{agent_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} memories.")
            print("✅ Memories endpoint is working.")
        else:
            print(f"❌ Failed to get Memories: {response.status_code} - {response.text}")

    except Exception as e:
        print(f"❌ Error verifying Memories: {e}")

def main():
    token = login()
    verify_analytics(token)
    verify_knowledge_graph(token)
    verify_memories(token)

if __name__ == "__main__":
    main()
