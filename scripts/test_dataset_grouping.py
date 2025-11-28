import requests
import json
import time

BASE_URL = "https://agentprovision.com/api/v1"
USERNAME = "test@example.com"
PASSWORD = "password"

def login():
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": USERNAME, "password": PASSWORD},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def list_datasets(token):
    response = requests.get(f"{BASE_URL}/datasets/", headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    return response.json()

def create_dataset_group(token, name, dataset_ids):
    payload = {
        "name": name,
        "description": "Grouped datasets for analysis",
        "dataset_ids": dataset_ids
    }
    response = requests.post(f"{BASE_URL}/dataset-groups/", json=payload, headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    return response.json()

def list_agent_kits(token):
    response = requests.get(f"{BASE_URL}/agent-kits/", headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    return response.json()

def create_chat_session(token, agent_kit_id, dataset_group_id):
    payload = {
        "agent_kit_id": agent_kit_id,
        "dataset_group_id": dataset_group_id,
        "title": "Group Analysis Session"
    }
    response = requests.post(f"{BASE_URL}/chat/sessions", json=payload, headers={"Authorization": f"Bearer {token}"})
    if response.status_code not in [200, 201]:
        print(f"Failed to create chat session: {response.text}")
    response.raise_for_status()
    return response.json()

def send_message(token, session_id, message):
    payload = {"content": message}
    response = requests.post(f"{BASE_URL}/chat/sessions/{session_id}/messages", json=payload, headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    return response.json()

def main():
    print("Logging in...")
    token = login()
    print("Logged in.")

    print("Listing datasets...")
    datasets = list_datasets(token)
    netsuite_datasets = [d for d in datasets if "TransactionDetail" in d["name"]]

    if len(netsuite_datasets) < 2:
        print("Need at least 2 TransactionDetail datasets to test grouping.")
        return

    # Take first 3 datasets
    datasets_to_group = netsuite_datasets[:3]
    dataset_ids = [d["id"] for d in datasets_to_group]
    print(f"Grouping {len(datasets_to_group)} datasets: {[d['name'] for d in datasets_to_group]}")

    print("Creating dataset group...")
    group = create_dataset_group(token, "NetSuite Consolidated", dataset_ids)
    group_id = group["id"]
    print(f"Dataset group created: {group['name']} ({group_id})")

    print("Listing agent kits...")
    agent_kits = list_agent_kits(token)
    # Use the NetSuite Analyst kit if available
    target_kit = next((k for k in agent_kits if "NetSuite" in k["name"]), None)
    if not target_kit and agent_kits:
        target_kit = agent_kits[0]

    if not target_kit:
        print("No agent kits found.")
        return

    print(f"Using Agent Kit: {target_kit['name']}")

    print("Creating chat session with dataset group...")
    session = create_chat_session(token, target_kit["id"], group_id)
    session_id = session["id"]
    print(f"Chat session created: {session['title']} ({session_id})")

    print("Sending message: 'Compare the expenses across these datasets.'...")
    try:
        response = send_message(token, session_id, "Compare the expenses across these datasets and tell me which one has the highest total.")
        print("Response received:")
        print(json.dumps(response, indent=2))
    except Exception as e:
        print(f"Error sending message: {e}")

if __name__ == "__main__":
    main()
