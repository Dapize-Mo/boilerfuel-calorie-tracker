import os
import sys
from datetime import datetime, timedelta
import psycopg2

# Ensure scraper module is importable
repo_root = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, repo_root)

from scraper.menu_scraper import scrape_all_dining_courts_with_snapshots, save_menu_snapshots, save_to_database


def parse_bytes_env(name):
    value = os.getenv(name)
    if not value:
        return None
    try:
        n = int(value)
        return n if n > 0 else None
    except ValueError:
        return None


def strict_capacity_mode():
    raw = (os.getenv('DB_CAPACITY_STRICT', 'true') or '').strip().lower()
    return raw not in ('0', 'false', 'no', 'off')


def get_database_url_or_exit():
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise SystemExit('Missing DATABASE_URL secret in GitHub Actions.')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    return database_url


def check_db_capacity_guard(database_url, stage):
    max_bytes = (
        parse_bytes_env('DB_CAPACITY_BYTES')
        or parse_bytes_env('DATABASE_CAPACITY_BYTES')
        or parse_bytes_env('POSTGRES_MAX_BYTES')
    )
    threshold_raw = os.getenv('DB_PAUSE_THRESHOLD_PERCENT', '95')
    try:
        threshold_percent = float(threshold_raw)
    except ValueError:
        threshold_percent = 95.0
    if threshold_percent <= 0 or threshold_percent > 100:
        threshold_percent = 95.0

    if max_bytes is None:
        if strict_capacity_mode():
            raise SystemExit(
                'DB capacity guard is strict and no capacity limit is configured. '
                'Set DB_CAPACITY_BYTES (or DATABASE_CAPACITY_BYTES/POSTGRES_MAX_BYTES).'
            )
        print('[db-guard] Capacity limit not configured; guard is running in non-strict mode.')
        return

    conn = psycopg2.connect(database_url)
    try:
        cur = conn.cursor()
        cur.execute('SELECT pg_database_size(current_database())')
        used_bytes = int(cur.fetchone()[0])
        cur.close()
    finally:
        conn.close()

    used_percent = (used_bytes / max_bytes) * 100.0
    print(f"[db-guard] {stage}: using {used_percent:.2f}% ({used_bytes}/{max_bytes} bytes), threshold={threshold_percent:.2f}%")
    if used_percent >= threshold_percent:
        raise SystemExit(
            f"DB capacity guard triggered at {used_percent:.2f}% (threshold {threshold_percent:.2f}%). Scraping paused."
        )

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

    database_url = get_database_url_or_exit()
    check_db_capacity_guard(database_url, 'before scrape')

    start_date = (datetime.now() - timedelta(days=back_days)).strftime('%Y-%m-%d')
    total_days = back_days + forward_days + 1

    items, snapshots = scrape_all_dining_courts_with_snapshots(
        use_cache=True,
        date=start_date,
        days_ahead=total_days,
        schedule_start_date=datetime.now().strftime('%Y-%m-%d')
    )
    print(f'Total items scraped: {len(items)}')

    if items:
        check_db_capacity_guard(database_url, 'before database write')
        save_to_database(items)
        if snapshots:
            save_menu_snapshots(snapshots)
        print('Done.')
        # Post-save verification: print a quick count for observability in CI logs
        try:
            conn = psycopg2.connect(database_url)
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
