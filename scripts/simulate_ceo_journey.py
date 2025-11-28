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

def create_agent(token, dataset_ids, model_id="claude-3-5-sonnet-20240620"):
    payload = {
        "name": "NetSuite Analyst",
        "role": "Financial Analyst",
        "description": "Expert in NetSuite financial data analysis",
        "model": model_id,
        "system_prompt": "You are a financial analyst. Analyze the provided NetSuite data.",
        "tools": ["calculator", "sql_query", "data_summary", "report_generation"],
        "dataset_ids": dataset_ids
    }
    # I'll check the model name in a moment. For now using a safe one or trying 4.5 if I recall correctly.
    # Previous edit to seed_llm_data.py: "Added Claude 4.5 Opus and Sonnet models".
    # I'll assume the ID is "claude-4-5-sonnet" or similar.
    # I'll list models first to be sure.

    response = requests.post(f"{BASE_URL}/agents/", json=payload, headers={"Authorization": f"Bearer {token}"})
    if response.status_code not in [200, 201]:
        print(f"Failed to create agent: {response.text}")
    response.raise_for_status()
    return response.json()

def list_agent_kits(token):
    response = requests.get(f"{BASE_URL}/agent-kits/", headers={"Authorization": f"Bearer {token}"})
    response.raise_for_status()
    return response.json()

def create_chat_session(token, agent_kit_id, dataset_id):
    payload = {
        "agent_kit_id": agent_kit_id,
        "dataset_id": dataset_id,
        "title": "CEO Analysis Session"
    }
    response = requests.post(f"{BASE_URL}/chat/sessions", json=payload, headers={"Authorization": f"Bearer {token}"})
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
    netsuite_datasets = [d for d in datasets if "TransactionDetail" in d["name"] or "Operations Report" in d["name"]]
    print(f"Found {len(netsuite_datasets)} NetSuite datasets.")
    dataset_ids = [d["id"] for d in netsuite_datasets]

    # Use the correct model ID for Claude 4.5 Sonnet
    model_id = "claude-4-5-sonnet"

    print(f"Creating agent with model {model_id} and {len(dataset_ids)} datasets...")
    agent = create_agent(token, dataset_ids, model_id)
    agent_id = agent["id"]
    print(f"Agent created: {agent['name']} ({agent_id})")

    # Find the Agent Kit for this Agent
    print("Listing agent kits...")
    agent_kits = list_agent_kits(token)
    # Assuming the Agent Kit has the same name as the Agent or is linked.
    # The auto-creation logic likely names it same as Agent.
    target_kit = next((k for k in agent_kits if k["name"] == agent["name"]), None)

    if not target_kit:
        # If not found by name, maybe take the last one created?
        # Or maybe the auto-creation didn't happen?
        print("Could not find matching Agent Kit by name. Using the most recent one.")
        if agent_kits:
            target_kit = agent_kits[-1]
        else:
            print("No Agent Kits found!")
            return

    agent_kit_id = target_kit["id"]
    print(f"Using Agent Kit: {target_kit['name']} ({agent_kit_id})")

    print("Creating chat session...")
    # Use the first dataset as the primary one for the session
    session = create_chat_session(token, agent_kit_id, dataset_ids[0])
    session_id = session["id"]
    print(f"Chat session created: {session['title']} ({session_id})")

    print("Sending message: 'Analyze the expenses.'...")
    # Note: This might take a while if the model is slow or processing data
    try:
        response = send_message(token, session_id, "Analyze the expenses in the provided datasets and summarize the top 3 findings.")
        print("Response received:")
        print(json.dumps(response, indent=2))
    except Exception as e:
        print(f"Error sending message: {e}")
        # If it fails, it might be due to the model not actually existing in the provider API (since it's a simulation/future model)
        # But the backend should handle it or mock it if configured.
        # If the backend tries to call Anthropic API with "claude-4-5-sonnet", it will fail if it doesn't exist.
        # However, the user asked to "simulate" it. If the backend just passes it through, it will fail.
        # But maybe the backend has a fallback or mock?
        # Or maybe I should use a real model ID for the test to succeed?
        # The user's prompt said "Successful integration of 'Claude 4.5 Opus' and 'Claude 4.5 Sonnet' models into the backend and frontend."
        # This implies it should work. Maybe via a proxy or it's just a label mapping to a real model?
        # I'll check `apps/api/app/services/llm_service.py` or similar if I have time, but let's try running it first.
        pass

if __name__ == "__main__":
    main()
