"""
Automated Menu Sync Script

This script ensures the database stays in sync with the Purdue Dining API.
Run this daily to prevent menu mismatches.

Usage:
    python auto_sync_menus.py [--days N]

Options:
    --days N    Number of days ahead to sync (default: 7)
"""

import os
import sys
import argparse
from datetime import datetime, timedelta
import psycopg2
import requests
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from scraper.dining_locations import DINING_LOCATIONS

def normalize_text(value):
    """Normalize text for comparison (matches frontend logic)."""
    if not value:
        return ''
    import re
    text = str(value).lower()
    text = re.sub(r'[^a-z0-9]+', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def build_key(name, meal_time, station):
    """Build composite key for item matching."""
    return f"{normalize_text(name)}|{normalize_text(meal_time)}|{normalize_text(station)}"

def normalize_meal(name):
    """Normalize meal names."""
    key = normalize_text(name)
    if key in ['late lunch', 'latelunch']:
        return 'late lunch'
    if key in ['breakfast', 'lunch', 'dinner']:
        return key
    return name or 'Unknown'

def fetch_menu(location_code, date_str):
    """Fetch menu from API."""
    url = f"https://api.hfs.purdue.edu/menus/v2/locations/{location_code}/{date_str}"
    headers = {'User-Agent': 'BoilerFuelSync/1.0', 'Accept': 'application/json'}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return None

def extract_api_items(menu_json):
    """Extract items from API response with normalized keys."""
    items = {}
    if not menu_json or 'Meals' not in menu_json:
        return items
    
    for meal in menu_json.get('Meals', []):
        meal_name = normalize_meal(meal.get('Name', 'Unknown'))
        
        for station in meal.get('Stations', []):
            station_name = (station.get('Name') or 'Unknown').strip()
            
            for item in station.get('Items', []):
                name = (item.get('Name') or '').strip()
                if not name:
                    continue
                
                key = build_key(name, meal_name, station_name)
                items[key] = {
                    'name': name,
                    'meal_time': meal_name,
                    'station': station_name,
                    'item_id': item.get('ID'),
                    'nutrition_ready': item.get('NutritionReady', False)
                }
    
    return items

def get_db_items_for_date(cursor, dining_court, date_str):
    """Get items scheduled in DB for a specific date."""
    cursor.execute("""
        SELECT name, meal_time, station, next_available, id
        FROM foods
        WHERE dining_court = %s AND next_available IS NOT NULL
    """, (dining_court,))
    
    items = {}
    item_ids = {}
    
    for name, meal_time, station, next_available, food_id in cursor.fetchall():
        schedule = next_available if isinstance(next_available, list) else []
        
        for slot in schedule:
            if slot.get('date') == date_str:
                meal_for_date = slot.get('meal_time', meal_time)
                key = build_key(name, meal_for_date, station)
                items[key] = {
                    'name': name,
                    'meal_time': meal_for_date,
                    'station': station or 'Unknown',
                    'food_id': food_id
                }
                item_ids[key] = food_id
    
    return items, item_ids

def sync_location_date(cursor, conn, location, date_str):
    """Sync a specific location for a specific date."""
    api_name = location['api_name']
    display_name = location['display_name']
    
    # Fetch from API
    menu_json = fetch_menu(api_name, date_str)
    if not menu_json:
        return None
    
    # Check if location is closed
    if menu_json.get('IsOpen') is False or menu_json.get('IsPublished') is False:
        return {'status': 'closed', 'items': 0}
    
    # Extract API items
    api_items = extract_api_items(menu_json)
    if not api_items:
        return {'status': 'closed', 'items': 0}
    
    # Get DB items
    db_items, db_ids = get_db_items_for_date(cursor, display_name, date_str)
    
    changes = {'status': 'ok', 'added': 0, 'removed': 0, 'unchanged': 0}
    
    # Find items to add (in API but not in DB)
    for key, item in api_items.items():
        if key not in db_items:
            # Need to add this item
            add_item_to_schedule(cursor, conn, display_name, item, date_str)
            changes['added'] += 1
        else:
            changes['unchanged'] += 1
    
    # Find items to remove (in DB but not in API)
    for key, item in db_items.items():
        if key not in api_items:
            # Remove this date from the item's schedule
            remove_date_from_schedule(cursor, conn, item['food_id'], date_str)
            changes['removed'] += 1
    
    return changes

def add_item_to_schedule(cursor, conn, dining_court, item, date_str):
    """Add an item or update its schedule."""
    name = item['name']
    meal_time = item['meal_time']
    station = item['station']
    
    # Check if item exists
    cursor.execute("""
        SELECT id, next_available FROM foods
        WHERE name = %s AND dining_court = %s AND meal_time = %s AND station = %s
    """, (name, dining_court, meal_time, station))
    
    existing = cursor.fetchone()
    day_name = datetime.strptime(date_str, '%Y-%m-%d').strftime('%A')
    
    if existing:
        food_id, next_available = existing
        schedule = next_available if isinstance(next_available, list) else []
        
        # Add date if not present
        if not any(slot.get('date') == date_str for slot in schedule):
            schedule.append({
                'date': date_str,
                'day_name': day_name,
                'meal_time': meal_time
            })
            
            cursor.execute("""
                UPDATE foods SET next_available = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (json.dumps(schedule), food_id))
            conn.commit()
    else:
        # Item doesn't exist - create with minimal data (will be enriched by full scraper)
        schedule = [{'date': date_str, 'day_name': day_name, 'meal_time': meal_time}]
        
        cursor.execute("""
            INSERT INTO foods (name, calories, macros, dining_court, station, meal_time, next_available)
            VALUES (%s, 0, %s, %s, %s, %s, %s)
        """, (
            name,
            json.dumps({'protein': 0, 'carbs': 0, 'fats': 0, 'serving_size': '1 serving'}),
            dining_court,
            station,
            meal_time,
            json.dumps(schedule)
        ))
        conn.commit()

def remove_date_from_schedule(cursor, conn, food_id, date_str):
    """Remove a specific date from an item's schedule."""
    cursor.execute("SELECT next_available FROM foods WHERE id = %s", (food_id,))
    row = cursor.fetchone()
    if not row:
        return
    
    next_available = row[0]
    schedule = next_available if isinstance(next_available, list) else []
    
    # Remove the date
    schedule = [slot for slot in schedule if slot.get('date') != date_str]
    
    if schedule:
        cursor.execute("""
            UPDATE foods SET next_available = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (json.dumps(schedule), food_id))
    else:
        cursor.execute("""
            UPDATE foods SET next_available = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (food_id,))
    
    conn.commit()

def main():
    parser = argparse.ArgumentParser(description='Sync menus with Purdue Dining API')
    parser.add_argument('--days', type=int, default=7, help='Days ahead to sync (default: 7)')
    args = parser.parse_args()
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        return 1
    
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    print(f"{'='*60}")
    print(f"Menu Sync - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        total_added = 0
        total_removed = 0
        
        for day_offset in range(args.days):
            date = datetime.now() + timedelta(days=day_offset)
            date_str = date.strftime('%Y-%m-%d')
            day_name = date.strftime('%A')
            
            print(f"\n{day_name}, {date.strftime('%B %d, %Y')} ({date_str})")
            print("-" * 60)
            
            for location in DINING_LOCATIONS:
                result = sync_location_date(cursor, conn, location, date_str)
                
                if result is None:
                    print(f"  {location['display_name']:25} - API Error")
                elif result['status'] == 'closed':
                    print(f"  {location['display_name']:25} - Closed")
                else:
                    status = []
                    if result['added'] > 0:
                        status.append(f"+{result['added']}")
                        total_added += result['added']
                    if result['removed'] > 0:
                        status.append(f"-{result['removed']}")
                        total_removed += result['removed']
                    if not status:
                        status = ['✓']
                    
                    print(f"  {location['display_name']:25} - {' '.join(status)}")
        
        cursor.close()
        conn.close()
        
        print(f"\n{'='*60}")
        print(f"Sync complete: +{total_added} added, -{total_removed} removed")
        print(f"{'='*60}")
        
        return 0
    
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
