import requests
from bs4 import BeautifulSoup
import psycopg2
import os
import sys
import re
from datetime import datetime
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Purdue dining courts - mapping display names to URL identifiers
DINING_COURTS = {
    'Earhart': 'Earhart',
    'Ford': 'Ford',
    'Hillenbrand': 'Hillenbrand',
    'Wiley': 'Wiley',
    'Windsor': 'Windsor',
}

def get_nutrition_cache(database_url=None):
    """
    Load existing food items from the database into a cache.
    
    Returns:
        Dictionary mapping (name, dining_court) -> nutrition data
    """
    if not database_url:
        database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        return {}
    
    # Convert postgres:// to postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    cache = {}
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Fetch all existing food items
        cursor.execute("""
            SELECT name, dining_court, calories, macros
            FROM foods
        """)
        
        for row in cursor.fetchall():
            name, dining_court, calories, macros = row
            key = (name.lower().strip(), dining_court.lower().strip() if dining_court else '')
            
            macros_dict = macros if isinstance(macros, dict) else {}
            
            cache[key] = {
                'calories': calories,
                'protein': macros_dict.get('protein', 0.0),
                'carbs': macros_dict.get('carbs', 0.0),
                'fats': macros_dict.get('fats', 0.0),
                'serving_size': macros_dict.get('serving_size', '1 serving')
            }
        
        cursor.close()
        conn.close()
        
        print(f"Loaded {len(cache)} items from nutrition cache")
        
    except Exception as e:
        print(f"Warning: Could not load nutrition cache: {e}")
        return {}
    
    return cache

def fetch_item_nutrition(item_id, headers):
    """
    Fetch detailed nutrition information for a specific item.

    Args:
        item_id: The item ID
        headers: Request headers

    Returns:
        Dictionary with calories, protein, carbs, fats, serving_size or None if failed
    """
    try:
        item_url = f"https://api.hfs.purdue.edu/menus/v2/items/{item_id}"
        response = requests.get(item_url, headers=headers, timeout=10)
        response.raise_for_status()

        item_data = response.json()
        nutrition_list = item_data.get('Nutrition', [])

        # Extract serving size from item data
        serving_size = item_data.get('ServingSize', '') or item_data.get('PortionSize', '')

        # Parse nutrition array
        nutrition = {}
        for nutrient in nutrition_list:
            name = nutrient.get('Name', '').lower()
            value = nutrient.get('Value', 0)
            label_value = nutrient.get('LabelValue', '')  # Sometimes serving size is here

            if 'calories' in name and 'from' not in name:
                nutrition['calories'] = int(float(value)) if value else 0
            elif 'protein' in name:
                nutrition['protein'] = float(value) if value else 0.0
            elif 'total carbohydrate' in name:
                nutrition['carbs'] = float(value) if value else 0.0
            elif 'total fat' in name:
                nutrition['fats'] = float(value) if value else 0.0
            elif 'serving size' in name and label_value:
                serving_size = label_value

        # Add serving size to nutrition dict
        nutrition['serving_size'] = serving_size.strip() if serving_size else '1 serving'

        return nutrition

    except Exception as e:
        return None

