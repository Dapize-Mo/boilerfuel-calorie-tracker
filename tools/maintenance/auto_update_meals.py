"""
Auto-update database with all meals from all dining courts.
This script scrapes all dining courts and saves menu items to the database.
Run this periodically (e.g., daily) to keep the database up to date.
"""

import os
import sys
from datetime import datetime

# Ensure scraper module is importable
repo_root = os.path.dirname(__file__)
sys.path.insert(0, repo_root)

from scraper.menu_scraper import scrape_all_dining_courts, save_to_database

def main():
    """Main function to scrape and update database."""
    print("=" * 60)
    print("BoilerFuel Auto-Update: Scraping All Dining Courts")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check for database URL
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable is not set!")
        print("Please set DATABASE_URL before running this script.")
        return 1
    
    print("Scraping all dining courts with API method...")
    print("This will fetch menu items with meal times for:")
    print("  - Breakfast")
    print("  - Lunch")
    print("  - Late Lunch")
    print("  - Dinner")
    print()
    
    try:
        # Scrape all dining courts (uses cache to optimize API calls)
        items = scrape_all_dining_courts(use_cache=True)
        
        print()
        print(f"Total items scraped: {len(items)}")
        
        if not items:
            print("WARNING: No items were scraped. Check your internet connection or API status.")
            return 1
        
        # Display breakdown by meal time
        meal_counts = {}
        for item in items:
            meal = item.get('meal_period', 'Unknown')
            meal_counts[meal] = meal_counts.get(meal, 0) + 1
        
        print()
        print("Breakdown by meal time:")
        for meal, count in sorted(meal_counts.items()):
            print(f"  {meal}: {count} items")
        
        print()
        print("Saving to database...")
        save_to_database(items, database_url)
        
        print()
        print("=" * 60)
        print("Auto-update completed successfully!")
        print(f"Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        return 0
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"ERROR: Auto-update failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
