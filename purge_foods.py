"""Utility to purge stale foods from the database based on next_available schedule."""

import argparse
import datetime as dt
import json
import os
import psycopg2


def parse_args():
    parser = argparse.ArgumentParser(description="Purge stale foods that have no upcoming availability")
    parser.add_argument("--before-date", dest="before_date", help="ISO date (YYYY-MM-DD). Foods whose next_available entries are all before this date are deleted.", default=dt.date.today().isoformat())
    parser.add_argument("--database-url", dest="database_url", help="Override DATABASE_URL env")
    parser.add_argument("--force", action="store_true", help="Actually delete rows (default dry-run)")
    return parser.parse_args()


def should_keep(schedule, cutoff):
    if not schedule:
        return False
    try:
        for entry in schedule:
            date_str = entry.get("date")
            if not date_str:
                continue
            try:
                entry_date = dt.datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                continue
            if entry_date >= cutoff:
                return True
    except Exception:
        return False
    return False


def main():
    args = parse_args()
    cutoff = dt.datetime.strptime(args.before_date, "%Y-%m-%d").date()
    database_url = args.database_url or os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL must be set or passed via --database-url")
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    cur.execute("SELECT id, name, dining_court, next_available FROM foods")
    rows = cur.fetchall()

    to_delete = []
    for row in rows:
        _id, name, court, schedule_json = row
        schedule = None
        if isinstance(schedule_json, str):
            try:
                schedule = json.loads(schedule_json)
            except json.JSONDecodeError:
                schedule = None
        else:
            schedule = schedule_json
        if not should_keep(schedule, cutoff):
            to_delete.append((_id, name, court))

    print(f"Found {len(to_delete)} stale foods out of {len(rows)} total (cutoff {cutoff})")
    if not to_delete:
        return
    for _id, name, court in to_delete[:20]:
        print(f"  - {name} ({court})")
    if len(to_delete) > 20:
        print(f"  ... and {len(to_delete)-20} more")

    if args.force:
        cur.executemany("DELETE FROM foods WHERE id = %s", [(_id,) for _id, *_ in to_delete])
        conn.commit()
        print(f"Deleted {len(to_delete)} rows")
    else:
        print("Dry run only (use --force to delete)")

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
