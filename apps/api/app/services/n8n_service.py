import os
import requests
import json

N8N_API_URL = os.getenv("N8N_API_URL", "http://n8n:5678/api/v1")
N8N_API_KEY = os.getenv("N8N_API_KEY", "your_n8n_api_key") # Replace with actual API key management

HEADERS = {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": N8N_API_KEY,
}

def get_all_workflows():
    try:
        response = requests.get(f"{N8N_API_URL}/workflows", headers=HEADERS)
        response.raise_for_status()
        return response.json()["data"]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching n8n workflows: {e}")
        return []

def deploy_workflow(workflow_json: dict):
    try:
        response = requests.post(f"{N8N_API_URL}/workflows", headers=HEADERS, json=workflow_json)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error deploying n8n workflow: {e}")
        return None

def activate_workflow(workflow_id: str):
    try:
        response = requests.post(f"{N8N_API_URL}/workflows/{workflow_id}/activate", headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error activating n8n workflow: {e}")
        return None

def deactivate_workflow(workflow_id: str):
    try:
        response = requests.post(f"{N8N_API_URL}/workflows/{workflow_id}/deactivate", headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error deactivating n8n workflow: {e}")
        return None

def delete_workflow(workflow_id: str):
    try:
        response = requests.delete(f"{N8N_API_URL}/workflows/{workflow_id}", headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error deleting n8n workflow: {e}")
        return None