import requests
import sys

BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login"
USERS_ME_URL = f"{BASE_URL}/api/v1/users/me"

EMAIL = "test@example.com"
PASSWORD = "password"

def verify_users_me():
    print("1. Logging in...")
    response = requests.post(LOGIN_URL, data={"username": EMAIL, "password": PASSWORD})
    if response.status_code != 200:
        print(f"❌ Login failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

    token = response.json()["access_token"]
    print("✅ Login successful")

    print("\n2. Checking /api/v1/users/me...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(USERS_ME_URL, headers=headers)

    if response.status_code == 200:
        print("✅ /users/me is accessible")
        print(response.json())
    else:
        print(f"❌ /users/me failed: {response.status_code}")
        print(response.text)
        sys.exit(1)

if __name__ == "__main__":
    verify_users_me()