def scrape_purdue_menu_api(dining_court='Wiley', date_str=None, nutrition_cache=None):
    """
    Scrape Purdue dining menu using the API endpoint directly.
    Uses cached nutrition data when available.
    
    Args:
        dining_court: The dining court name
        date_str: Date in YYYY-MM-DD format (defaults to today)
        nutrition_cache: Dictionary of cached nutrition data (optional)
    
    Returns:
        List of food items with nutrition info
    """
    if date_str is None:
        now = datetime.now()
        date_str = f"{now.year}-{now.month:02d}-{now.day:02d}"
    
    if nutrition_cache is None:
        nutrition_cache = {}
    
    # Try the API endpoint
    api_url = f"https://api.hfs.purdue.edu/menus/v2/locations/{dining_court}/{date_str}"
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
        
        print(f"  Fetching from API: {api_url}")
        response = requests.get(api_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        data = response.json()
        menu_items = []
        items_to_fetch = []
        
        # First pass: collect all items
        if 'Meals' in data:
            for meal in data['Meals']:
                meal_name_raw = meal.get('Name', 'Unknown')
                # Normalize meal name for consistency
                meal_name = meal_name_raw.strip().lower().replace('_', ' ')
                if meal_name in ['late lunch', 'latelunch', 'late-lunch']:
                    meal_name = 'late lunch'
                elif meal_name in ['breakfast']:
                    meal_name = 'breakfast'
                elif meal_name in ['lunch']:
                    meal_name = 'lunch'
                elif meal_name in ['dinner']:
                    meal_name = 'dinner'
                else:
                    meal_name = meal_name_raw.strip()
                
                for station in meal.get('Stations', []):
                    station_name = station.get('Name', 'Unknown')
                    
                    for item in station.get('Items', []):
                        name = item.get('Name', '').strip()
                        if not name:
                            continue
                        
                        item_id = item.get('ID')
                        nutrition_ready = item.get('NutritionReady', False)
                        
                        items_to_fetch.append({
                            'name': name,
                            'item_id': item_id,
                            'nutrition_ready': nutrition_ready,
                            'dining_court': dining_court,
                            'station': station_name,
                            'meal_period': meal_name
                        })
        
        # Second pass: fetch nutrition data (use cache when available)
        items_needing_fetch = [i for i in items_to_fetch if i['nutrition_ready']]
        cached_count = 0
        fetched_count = 0
        
        print(f"  Processing {len(items_to_fetch)} items ({len(items_needing_fetch)} have nutrition)...")
        
        for idx, item_info in enumerate(items_to_fetch):
            calories = 0
            protein = 0.0
            carbs = 0.0
            fats = 0.0
            serving_size = '1 serving'

            # Check cache first
            cache_key = (item_info['name'].lower().strip(), item_info['dining_court'].lower().strip())

            if cache_key in nutrition_cache:
                # Use cached data
                cached_nutrition = nutrition_cache[cache_key]
                calories = cached_nutrition['calories']
                protein = cached_nutrition['protein']
                carbs = cached_nutrition['carbs']
                fats = cached_nutrition['fats']
                serving_size = cached_nutrition.get('serving_size', '1 serving')
                cached_count += 1
            elif item_info['nutrition_ready'] and item_info['item_id']:
                # Fetch from API
                nutrition = fetch_item_nutrition(item_info['item_id'], headers)
                if nutrition:
                    calories = nutrition.get('calories', 0)
                    protein = nutrition.get('protein', 0.0)
                    carbs = nutrition.get('carbs', 0.0)
                    fats = nutrition.get('fats', 0.0)
                    serving_size = nutrition.get('serving_size', '1 serving')
                    fetched_count += 1

                    # Add to cache for this session
                    nutrition_cache[cache_key] = {
                        'calories': calories,
                        'protein': protein,
                        'carbs': carbs,
                        'fats': fats,
                        'serving_size': serving_size
                    }

            menu_items.append({
                'name': item_info['name'],
                'calories': calories,
                'protein': protein,
                'carbs': carbs,
                'fats': fats,
                'serving_size': serving_size,
                'dining_court': item_info['dining_court'],
                'station': item_info['station'],
                'meal_period': item_info['meal_period']
            })
        
        if cached_count > 0 or fetched_count > 0:
            print(f"  Used cache: {cached_count}, Fetched new: {fetched_count}")
        
        return menu_items
    
    except requests.RequestException as e:
        print(f"  API request failed: {e}")
        return []
    except json.JSONDecodeError as e:
        print(f"  JSON decode error: {e}")
        return []
    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()
        return []

def scrape_purdue_menu(dining_court='Wiley', date=None, driver=None):
    """
    Scrape Purdue dining menu from the official Purdue Dining website using Selenium.
    
    Args:
        dining_court: The dining court name (Earhart, Ford, Hillenbrand, Wiley, Windsor)
        date: Date in YYYY/MM/DD format (defaults to today)
        driver: Selenium WebDriver instance (optional, will create new one if not provided)
    
    Returns:
        List of food items with nutrition info
    """
    if date is None:
        now = datetime.now()
        date = f"{now.year}/{now.month}/{now.day}"
    
    # Purdue Dining website URL
    url = f"https://dining.purdue.edu/menus/{dining_court}/{date}/"
    
    close_driver = False
    if driver is None:
        driver = create_driver()
        close_driver = True
    
    try:
        print(f"  Fetching menu from: {url}")
        driver.get(url)
        
        # Wait for the page to load - look for menu items or meal sections
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.menu-item, div.meal-period, article.menu-item, div[class*='item']"))
            )
            time.sleep(2)  # Extra wait for dynamic content
        except TimeoutException:
            print(f"  Timeout waiting for menu items to load")
            return []
        
        # Get the page source after JavaScript has loaded
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        menu_items = []
        
        # Try multiple strategies to find menu items
        
        # Strategy 1: Look for menu-item class
        items = soup.find_all(class_=re.compile(r'menu-item', re.I))
        if items:
            print(f"  Found {len(items)} items using menu-item class")
            for item_div in items:
                item_data = extract_item_data_selenium(item_div, dining_court)
                if item_data:
                    menu_items.append(item_data)
        
        # Strategy 2: Look for structured meal/station layout
        if not menu_items:
            meal_sections = soup.find_all(class_=re.compile(r'meal-period|meal|breakfast|lunch|dinner', re.I))
            print(f"  Found {len(meal_sections)} meal sections")
            
            for meal_section in meal_sections:
                meal_name_raw = extract_text_from_heading(meal_section)
                # Normalize meal name for consistency
                meal_name = meal_name_raw.strip().lower().replace('_', ' ')
                if meal_name in ['late lunch', 'latelunch', 'late-lunch']:
                    meal_name = 'late lunch'
                elif meal_name in ['breakfast']:
                    meal_name = 'breakfast'
                elif meal_name in ['lunch']:
                    meal_name = 'lunch'
                elif meal_name in ['dinner']:
                    meal_name = 'dinner'
                else:
                    meal_name = meal_name_raw.strip()
                
                # Find stations
                stations = meal_section.find_all(class_=re.compile(r'station|category', re.I))
                if not stations:
                    stations = [meal_section]
                
                for station in stations:
                    station_name = extract_text_from_heading(station)
                    
                    # Find items in this station
                    station_items = station.find_all(['div', 'article', 'li'], class_=re.compile(r'item|dish|food', re.I))
                    
                    for item_div in station_items:
                        item_data = extract_item_data_selenium(item_div, dining_court, meal_name, station_name)
                        if item_data:
                            menu_items.append(item_data)
        
        # Strategy 3: Look for any divs/articles with food-related content
        if not menu_items:
            print(f"  Trying fallback: searching for any food items")
            all_items = soup.find_all(['div', 'article'], class_=True)
            
            for item_div in all_items:
                classes = ' '.join(item_div.get('class', []))
                if any(keyword in classes.lower() for keyword in ['item', 'dish', 'food', 'menu']):
                    item_data = extract_item_data_selenium(item_div, dining_court)
                    if item_data:
                        menu_items.append(item_data)
        
        return menu_items
    
    except Exception as e:
        print(f"  Error scraping {dining_court}: {e}")
        import traceback
        traceback.print_exc()
        return []
    
    finally:
        if close_driver and driver:
            driver.quit()

