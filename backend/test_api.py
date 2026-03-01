
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_api():
    print("Testing API...")
    
    # 1. Register
    email = "test_user_123@example.com"
    password = "password123"
    try:
        register_payload = {
            "email": email,
            "password": password,
            "full_name": "Test User",
            "height": 180,
            "weight": 75,
            "blood_group": "O+",
            "subscription_tier": "free",
            "transaction_id": ""
        }
        print(f"Registering {email}...")
        res = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
        if res.status_code == 200:
            print("Registration success!")
        elif res.status_code == 400 and "already registered" in res.text:
            print("User already exists.")
        else:
            print(f"Registration failed: {res.status_code} {res.text}")
            return

        # 2. Login
        print("Logging in...")
        login_data = {
            "username": email,
            "password": password
        }
        res = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        if res.status_code != 200:
            print(f"Login failed: {res.status_code} {res.text}")
            return
            
        token = res.json()["access_token"]
        print(f"Login success! Token: {token[:20]}...")

        # 3. Get Stats
        print("Fetching stats...")
        headers = {"Authorization": f"Bearer {token}"}
        res = requests.get(f"{BASE_URL}/workouts/stats", headers=headers)
        if res.status_code == 200:
            print(f"Stats: {res.json()}")
        else:
            print(f"Fetch stats failed: {res.status_code} {res.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
