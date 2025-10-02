# Test script to verify scraper integration
# This tests that the scraper can fetch data from Purdue's API

import sys
import os

# Add scraper directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scraper'))

from menu_scraper import scrape_purdue_menu, DINING_COURTS

def test_scraper():
    """Test that we can fetch menu data from Purdue's API"""
    print("Testing Purdue Menu Scraper")
    print("=" * 50)
    print()
    
    # Test one dining court
    test_court = 'earhart'
    test_meal = 'lunch'
    
    print(f"Fetching menu for {test_court} - {test_meal}...")
    items = scrape_purdue_menu(test_court, test_meal)
    
    if not items:
        print("❌ No items found - API may be unavailable or menu is empty")
        return False
    
    print(f"✅ Successfully fetched {len(items)} items")
    print()
    print("Sample items:")
    for item in items[:5]:
        print(f"  - {item['name']}: {item['calories']} cal")
        print(f"    P: {item['protein']}g, C: {item['carbs']}g, F: {item['fats']}g")
        if item.get('station'):
            print(f"    Station: {item['station']}")
    
    print()
    print("✅ Scraper is working correctly!")
    return True

if __name__ == "__main__":
    try:
        success = test_scraper()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