def create_driver():
    """Create a headless Chrome WebDriver."""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        return driver
    except Exception as e:
        print(f"Error creating Chrome driver: {e}")
        print("Make sure Chrome and ChromeDriver are installed")
        raise

def extract_text_from_heading(element):
    """Extract text from heading tags in an element."""
    for tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
        heading = element.find(tag)
        if heading:
            text = heading.get_text(strip=True)
            if text:
                return text
    return 'Unknown'

def extract_item_data_selenium(item_div, dining_court, meal_name='Unknown', station_name='Unknown'):
    """Extract food item data from a menu item div (Selenium version)."""
    try:
        # Extract name - look for various name selectors
        name = None
        
        # Try class-based selectors
        name_elem = item_div.find(class_=re.compile(r'name|title', re.I))
        if name_elem:
            name = name_elem.get_text(strip=True)
        
        # Try heading tags
        if not name:
            for tag in ['h3', 'h4', 'h5', 'strong', 'a']:
                elem = item_div.find(tag)
                if elem:
                    text = elem.get_text(strip=True)
                    if text and len(text) > 2:
                        name = text
                        break
        
        if not name or len(name) < 2:
            return None
        
        # Extract nutrition information
        calories = 0
        protein = 0.0
        carbs = 0.0
        fats = 0.0
        
        # Get all text from the item
        all_text = item_div.get_text()
        
        # Extract numeric values using regex
        cal_match = re.search(r'(\d+)\s*(?:cal|calories)', all_text, re.I)
        if cal_match:
            calories = int(cal_match.group(1))
        
        protein_match = re.search(r'(\d+(?:\.\d+)?)\s*g?\s*protein', all_text, re.I)
        if protein_match:
            protein = float(protein_match.group(1))
        
        carbs_match = re.search(r'(\d+(?:\.\d+)?)\s*g?\s*(?:carb|carbohydrate)', all_text, re.I)
        if carbs_match:
            carbs = float(carbs_match.group(1))
        
        fats_match = re.search(r'(\d+(?:\.\d+)?)\s*g?\s*(?:fat|total fat)', all_text, re.I)
        if fats_match:
            fats = float(fats_match.group(1))
        
        # Try to find nutrition in structured elements
        nutrition_elems = item_div.find_all(class_=re.compile(r'nutrition|nutrient|macro', re.I))
        for elem in nutrition_elems:
            text = elem.get_text()
            
            if 'cal' in text.lower() and calories == 0:
                match = re.search(r'(\d+)', text)
                if match:
                    calories = int(match.group(1))
            
            if 'protein' in text.lower() and protein == 0:
                match = re.search(r'(\d+(?:\.\d+)?)', text)
                if match:
                    protein = float(match.group(1))
            
            if 'carb' in text.lower() and carbs == 0:
                match = re.search(r'(\d+(?:\.\d+)?)', text)
                if match:
                    carbs = float(match.group(1))
            
            if 'fat' in text.lower() and fats == 0:
                match = re.search(r'(\d+(?:\.\d+)?)', text)
                if match:
                    fats = float(match.group(1))
        
        return {
            'name': name,
            'calories': calories,
            'protein': protein,
            'carbs': carbs,
            'fats': fats,
            'dining_court': dining_court,
            'station': station_name,
            'meal_period': meal_name
        }
    
    except Exception as e:
        return None

