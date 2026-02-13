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

from scraper.dining_locations import DINING_LOCATIONS


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
                'serving_size': macros_dict.get('serving_size', '1 serving'),
                'saturated_fat': macros_dict.get('saturated_fat', 0.0),
                'cholesterol': macros_dict.get('cholesterol', 0.0),
                'sodium': macros_dict.get('sodium', 0.0),
                'fiber': macros_dict.get('fiber', 0.0),
                'sugar': macros_dict.get('sugar', 0.0),
                'added_sugar': macros_dict.get('added_sugar', 0.0),
                'is_vegetarian': macros_dict.get('is_vegetarian', False),
                'is_vegan': macros_dict.get('is_vegan', False),
                'allergens': macros_dict.get('allergens', []),
                'ingredients': macros_dict.get('ingredients', ''),
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
        Dictionary with full nutrition, allergens, and ingredients or None if failed
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
            label_value = nutrient.get('LabelValue', '')

            if 'calories' in name and 'from' not in name:
                nutrition['calories'] = int(float(value)) if value else 0
            elif 'protein' in name:
                nutrition['protein'] = float(value) if value else 0.0
            elif 'total carbohydrate' in name:
                nutrition['carbs'] = float(value) if value else 0.0
            elif 'total fat' in name and 'saturated' not in name:
                nutrition['fats'] = float(value) if value else 0.0
            elif 'saturated fat' in name:
                nutrition['saturated_fat'] = float(value) if value else 0.0
            elif 'cholesterol' in name:
                nutrition['cholesterol'] = float(value) if value else 0.0
            elif 'sodium' in name:
                nutrition['sodium'] = float(value) if value else 0.0
            elif 'dietary fiber' in name:
                nutrition['fiber'] = float(value) if value else 0.0
            elif name == 'sugar' or name == 'sugars':
                nutrition['sugar'] = float(value) if value else 0.0
            elif 'added sugar' in name:
                nutrition['added_sugar'] = float(value) if value else 0.0
            elif 'serving size' in name and label_value:
                serving_size = label_value

        # Add serving size to nutrition dict
        nutrition['serving_size'] = serving_size.strip() if serving_size else '1 serving'

        # Extract allergen/dietary tags
        allergens = item_data.get('Allergens', [])
        tags = {}
        for a in allergens:
            tag_name = a.get('Name', '')
            tag_val = a.get('Value', False)
            if tag_name and tag_val:
                tags[tag_name.lower()] = True
        nutrition['is_vegetarian'] = tags.get('vegetarian', False)
        nutrition['is_vegan'] = tags.get('vegan', False)
        # Collect active allergens (exclude vegetarian/vegan which are positive tags)
        active_allergens = [a.get('Name') for a in allergens
                           if a.get('Value') and a.get('Name', '').lower() not in ('vegetarian', 'vegan')]
        nutrition['allergens'] = active_allergens

        # Extract ingredients
        ingredients = item_data.get('Ingredients', '')
        nutrition['ingredients'] = ingredients.strip() if ingredients else ''

        return nutrition

    except Exception as e:
        return None

