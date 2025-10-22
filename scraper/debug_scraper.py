"""Debug script to inspect the HTML structure of Purdue dining pages"""
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

def create_driver():
    """Create a headless Chrome WebDriver."""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def main():
    url = "https://dining.purdue.edu/menus/Wiley/2025/10/2/"
    
    driver = create_driver()
    
    try:
        print(f"Fetching: {url}")
        driver.get(url)
        
        # Wait for content to load
        time.sleep(5)
        
        # Get page source
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Save full HTML to file for inspection
        with open('debug_page.html', 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
        print("Saved full page HTML to debug_page.html")
        
        # Find ALL divs with classes
        all_divs = soup.find_all('div', class_=True)
        
        # Count unique class names
        class_names = {}
        for div in all_divs:
            classes = ' '.join(div.get('class', []))
            if classes:
                class_names[classes] = class_names.get(classes, 0) + 1
        
        print(f"\nFound {len(all_divs)} divs with classes")
        print("\nMost common class names:")
        sorted_classes = sorted(class_names.items(), key=lambda x: x[1], reverse=True)
        for cls, count in sorted_classes[:30]:
            print(f"  {count:4d}x  {cls}")
        
        # Try to find items with various patterns
        print("\n\nTrying different selectors:")
        
        patterns = [
            'menu-item',
            'item',
            'food-item',
            'dish',
            'menuItem'
        ]
        
        for pattern in patterns:
            items = soup.find_all(class_=pattern)
            print(f"  class='{pattern}': {len(items)} items")
        
        # Print first item found
        for pattern in patterns:
            items = soup.find_all(class_=pattern)
            if items:
                print(f"\n\nFirst item with class='{pattern}':")
                print(items[0].prettify()[:1500])
                break
    
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
