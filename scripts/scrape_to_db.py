import os
import sys

# Ensure scraper module is importable
repo_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, repo_root)

from scraper.menu_scraper import scrape_all_dining_courts, save_to_database

if __name__ == '__main__':
    print('Running scheduled scrape...')
    # Allow overriding days ahead via env var (default 7)
    try:
        days_ahead = int(os.getenv('SCRAPE_DAYS', '7'))
    except ValueError:
        days_ahead = 7
    items = scrape_all_dining_courts(use_cache=True, days_ahead=days_ahead)
    print(f'Total items scraped: {len(items)}')
    if not os.getenv('DATABASE_URL'):
        raise SystemExit('Missing DATABASE_URL secret in GitHub Actions.')
    if items:
        save_to_database(items)
        print('Done.')
        # Post-save verification: print a quick count for observability in CI logs
        try:
            import psycopg2
            conn = psycopg2.connect(os.getenv('DATABASE_URL'))
            cur = conn.cursor()
            cur.execute('SELECT COUNT(*) FROM foods WHERE next_available IS NOT NULL')
            count = cur.fetchone()[0]
            cur.close(); conn.close()
            print(f"Post-save verification: {count} foods have next_available populated.")
        except Exception as e:
            print(f"Post-save verification skipped: {e}")
    else:
        print('No items found.')
