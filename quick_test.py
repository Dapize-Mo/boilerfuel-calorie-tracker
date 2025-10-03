#!/usr/bin/env python3
"""
Quick database test - you can edit the URL below
"""
import requests
import json

def test_railway_db():
    # TODO: Replace this with your actual Railway URL from the dashboard
    # Look at your Railway project dashboard to get the correct URL
    base_url = "https://your-app-name.up.railway.app"
    
    print("🔧 SETUP REQUIRED:")
    print("1. Go to your Railway dashboard")
    print("2. Find your app's public URL")
    print("3. Edit this script and replace 'https://your-app-name.up.railway.app' with your actual URL")
    print("4. Run this script again")
    print()
    
    # Let's try some common Railway URL patterns
    possible_urls = [
        "https://your-backend-production.up.railway.app",
        "https://web-production-xxxx.up.railway.app",
        "https://boilerfuel-calorie-tracker.up.railway.app",
    ]
    
    print("🔍 Trying to find your Railway URL...")
    working_url = None
    
    for url in possible_urls:
        try:
            print(f"Testing: {url}")
            response = requests.get(f"{url}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ Found working URL: {url}")
                working_url = url
                break
            else:
                print(f"❌ Status {response.status_code}")
        except Exception as e:
            print(f"❌ Failed: {str(e)[:50]}...")
    
    if not working_url:
        print("\n❌ Could not find your Railway URL automatically.")
        print("Please check your Railway dashboard and update this script with the correct URL.")
        return
    
    # Now test all endpoints
    print(f"\n🧪 Testing all endpoints on {working_url}")
    
    # Test health
    response = requests.get(f"{working_url}/health")
    print(f"Health check: {response.status_code} - {response.json() if response.status_code == 200 else 'Failed'}")
    
    # Test ready
    response = requests.get(f"{working_url}/ready")
    print(f"Ready check: {response.status_code} - {response.json() if response.status_code == 200 else 'Failed'}")
    
    # Test init-db (this should create tables)
    response = requests.get(f"{working_url}/init-db")
    print(f"Init DB: {response.status_code}")
    if response.status_code in [200, 201]:
        print(f"  {response.json()}")
    else:
        print(f"  Error: {response.text[:100]}")
    
    # Test get foods
    response = requests.get(f"{working_url}/api/foods")
    print(f"Get foods: {response.status_code}")
    if response.status_code == 200:
        foods = response.json()
        print(f"  Found {len(foods)} foods in database")
        if foods:
            print(f"  Sample: {foods[0]['name']} - {foods[0]['calories']} calories")
    else:
        print(f"  Error: {response.text[:100]}")

if __name__ == "__main__":
    test_railway_db()