def scrape_all_dining_courts(date=None, use_cache=True, days_ahead=7):
    """
    Scrape all Purdue dining courts for upcoming menus using the API.
    
    Args:
        date: Date in YYYY/MM/DD format (optional, defaults to today)
        use_cache: Whether to use the nutrition cache from database (default: True)
        days_ahead: Number of days to scrape ahead (default: 7 for next week)
    
    Returns:
        List of all menu items with schedule information
    """
    from datetime import datetime, timedelta
    
    all_items = []
    food_schedules = {}  # Track when each food appears: {(name, dining_court): [(date, meal_time)]}
    
    # Load nutrition cache from database
    nutrition_cache = {}
    if use_cache:
        print("\nLoading nutrition cache from database...")
        nutrition_cache = get_nutrition_cache()
    
    # Determine start date
    if date:
        start_date = datetime.strptime(date.replace('/', '-'), '%Y-%m-%d')
    else:
        start_date = datetime.now()
    
    print(f"\nStarting scrape for {days_ahead} days ahead...")
    
    # Scrape each day
    for day_offset in range(days_ahead):
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.strftime('%Y-%m-%d')
        day_name = current_date.strftime('%A')  # Monday, Tuesday, etc.
        
        print(f"\n{'='*60}")
        print(f"Scraping for {day_name}, {current_date.strftime('%B %d, %Y')}")
        print(f"{'='*60}")
        
        for court_name, court_id in DINING_COURTS.items():
            print(f"\n  {court_name}...")
            items = scrape_purdue_menu_api(court_id, date_str, nutrition_cache)
            
            if not items:
                print(f"    API failed, trying web scraping...")
                # Fallback to Selenium scraping if API fails
                # In CI environments (like GitHub Actions), Chrome/ChromeDriver may not be available.
                # Gracefully skip the fallback if the driver cannot be created.
                try:
                    driver = create_driver()
                    try:
                        items = scrape_purdue_menu(court_id, None, driver)
                    finally:
                        try:
                            driver.quit()
                        except Exception:
                            pass
                except Exception as e:
                    print(f"    Selenium fallback unavailable: {e}")
                    print("    Skipping web scraping for this location/date and continuing...")
            
            # Track schedule for each item
            for item in items:
                key = (item['name'].lower().strip(), item['dining_court'].lower().strip())
                meal_time = item.get('meal_period', 'Unknown')
                
                if key not in food_schedules:
                    food_schedules[key] = []
                
                food_schedules[key].append({
                    'date': date_str,
                    'day_name': day_name,
                    'meal_time': meal_time
                })
            
            all_items.extend(items)
            print(f"    Found {len(items)} items")
    
    # Add schedule information to items
    print(f"\n\nProcessing {len(food_schedules)} unique food items...")
    items_with_schedule = []
    
    for item in all_items:
        key = (item['name'].lower().strip(), item['dining_court'].lower().strip())
        schedule = food_schedules.get(key, [])
        
        # Only add the first occurrence of each item with full schedule info
        if schedule and not any(i['name'] == item['name'] and 
                                i['dining_court'] == item['dining_court'] and 
                                'next_appearances' in i 
                                for i in items_with_schedule):
            item['next_appearances'] = schedule
            items_with_schedule.append(item)
    
    return items_with_schedule

