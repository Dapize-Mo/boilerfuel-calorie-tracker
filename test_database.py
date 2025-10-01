#!/usr/bin/env python3
"""
Database test script for Railway deployment
"""
import requests
import json
import sys

# Replace with your actual Railway app URL
# Check your Railway dashboard for the correct URL
RAILWAY_URL = input("Enter your Railway app URL (e.g., https://your-app.up.railway.app): ").strip()

def test_endpoint(url, method="GET", data=None, expected_status=200):
    """Test an endpoint and return the result"""
    print(f"\n🧪 Testing {method} {url}")
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == expected_status:
            print("   ✅ Expected status code")
        else:
            print(f"   ❌ Expected {expected_status}, got {response.status_code}")
        
        try:
            result = response.json()
            print(f"   Response: {json.dumps(result, indent=2)}")
            return response.status_code, result
        except:
            print(f"   Response (text): {response.text}")
            return response.status_code, response.text
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Request failed: {e}")
        return None, str(e)

def main():
    print("🚀 Testing Database Endpoints on Railway")
    print(f"Base URL: {RAILWAY_URL}")
    
    # Test 1: Health check
    test_endpoint(f"{RAILWAY_URL}/health")
    
    # Test 2: Ready check (database connectivity)
    test_endpoint(f"{RAILWAY_URL}/ready")
    
    # Test 3: Initialize database (GET request - this should work now)
    test_endpoint(f"{RAILWAY_URL}/init-db")
    
    # Test 4: Get foods (should return seeded data after init)
    status, result = test_endpoint(f"{RAILWAY_URL}/api/foods")
    
    # Test 5: Add a new food
    new_food = {
        "name": "Test Food",
        "calories": 100,
        "macros": {"protein": 10, "carbs": 15, "fats": 5}
    }
    test_endpoint(f"{RAILWAY_URL}/api/foods", method="POST", data=new_food, expected_status=201)
    
    # Test 6: Get foods again to see if our new food was added
    test_endpoint(f"{RAILWAY_URL}/api/foods")
    
    print("\n🏁 Database testing complete!")

if __name__ == "__main__":
    main()