
import sys
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging to show up in stdout
logging.basicConfig(level=logging.INFO)

# Add parent directory to path to find scraper module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scraper')))

from scraper.menu_scraper import scrape_and_save

if __name__ == "__main__":
    print("Starting scrape...", flush=True)
    try:
        # Scrape for today only to be quick and verify it works
        items = scrape_and_save(days_ahead=1, use_cache=False)
        print(f"Successfully scraped and saved {len(items)} items.", flush=True)
    except Exception as e:
        print(f"Scrape failed: {e}")
        import traceback
        traceback.print_exc()
