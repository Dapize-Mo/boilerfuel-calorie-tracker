import os
import sys

# Ensure scraper module is importable
repo_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, repo_root)

from scraper.menu_scraper import scrape_all_dining_courts, save_to_database

if __name__ == '__main__':
    print('Running scheduled scrape...')
    items = scrape_all_dining_courts(use_cache=True)
    print(f'Total items scraped: {len(items)}')
    if not os.getenv('DATABASE_URL'):
        raise SystemExit('Missing DATABASE_URL secret in GitHub Actions.')
    if items:
        save_to_database(items)
        print('Done.')
    else:
        print('No items found.')