def scrape_purdue_menu_api(api_location='Wiley', date_str=None, nutrition_cache=None,
                           display_name=None, court_code=None, available_date=None):
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
    location_param = api_location
    api_url = f"https://api.hfs.purdue.edu/menus/v2/locations/{location_param}/{date_str}"
    
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
                            'is_vegetarian': item.get('IsVegetarian', False),
                            'allergens_raw': item.get('Allergens', []),
                            'dining_court': display_name or api_location,
                            'dining_court_code': court_code or api_location,
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
            saturated_fat = 0.0
            cholesterol = 0.0
            sodium = 0.0
            fiber = 0.0
            sugar = 0.0
            added_sugar = 0.0
            is_vegetarian = item_info.get('is_vegetarian', False)
            is_vegan = False
            allergens = []
            ingredients = ''

            # Extract allergens from menu-level data
            allergens_raw = item_info.get('allergens_raw', [])
            for a in allergens_raw:
                tag_name = a.get('Name', '')
                tag_val = a.get('Value', False)
                if tag_val:
                    if tag_name.lower() == 'vegetarian':
                        is_vegetarian = True
                    elif tag_name.lower() == 'vegan':
                        is_vegan = True
                    elif tag_name:
                        allergens.append(tag_name)

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
                saturated_fat = cached_nutrition.get('saturated_fat', 0.0)
                cholesterol = cached_nutrition.get('cholesterol', 0.0)
                sodium = cached_nutrition.get('sodium', 0.0)
                fiber = cached_nutrition.get('fiber', 0.0)
                sugar = cached_nutrition.get('sugar', 0.0)
                added_sugar = cached_nutrition.get('added_sugar', 0.0)
                is_vegetarian = cached_nutrition.get('is_vegetarian', is_vegetarian)
                is_vegan = cached_nutrition.get('is_vegan', is_vegan)
                allergens = cached_nutrition.get('allergens', allergens) or allergens
                ingredients = cached_nutrition.get('ingredients', '')
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
                    saturated_fat = nutrition.get('saturated_fat', 0.0)
                    cholesterol = nutrition.get('cholesterol', 0.0)
                    sodium = nutrition.get('sodium', 0.0)
                    fiber = nutrition.get('fiber', 0.0)
                    sugar = nutrition.get('sugar', 0.0)
                    added_sugar = nutrition.get('added_sugar', 0.0)
                    is_vegetarian = nutrition.get('is_vegetarian', is_vegetarian)
                    is_vegan = nutrition.get('is_vegan', is_vegan)
                    allergens = nutrition.get('allergens', allergens) or allergens
                    ingredients = nutrition.get('ingredients', '')
                    fetched_count += 1

                    # Add to cache for this session
                    nutrition_cache[cache_key] = {
                        'calories': calories,
                        'protein': protein,
                        'carbs': carbs,
                        'fats': fats,
                        'serving_size': serving_size,
                        'saturated_fat': saturated_fat,
                        'cholesterol': cholesterol,
                        'sodium': sodium,
                        'fiber': fiber,
                        'sugar': sugar,
                        'added_sugar': added_sugar,
                        'is_vegetarian': is_vegetarian,
                        'is_vegan': is_vegan,
                        'allergens': allergens,
                        'ingredients': ingredients,
                    }

            menu_items.append({
                'name': item_info['name'],
                'calories': calories,
                'protein': protein,
                'carbs': carbs,
                'fats': fats,
                'serving_size': serving_size,
                'saturated_fat': saturated_fat,
                'cholesterol': cholesterol,
                'sodium': sodium,
                'fiber': fiber,
                'sugar': sugar,
                'added_sugar': added_sugar,
                'is_vegetarian': is_vegetarian,
                'is_vegan': is_vegan,
                'allergens': allergens,
                'ingredients': ingredients,
                'dining_court': item_info['dining_court'],
                'dining_court_code': item_info.get('dining_court_code'),
                'station': item_info['station'],
                'meal_period': item_info['meal_period'],
                'available_date': available_date or date_str
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
    
    # Purdue Dining website uses slugged path segments
    slug = re.sub(r'[^A-Za-z0-9]+', '-', dining_court.strip()).strip('-').lower()
    url = f"https://dining.purdue.edu/menus/{slug}/{date}/"
    
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

def _scrape_all_dining_courts_internal(date=None, use_cache=True, days_ahead=7,
                                       include_snapshots=False, schedule_start_date=None):
    """
    Scrape all Purdue dining courts for menus using the API.

    Args:
        date: Date in YYYY/MM/DD format (optional, defaults to today)
        use_cache: Whether to use the nutrition cache from database (default: True)
        days_ahead: Number of days to scrape ahead
        include_snapshots: Whether to return per-date snapshot items
        schedule_start_date: Earliest date to include in next_appearances

    Returns:
        If include_snapshots is False: list of unique menu items with schedule
        If include_snapshots is True: (items_with_schedule, snapshot_items)
    """
    from datetime import datetime, timedelta
    
    all_items = []
    food_schedules = {}  # Track when each food appears: {(name, dining_court, meal_time): [(date, meal_time)]}
    
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

    if schedule_start_date is None:
        schedule_start_date = datetime.now().date()
    elif isinstance(schedule_start_date, str):
        schedule_start_date = datetime.strptime(schedule_start_date, '%Y-%m-%d').date()
    
    print(f"\nStarting scrape for {days_ahead} days ahead...")
    
    # Scrape each day
    for day_offset in range(days_ahead):
        current_date = start_date + timedelta(days=day_offset)
        date_str = current_date.strftime('%Y-%m-%d')
        day_name = current_date.strftime('%A')  # Monday, Tuesday, etc.
        
        print(f"\n{'='*60}")
        print(f"Scraping for {day_name}, {current_date.strftime('%B %d, %Y')}")
        print(f"{'='*60}")
        
        for court in DINING_LOCATIONS:
            display_name = court['display_name']
            api_name = court['api_name']
            court_code = court['code']
            print(f"\n  {display_name} ({court_code})...")
            items = scrape_purdue_menu_api(
                api_location=api_name,
                date_str=date_str,
                nutrition_cache=nutrition_cache,
                display_name=display_name,
                court_code=court_code,
                available_date=date_str
            )
            
            if not items:
                print(f"    API failed, trying web scraping...")
                # Fallback to Selenium scraping if API fails
                # In CI environments (like GitHub Actions), Chrome/ChromeDriver may not be available.
                # Gracefully skip the fallback if the driver cannot be created.
                try:
                    driver = create_driver()
                    try:
                        items = scrape_purdue_menu(api_name, None, driver)
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
                meal_time = item.get('meal_period', 'Unknown')
                station_name = item.get('station', 'Unknown')
                key = (
                    item['name'].lower().strip(),
                    item['dining_court'].lower().strip() if item.get('dining_court') else '',
                    meal_time.lower() if isinstance(meal_time, str) else 'unknown',
                    station_name.lower().strip() if isinstance(station_name, str) else 'unknown'
                )

                if key not in food_schedules:
                    food_schedules[key] = []

                if current_date.date() >= schedule_start_date:
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
    
    seen = set()
    for item in all_items:
        meal_time = item.get('meal_period', 'Unknown')
        station_name = item.get('station', 'Unknown')
        key = (
            item['name'].lower().strip(),
            item['dining_court'].lower().strip() if item.get('dining_court') else '',
            meal_time.lower() if isinstance(meal_time, str) else 'unknown',
            station_name.lower().strip() if isinstance(station_name, str) else 'unknown'
        )
        schedule = food_schedules.get(key, [])

        if key in seen:
            continue
        seen.add(key)

        if schedule:
            item['next_appearances'] = schedule
        items_with_schedule.append(item)
    
    if include_snapshots:
        return items_with_schedule, all_items
    return items_with_schedule

def scrape_all_dining_courts(date=None, use_cache=True, days_ahead=7):
    """
    Scrape all Purdue dining courts for upcoming menus using the API.

    Returns:
        List of all menu items with schedule information
    """
    return _scrape_all_dining_courts_internal(
        date=date,
        use_cache=use_cache,
        days_ahead=days_ahead,
        include_snapshots=False
    )

def scrape_all_dining_courts_with_snapshots(date=None, use_cache=True, days_ahead=7, schedule_start_date=None):
    """
    Scrape all dining courts and return unique items plus per-date snapshots.
    """
    return _scrape_all_dining_courts_internal(
        date=date,
        use_cache=use_cache,
        days_ahead=days_ahead,
        include_snapshots=True,
        schedule_start_date=schedule_start_date
    )

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
            
            # Prepare schedule data
            schedule_data = item.get('next_appearances', [])
            primary_meal_time = item.get('meal_period', 'Unknown') or 'Unknown'
            
            # If we have schedule but meal_period is missing, fall back to schedule
            if (not primary_meal_time or primary_meal_time == 'Unknown') and schedule_data:
                primary_meal_time = schedule_data[0]['meal_time']

            display_court = item.get('dining_court')
            court_code = item.get('dining_court_code')
            court_for_storage = display_court or court_code
            possible_courts = [court_for_storage] if court_for_storage else []
            if court_code and court_code not in possible_courts:
                possible_courts.append(court_code)
            if display_court and display_court not in possible_courts:
                possible_courts.append(display_court)
            possible_courts = [c for c in possible_courts if c]
            if not possible_courts:
                possible_courts = ['Unknown']
            if not court_for_storage:
                court_for_storage = possible_courts[0]
            
            station_name = item.get('station', 'Unknown')
            
            # Check if item already exists (match by name, dining_court, meal_time, AND station)
            placeholders = ','.join(['%s'] * len(possible_courts))
            params = [item['name'], primary_meal_time, station_name]
            params.extend(possible_courts)
            cursor.execute(
                f"SELECT id, calories, dining_court FROM foods WHERE name = %s AND meal_time = %s AND station = %s AND dining_court IN ({placeholders}) LIMIT 1",
                tuple(params)
            )
            
            existing = cursor.fetchone()
            
            if existing:
                existing_id, existing_calories, existing_court_value = existing
                
                # Build extended macros JSON
                macros_json = json.dumps({
                    'protein': item['protein'],
                    'carbs': item['carbs'],
                    'fats': item['fats'],
                    'serving_size': item.get('serving_size', '1 serving'),
                    'saturated_fat': item.get('saturated_fat', 0.0),
                    'cholesterol': item.get('cholesterol', 0.0),
                    'sodium': item.get('sodium', 0.0),
                    'fiber': item.get('fiber', 0.0),
                    'sugar': item.get('sugar', 0.0),
                    'added_sugar': item.get('added_sugar', 0.0),
                    'is_vegetarian': item.get('is_vegetarian', False),
                    'is_vegan': item.get('is_vegan', False),
                    'allergens': item.get('allergens', []),
                    'ingredients': item.get('ingredients', ''),
                })

                # Always update with new schedule information
                cursor.execute(
                    """
                    UPDATE foods
                    SET calories = %s, macros = %s, station = %s, meal_time = %s,
                        dining_court = %s,
                        next_available = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (
                        item['calories'],
                        macros_json,
                        item.get('station'),
                        primary_meal_time,
                        display_court or existing_court_value,
                        json.dumps(schedule_data) if schedule_data else None,
                        existing_id
                    )
                )
                updated_count += 1
            else:
                # Build extended macros JSON
                macros_json = json.dumps({
                    'protein': item['protein'],
                    'carbs': item['carbs'],
                    'fats': item['fats'],
                    'serving_size': item.get('serving_size', '1 serving'),
                    'saturated_fat': item.get('saturated_fat', 0.0),
                    'cholesterol': item.get('cholesterol', 0.0),
                    'sodium': item.get('sodium', 0.0),
                    'fiber': item.get('fiber', 0.0),
                    'sugar': item.get('sugar', 0.0),
                    'added_sugar': item.get('added_sugar', 0.0),
                    'is_vegetarian': item.get('is_vegetarian', False),
                    'is_vegan': item.get('is_vegan', False),
                    'allergens': item.get('allergens', []),
                    'ingredients': item.get('ingredients', ''),
                })

                # Insert new food item
                cursor.execute(
                    """
                    INSERT INTO foods (name, calories, macros, dining_court, station, meal_time, next_available)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        item['name'],
                        item['calories'],
                        macros_json,
                        court_for_storage,
                        item.get('station'),
                        primary_meal_time,
                        json.dumps(schedule_data) if schedule_data else None
                    )
                )
                added_count += 1
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"  Saved to DB: {added_count} added, {updated_count} updated")
        
    except Exception as e:
        print(f"  Error saving to database: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()

def save_menu_snapshots(menu_items, database_url=None, source='api'):
    """
    Save per-date menu snapshots to the database for historical verification.
    """
    if not database_url:
        database_url = os.getenv('DATABASE_URL')

    if not database_url:
        print("ERROR: No DATABASE_URL provided")
        return

    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_snapshots (
                id SERIAL PRIMARY KEY,
                menu_date DATE NOT NULL,
                name VARCHAR(255) NOT NULL,
                calories INT NOT NULL,
                macros JSONB NOT NULL,
                dining_court VARCHAR(100) NOT NULL,
                dining_court_code VARCHAR(10),
                station VARCHAR(255),
                meal_time VARCHAR(50),
                source VARCHAR(20) DEFAULT 'api',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='menu_snapshots' AND column_name='dining_court_code'
                ) THEN
                    ALTER TABLE menu_snapshots ADD COLUMN dining_court_code VARCHAR(10);
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='menu_snapshots' AND column_name='source'
                ) THEN
                    ALTER TABLE menu_snapshots ADD COLUMN source VARCHAR(20) DEFAULT 'api';
                END IF;
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='menu_snapshots' AND column_name='updated_at'
                ) THEN
                    ALTER TABLE menu_snapshots ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
                END IF;
            END $$;
        """)

        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_snapshots_unique
            ON menu_snapshots(menu_date, dining_court, meal_time, station, name)
        """)

        saved = 0

        for item in menu_items:
            menu_date = item.get('available_date') or item.get('menu_date')
            if not menu_date:
                continue

            meal_time = item.get('meal_period', 'Unknown') or 'Unknown'
            dining_court = item.get('dining_court') or item.get('dining_court_code') or 'Unknown'
            dining_court_code = item.get('dining_court_code')

            macros_json = json.dumps({
                'protein': item['protein'],
                'carbs': item['carbs'],
                'fats': item['fats'],
                'serving_size': item.get('serving_size', '1 serving'),
                'saturated_fat': item.get('saturated_fat', 0.0),
                'cholesterol': item.get('cholesterol', 0.0),
                'sodium': item.get('sodium', 0.0),
                'fiber': item.get('fiber', 0.0),
                'sugar': item.get('sugar', 0.0),
                'added_sugar': item.get('added_sugar', 0.0),
                'is_vegetarian': item.get('is_vegetarian', False),
                'is_vegan': item.get('is_vegan', False),
                'allergens': item.get('allergens', []),
                'ingredients': item.get('ingredients', ''),
            })

            cursor.execute(
                """
                INSERT INTO menu_snapshots
                    (menu_date, name, calories, macros, dining_court, dining_court_code, station, meal_time, source, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (menu_date, dining_court, meal_time, station, name)
                DO UPDATE SET
                    calories = EXCLUDED.calories,
                    macros = EXCLUDED.macros,
                    dining_court_code = EXCLUDED.dining_court_code,
                    source = EXCLUDED.source,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    menu_date,
                    item['name'],
                    item['calories'],
                    macros_json,
                    dining_court,
                    dining_court_code,
                    item.get('station'),
                    meal_time,
                    source
                )
            )
            saved += 1

        conn.commit()
        cursor.close()
        conn.close()

        print(f"  Snapshot rows saved: {saved}")

    except Exception as e:
        print(f"  Error saving menu snapshots: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()

def scrape_and_save(database_url=None, days_ahead=7, use_cache=True, date=None):
    """
    Scrape menu items and save them to the database.
    
    Args:
        database_url: Database connection string
        days_ahead: Number of days to scrape
        use_cache: Whether to use nutrition cache
        date: Start date

    Returns the list of items scraped.
    """
    print("Programmatic scrape_and_save starting...")
    items = scrape_all_dining_courts(date=date, use_cache=use_cache, days_ahead=days_ahead)
    print(f"Programmatic scrape found {len(items)} unique items")
    if items:
        try:
            save_to_database(items, database_url=database_url)
        except Exception as e:
            print(f"Error saving scraped items: {e}")
            raise
    return items

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
        # Normal mode: scrape and save using the programmatic helper
        print(f"Scraping {days_ahead} day{'s' if days_ahead > 1 else ''} ahead for forecast data...\n")
        items = scrape_and_save(database_url=os.getenv('DATABASE_URL'), days_ahead=days_ahead, use_cache=use_cache, date=args.date)

        print(f"\nTotal unique items scraped: {len(items)}")
        if items:
            print("\n[OK] Scraping complete!")
        else:
            print("\n[WARN] No items found to save")
