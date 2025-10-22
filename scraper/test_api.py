"""Test script to see the actual API response structure"""
import requests
import json

url = "https://api.hfs.purdue.edu/menus/v2/locations/Wiley/2025-10-02"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
}

response = requests.get(url, headers=headers, timeout=15)
data = response.json()

# Find items with NutritionReady = true
nutrition_ready_count = 0
all_items_count = 0
sample_item_id = None

for meal in data.get('Meals', []):
    for station in meal.get('Stations', []):
        for item in station.get('Items', []):
            all_items_count += 1
            if item.get('NutritionReady'):
                nutrition_ready_count += 1
                if not sample_item_id:
                    sample_item_id = item.get('ID')
                    print(f"Sample item with nutrition ready:")
                    print(json.dumps(item, indent=2))

print(f"\n\nItems with NutritionReady=true: {nutrition_ready_count}/{all_items_count}")

# Try to fetch individual item details
if sample_item_id:
    print(f"\n\nTrying to fetch item details for ID: {sample_item_id}")
    item_url = f"https://api.hfs.purdue.edu/menus/v2/items/{sample_item_id}"
    try:
        item_response = requests.get(item_url, headers=headers, timeout=15)
        print(f"Status: {item_response.status_code}")
        if item_response.ok:
            item_data = item_response.json()
            print(json.dumps(item_data, indent=2))
    except Exception as e:
        print(f"Error: {e}")
