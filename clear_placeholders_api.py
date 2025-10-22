"""
Clear placeholder foods via API
"""
import requests
import os

# Your deployed backend URL
BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:5000")  # Override with your deployed URL

def clear_placeholders():
    """Call the API to clear placeholder foods"""
    
    # You'll need to get an admin token first
    # Option 1: Login via API
    print("First, we need to login as admin...")
    email = input("Admin email: ")
    password = input("Admin password: ")
    
    # Login
    login_response = requests.post(
        f"{BACKEND_URL}/api/login",
        json={"email": email, "password": password}
    )
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.json()}")
        return
    
    token = login_response.json()['access_token']
    print("✓ Logged in successfully")
    
    # Clear placeholders
    print("\nClearing placeholder foods...")
    response = requests.delete(
        f"{BACKEND_URL}/api/admin/clear-placeholders",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ {result['message']}")
    else:
        print(f"\n✗ Error: {response.json()}")

if __name__ == "__main__":
    print("=" * 60)
    print("CLEAR PLACEHOLDER FOODS")
    print("=" * 60)
    print("\nThis will delete all foods without a dining_court")
    print("(These are test/placeholder items)\n")
    
    clear_placeholders()
