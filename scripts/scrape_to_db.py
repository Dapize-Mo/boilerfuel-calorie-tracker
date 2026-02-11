import os
import sys
from datetime import datetime, timedelta

# Ensure scraper module is importable
repo_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, repo_root)

from scraper.menu_scraper import scrape_all_dining_courts_with_snapshots, save_menu_snapshots, save_to_database

if __name__ == '__main__':
    print('Running scheduled scrape...')
    # Allow overriding scrape window via env vars
    try:
        back_days = int(os.getenv('SCRAPE_BACK_DAYS', '7'))
    except ValueError:
        back_days = 7
    try:
        forward_days = int(os.getenv('SCRAPE_FORWARD_DAYS', os.getenv('SCRAPE_DAYS', '2')))
    except ValueError:
        forward_days = 7

    start_date = (datetime.now() - timedelta(days=back_days)).strftime('%Y-%m-%d')
    total_days = back_days + forward_days + 1

    items, snapshots = scrape_all_dining_courts_with_snapshots(
        use_cache=True,
        date=start_date,
        days_ahead=total_days,
        schedule_start_date=datetime.now().strftime('%Y-%m-%d')
    )
    print(f'Total items scraped: {len(items)}')
    if not os.getenv('DATABASE_URL'):
        raise SystemExit('Missing DATABASE_URL secret in GitHub Actions.')
    if items:
        save_to_database(items)
        if snapshots:
            save_menu_snapshots(snapshots)
        print('Done.')
        # Post-save verification: print a quick count for observability in CI logs
        try:
            import psycopg2
            conn = psycopg2.connect(os.getenv('DATABASE_URL'))
            cur = conn.cursor()
            cur.execute('SELECT COUNT(*) FROM foods WHERE next_available IS NOT NULL')
            count = cur.fetchone()[0]
            cur.execute('SELECT COUNT(*) FROM menu_snapshots')
            snapshot_count = cur.fetchone()[0]
            cur.close(); conn.close()
            print(f"Post-save verification: {count} foods have next_available populated.")
            print(f"Post-save verification: {snapshot_count} menu snapshots stored.")
        except Exception as e:
            print(f"Post-save verification skipped: {e}")
    else:
        print('No items found.')
