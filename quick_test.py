#!/usr/bin/env python3
"""
Quick database test - you can edit the URL below
"""
import requests
import json

def test_backend_url():
    base_url = "http://127.0.0.1:5000"
    print("Using local backend URL by default.")
    working_url = base_url
    
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
    test_backend_url()