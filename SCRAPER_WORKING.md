# Purdue Menu Scraper - Working Implementation

## Overview
The scraper now successfully fetches menu items with complete nutritional information from Purdue Dining Services.

## How It Works

### Data Source
- **Primary Method**: Purdue Dining API (`https://api.hfs.purdue.edu/menus/v2/`)
- **Fallback Method**: Web scraping with Selenium (if API fails)

### API Approach
1. Fetches menu structure from `/locations/{dining_court}/{date}`
2. For each item with `NutritionReady: true`, fetches detailed nutrition from `/items/{item_id}`
3. Extracts: Calories, Protein, Carbs, Total Fat

### Supported Dining Courts
- Earhart
- Ford
- Hillenbrand
- Wiley
- Windsor

## Usage

### Test Mode (No Database)
```powershell
python scraper/menu_scraper.py --test
```

### Production Mode (Save to Database)
```powershell
# Set DATABASE_URL environment variable first
$env:DATABASE_URL = "your_postgresql_connection_string"

# Run scraper
python scraper/menu_scraper.py
```

## Sample Output
```
Scraping Wiley...
  Fetching from API: https://api.hfs.purdue.edu/menus/v2/locations/Wiley/2025-10-02
  Fetching nutrition for 74 items...
  Found 84 items

Sample items:
  - Scrambled Eggs (154 cal) from Earhart
  - Chicken Sausage Patty (130 cal) from Earhart
  - Fried Chicken (305 cal) from Wiley
  - Garlic Mashed Potatoes (145 cal) from Wiley
```

## Data Captured
For each menu item:
- **name**: Food item name
- **calories**: Caloric content
- **protein**: Protein in grams
- **carbs**: Carbohydrates in grams
- **fats**: Total fat in grams
- **dining_court**: Which dining hall
- **station**: Which station/section (e.g., "Classic Flavors", "La Fonda")
- **meal_period**: Breakfast, Lunch, or Dinner

## Requirements
- Python 3.7+
- requests
- beautifulsoup4
- psycopg2-binary
- selenium (for fallback method)
- Chrome/ChromeDriver (for fallback method)

## Notes
- The scraper includes rate limiting (0.5s delay per 10 items) to be respectful to Purdue's API
- Items without nutrition data (NutritionReady: false) will show 0 for all nutrition values
- The scraper automatically handles date formatting and timezone issues
