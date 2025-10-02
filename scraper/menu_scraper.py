import requests
from bs4 import BeautifulSoup
import psycopg2
import os
import sys
import re
from datetime import datetime
import json

# Purdue dining courts
DINING_COURTS = {
    'Earhart': 'earhart',
    'Ford': 'ford',
    'Hillenbrand': 'hillenbrand',
    'Wiley': 'wiley',
    'Windsor': 'windsor',
}

def scrape_purdue_menu(dining_court='earhart', meal_period='lunch'):
    """
    Scrape Purdue dining menu from the official Purdue Dining API/website.
    
    Args:
        dining_court: The dining court identifier (earhart, ford, hillenbrand, wiley, windsor)
        meal_period: The meal period (breakfast, lunch, dinner)
    
    Returns:
        List of food items with nutrition info
    """
    # Purdue Dining API endpoint
    base_url = f"https://api.hfs.purdue.edu/menus/v2/locations/{dining_court}"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(base_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        menu_items = []
        
        # Parse the API response
        if isinstance(data, dict):
            # Look for menu data in various possible structures
            meals = data.get('Meals', [])
            
            for meal in meals:
                if meal.get('Name', '').lower() == meal_period.lower():
                    stations = meal.get('Stations', [])
                    
                    for station in stations:
                        items = station.get('Items', [])
                        station_name = station.get('Name', 'Unknown Station')
                        
                        for item in items:
                            name = item.get('Name', '').strip()
                            if not name:
                                continue
                            
                            # Extract nutrition info
                            nutrition = item.get('Nutrition', {})
                            calories = nutrition.get('Calories', 0)
                            protein = nutrition.get('ProteinGrams', 0)
                            carbs = nutrition.get('CarbohydratesGrams', 0)
                            fats = nutrition.get('FatGrams', 0)
                            
                            # Try to extract numeric values if they're strings
                            try:
                                calories = int(float(str(calories).replace('g', '').strip()))
                            except (ValueError, AttributeError):
                                calories = 0
                            
                            try:
                                protein = float(str(protein).replace('g', '').strip())
                            except (ValueError, AttributeError):
                                protein = 0
                            
                            try:
                                carbs = float(str(carbs).replace('g', '').strip())
                            except (ValueError, AttributeError):
                                carbs = 0
                            
                            try:
                                fats = float(str(fats).replace('g', '').strip())
                            except (ValueError, AttributeError):
                                fats = 0
                            
                            menu_items.append({
                                'name': name,
                                'calories': calories,
                                'protein': protein,
                                'carbs': carbs,
                                'fats': fats,
                                'dining_court': dining_court,
                                'station': station_name,
                                'meal_period': meal_period
                            })
        
        return menu_items
    
    except requests.RequestException as e:
        print(f"Error fetching menu for {dining_court}: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        return []

def scrape_all_dining_courts():
    """Scrape all Purdue dining courts for today's menu."""
    all_items = []
    meal_periods = ['breakfast', 'lunch', 'dinner']
    
    for court_name, court_id in DINING_COURTS.items():
        print(f"Scraping {court_name}...")
        for period in meal_periods:
            items = scrape_purdue_menu(court_id, period)
            all_items.extend(items)
            print(f"  Found {len(items)} items for {period}")
    
    return all_items

def save_to_database(menu_items, database_url=None):
    """Save menu items to the database."""
    if not database_url:
        database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("ERROR: No DATABASE_URL provided")
        return
    
    # Convert postgres:// to postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Create foods table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS foods (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                calories INT NOT NULL,
                macros JSONB NOT NULL,
                dining_court VARCHAR(100),
                station VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        added_count = 0
        skipped_count = 0
        
        for item in menu_items:
            # Check if item already exists (avoid duplicates)
            cursor.execute(
                "SELECT id FROM foods WHERE name = %s AND dining_court = %s",
                (item['name'], item.get('dining_court'))
            )
            
            if cursor.fetchone():
                skipped_count += 1
                continue
            
            # Insert new food item
            cursor.execute(
                """
                INSERT INTO foods (name, calories, macros, dining_court, station)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    item['name'],
                    item['calories'],
                    json.dumps({
                        'protein': item['protein'],
                        'carbs': item['carbs'],
                        'fats': item['fats']
                    }),
                    item.get('dining_court'),
                    item.get('station')
                )
            )
            added_count += 1
        
        conn.commit()
        print(f"\n✓ Added {added_count} new items to database")
        print(f"✓ Skipped {skipped_count} duplicate items")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR saving to database: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise

if __name__ == "__main__":
    print("BoilerFuel Menu Scraper")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        # Test mode: just scrape and print, don't save
        print("TEST MODE: Scraping without saving to database\n")
        items = scrape_all_dining_courts()
        print(f"\nTotal items found: {len(items)}")
        if items:
            print("\nSample items:")
            for item in items[:5]:
                print(f"  - {item['name']} ({item['calories']} cal) from {item['dining_court']}")
    else:
        # Normal mode: scrape and save
        items = scrape_all_dining_courts()
        print(f"\nTotal items scraped: {len(items)}")
        
        if items:
            print("\nSaving to database...")
            save_to_database(items)
            print("\n✓ Scraping complete!")
        else:
            print("\n⚠ No items found to save")