def save_to_database(menu_items, database_url=None):
    """
    Save menu items to the database.
    - Adds new items
    - Updates existing items if they have no nutrition data (calories = 0)
    """
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
                meal_time VARCHAR(50),
                next_available JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add next_available column if it doesn't exist (for existing databases)
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='foods' AND column_name='next_available'
                ) THEN
                    ALTER TABLE foods ADD COLUMN next_available JSONB;
                END IF;
            END $$;
        """)
        
        added_count = 0
        updated_count = 0
        skipped_count = 0
        
        for item in menu_items:
            # Skip items with no nutrition data
            if item['calories'] == 0 and item['protein'] == 0 and item['carbs'] == 0 and item['fats'] == 0:
                skipped_count += 1
                continue
            
            # Prepare schedule data
            schedule_data = item.get('next_appearances', [])
            primary_meal_time = item.get('meal_period', 'Unknown')
            
            # If we have schedule, use the first occurrence for meal_time
            if schedule_data and len(schedule_data) > 0:
                primary_meal_time = schedule_data[0]['meal_time']
            
            # Check if item already exists (match by name and dining_court only)
            cursor.execute(
                "SELECT id, calories FROM foods WHERE name = %s AND dining_court = %s",
                (item['name'], item.get('dining_court'))
            )
            
            existing = cursor.fetchone()
            
            if existing:
                existing_id, existing_calories = existing
                
                # Always update with new schedule information
                cursor.execute(
                    """
                    UPDATE foods
                    SET calories = %s, macros = %s, station = %s, meal_time = %s,
                        next_available = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (
                        item['calories'],
                        json.dumps({
                            'protein': item['protein'],
                            'carbs': item['carbs'],
                            'fats': item['fats'],
                            'serving_size': item.get('serving_size', '1 serving')
                        }),
                        item.get('station'),
                        primary_meal_time,
                        json.dumps(schedule_data) if schedule_data else None,
                        existing_id
                    )
                )
                updated_count += 1
            else:
                # Insert new food item
                cursor.execute(
                    """
                    INSERT INTO foods (name, calories, macros, dining_court, station, meal_time, next_available)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        item['name'],
                        item['calories'],
                        json.dumps({
                            'protein': item['protein'],
                            'carbs': item['carbs'],
                            'fats': item['fats'],
                            'serving_size': item.get('serving_size', '1 serving')
                        }),
                        item.get('dining_court'),
                        item.get('station'),
                        primary_meal_time,
                        json.dumps(schedule_data) if schedule_data else None
                    )
                )
                added_count += 1
        
        conn.commit()
        print(f"\n✓ Added {added_count} new items to database")
        if updated_count > 0:
            print(f"✓ Updated {updated_count} items with new nutrition data")
        print(f"✓ Skipped {skipped_count} items (duplicates or no nutrition)")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR saving to database: {e}")
        if 'conn' in locals():
            conn.rollback()
        raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='BoilerFuel Menu Scraper - Scrape Purdue Dining menus')
    parser.add_argument('--test', action='store_true', help='Test mode: scrape without saving to database')
    parser.add_argument('--days', type=int, default=7, help='Number of days ahead to scrape (1-14, default: 7)')
    parser.add_argument('--date', type=str, help='Start date in YYYY-MM-DD or YYYY/MM/DD format (default: today)')
    parser.add_argument('--no-cache', action='store_true', help='Disable nutrition cache (slower but always fresh)')
    args = parser.parse_args()
    
    print("BoilerFuel Menu Scraper")
    print("=" * 50)
    
    # Validate days parameter
    days_ahead = max(1, min(args.days, 14))  # Limit to 1-14 days
    use_cache = not args.no_cache
    
    if args.test:
        # Test mode: just scrape and print, don't save
        print("TEST MODE: Scraping without saving to database\n")
        items = scrape_all_dining_courts(date=args.date, use_cache=use_cache, days_ahead=days_ahead)
        
        print(f"\nTotal unique items found: {len(items)}")
        if items:
            print("\nSample items:")
            for item in items[:5]:
                print(f"  - {item['name']} ({item['calories']} cal) from {item['dining_court']}")
                if 'next_appearances' in item:
                    appearances = item['next_appearances']
                    print(f"    Next {len(appearances)} appearances:")
                    for app in appearances[:3]:
                        print(f"      • {app['day_name']}, {app['date']} - {app['meal_time']}")
    else:
        # Normal mode: scrape and save
        print(f"Scraping {days_ahead} day{'s' if days_ahead > 1 else ''} ahead for forecast data...\n")
        items = scrape_all_dining_courts(date=args.date, use_cache=use_cache, days_ahead=days_ahead)
        
        print(f"\nTotal unique items scraped: {len(items)}")
        
        if items:
            print("\nSaving to database...")
            save_to_database(items)
            print("\n✓ Scraping complete!")
            print(f"✓ Added {days_ahead}-day forecast data to {len(items)} items")
            
            # Show stats
            with_forecast = sum(1 for item in items if 'next_appearances' in item and len(item['next_appearances']) > 0)
            print(f"✓ {with_forecast} items have forecast schedules")
        else:
            print("\n⚠ No items found to save")