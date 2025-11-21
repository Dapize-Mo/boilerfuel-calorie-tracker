"""Verification script to compare Purdue Dining API data with local database contents.

Usage (PowerShell):
  $env:DATABASE_URL = 'postgresql://user:pass@host:port/db'
  python verify_menus.py --date 2025-11-21 --format table

What it checks:
  - For each dining court/location code we scrape (see DINING_COURTS below)
  - Fetches official API menu for a given date (default today)
  - Normalizes meal names (breakfast/lunch/late lunch/dinner)
  - Builds sets of items per meal period and station from API
  - Queries local `foods` table for rows matching dining_court code
  - Compares coverage: which API items are missing, which DB items are stale
  - Summarizes counts and coverage percentages

Exit code: 0 always (report only). Non‑fatal network/database errors noted in output.
"""

from __future__ import annotations
import os, json, sys, argparse, datetime, re
from typing import Dict, List, Tuple, Set

import requests
import psycopg2

from scraper.dining_locations import DINING_LOCATIONS

CODE_BY_UPPER = {loc['code'].upper(): loc for loc in DINING_LOCATIONS}
NAME_BY_LOWER = {loc['display_name'].lower(): loc for loc in DINING_LOCATIONS}

MEAL_NORMALIZATION = {
    'breakfast': 'breakfast',
    'lunch': 'lunch',
    'dinner': 'dinner',
    'late lunch': 'late lunch',
    'latelunch': 'late lunch',
    'late-lunch': 'late lunch',
}

def normalize_meal(name: str) -> str:
    key = name.strip().lower().replace('_', ' ')
    return MEAL_NORMALIZATION.get(key, name.strip())

def resolve_location(identifier: str):
    if not identifier:
        return None
    ident = identifier.strip()
    loc = CODE_BY_UPPER.get(ident.upper())
    if loc:
        return loc
    loc = NAME_BY_LOWER.get(ident.lower())
    if loc:
        return loc
    return None

def normalize_court_value(value: str) -> str:
    loc = resolve_location(value)
    if loc:
        return loc['display_name']
    return value.strip() if value else 'Unknown'

def fetch_menu(location_code: str, date_str: str) -> dict:
    url = f"https://api.hfs.purdue.edu/menus/v2/locations/{location_code}/{date_str}"
    try:
        r = requests.get(url, timeout=15, headers={'User-Agent': 'BoilerFuelVerifier/1.0'})
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {'error': str(e), 'url': url}

def menu_is_closed(menu_json: dict) -> Tuple[bool, str]:
    """Determine if the court should be considered closed/unpublished for the date."""
    if not menu_json:
        return False, ''
    if menu_json.get('IsOpen') is False:
        return True, 'API reports IsOpen = false'
    if menu_json.get('IsPublished') is False:
        return True, 'API reports IsPublished = false'

    meals = menu_json.get('Meals') or []
    if not meals:
        return True, 'API returned no Meals entries'

    total_items = 0
    for meal in meals:
        stations = meal.get('Stations') or []
        for station in stations:
            total_items += len(station.get('Items') or [])

    if total_items == 0:
        return True, 'API published meals but no stations/items'

    return False, ''

def extract_api_items(menu_json: dict) -> List[dict]:
    items: List[dict] = []
    if not menu_json or 'Meals' not in menu_json:
        return items
    for meal in menu_json.get('Meals', []):
        meal_name = normalize_meal(meal.get('Name', 'Unknown'))
        for station in meal.get('Stations', []):
            station_name = station.get('Name', 'Unknown').strip() or 'Unknown'
            for item in station.get('Items', []):
                name = (item.get('Name') or '').strip()
                if not name:
                    continue
                items.append({
                    'name': name,
                    'meal_time': meal_name,
                    'station': station_name,
                })
    return items

def get_db_connection(database_url: str):
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    return psycopg2.connect(database_url)

def load_db_foods(conn) -> List[dict]:
    cur = conn.cursor()
    cur.execute("""
        SELECT name, dining_court, station, meal_time
        FROM foods
    """)
    rows = cur.fetchall()
    cur.close()
    return [
        {
            'name': r[0],
            'dining_court': r[1],
            'station': r[2] or 'Unknown',
            'meal_time': r[3] or 'Unknown',
        }
        for r in rows
    ]

def build_index(items: List[dict]) -> Dict[str, Dict[str, Dict[str, Set[str]]]]:
    # Structure: court_code -> meal_time -> station -> set(item_names)
    idx: Dict[str, Dict[str, Dict[str, Set[str]]]] = {}
    for it in items:
        court = normalize_court_value(it.get('dining_court'))
        meal = normalize_meal(it.get('meal_time', 'Unknown'))
        station = (it.get('station') or 'Unknown').strip() or 'Unknown'
        name = it.get('name')
        if not (court and name):
            continue
        idx.setdefault(court, {}).setdefault(meal, {}).setdefault(station, set()).add(name)
    return idx

def build_api_index(location_code: str, api_items: List[dict]) -> Dict[str, Dict[str, Set[str]]]:
    # meal_time -> station -> set(names)
    idx: Dict[str, Dict[str, Set[str]]] = {}
    for it in api_items:
        meal = normalize_meal(it['meal_time'])
        station = (it['station'] or 'Unknown').strip() or 'Unknown'
        name = it['name']
        idx.setdefault(meal, {}).setdefault(station, set()).add(name)
    return idx

def compare(api_idx: Dict[str, Dict[str, Set[str]]], db_idx: Dict[str, Dict[str, Dict[str, Set[str]]]],
            court_code: str, display_name: str) -> Dict:
    result = {
        'court_code': court_code,
        'display_name': display_name,
        'meals': {},
        'api_total_items': 0,
        'db_total_items_for_court': 0,
        'coverage_percent': 0.0,
    }
    db_court = db_idx.get(display_name, {})

    api_total = 0
    matched_total = 0
    for meal, stations in api_idx.items():
        meal_report = {'stations': {}, 'api_meal_items': 0, 'db_meal_items': 0}
        for station, api_items in stations.items():
            api_total += len(api_items)
            db_items = db_court.get(meal, {}).get(station, set())
            matched = api_items & db_items
            missing = api_items - db_items
            stale = db_items - api_items  # items in DB but not present today
            meal_report['stations'][station] = {
                'api_count': len(api_items),
                'db_count': len(db_items),
                'matched': sorted(matched),
                'missing': sorted(missing),
                'stale': sorted(stale),
                'coverage_percent': (len(matched) / len(api_items) * 100.0) if api_items else 0.0,
            }
            meal_report['api_meal_items'] += len(api_items)
            meal_report['db_meal_items'] += len(db_items)
            matched_total += len(matched)
        result['meals'][meal] = meal_report

    result['api_total_items'] = api_total
    result['db_total_items_for_court'] = sum(len(items) for meal in db_court.values() for items in meal.values())
    result['coverage_percent'] = (matched_total / api_total * 100.0) if api_total else 0.0
    return result

def format_table(report: Dict) -> str:
    lines = []
    for loc in DINING_LOCATIONS:
        court_code = loc['code']
        court_name = loc['display_name']
        court_data = report['courts'].get(court_code)
        if not court_data:
            lines.append(f"\n{court_name} ({court_code}): No API data or DB items")
            continue
        if 'error' in court_data:
            lines.append(f"\n{court_name} ({court_code}) ERROR fetching API: {court_data['error']}")
            continue
        if court_data.get('status') == 'closed':
            reason = court_data.get('reason', 'API reported location closed')
            lines.append(f"\n{court_name} ({court_code}) CLOSED: {reason}")
            continue
        lines.append(f"\n{court_name} ({court_code}) Coverage: {court_data['coverage_percent']:.1f}% API Items: {court_data['api_total_items']} DB Items (all meals): {court_data['db_total_items_for_court']}")
        for meal, meal_info in court_data['meals'].items():
            lines.append(f"  Meal: {meal} (API {meal_info['api_meal_items']} / DB {meal_info['db_meal_items']})")
            for station, st_info in meal_info['stations'].items():
                cov = st_info['coverage_percent']
                lines.append(f"    Station: {station} API {st_info['api_count']} DB {st_info['db_count']} Cov {cov:.1f}% Missing {len(st_info['missing'])} Stale {len(st_info['stale'])}")
                if st_info['missing']:
                    lines.append(f"      Missing: {', '.join(st_info['missing'][:8])}{' ...' if len(st_info['missing'])>8 else ''}")
                if st_info['stale']:
                    lines.append(f"      Stale: {', '.join(st_info['stale'][:8])}{' ...' if len(st_info['stale'])>8 else ''}")
    return '\n'.join(lines)

def main():
    parser = argparse.ArgumentParser(description='Verify local DB menu coverage against Purdue Dining API')
    parser.add_argument('--date', help='Date YYYY-MM-DD (default today)')
    parser.add_argument('--format', choices=['json','table'], default='table')
    parser.add_argument('--courts', nargs='*', help='Optional subset of human-friendly court names (e.g. Ford Wiley)')
    args = parser.parse_args()

    date_obj = datetime.date.today() if not args.date else datetime.datetime.strptime(args.date, '%Y-%m-%d').date()
    date_str = date_obj.strftime('%Y-%m-%d')

    subset_codes = None
    if args.courts:
        subset_codes = set()
        for identifier in args.courts:
            loc = resolve_location(identifier)
            if loc:
                subset_codes.add(loc['code'])

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print('WARNING: DATABASE_URL not set; DB comparison skipped.')
        db_foods = []
        conn = None
    else:
        try:
            conn = get_db_connection(database_url)
            db_foods = load_db_foods(conn)
        except Exception as e:
            print(f'WARNING: Could not load DB foods: {e}')
            db_foods = []
            conn = None

    db_index = build_index(db_foods) if db_foods else {}

    report = {
        'date': date_str,
        'courts': {},
    }

    for loc in DINING_LOCATIONS:
        code = loc['code']
        display_name = loc['display_name']
        api_name = loc['api_name']
        if subset_codes and code not in subset_codes:
            continue
        menu_json = fetch_menu(api_name, date_str)
        if 'error' in menu_json:
            report['courts'][code] = {'error': menu_json['error'], 'display_name': display_name}
            continue
        closed, reason = menu_is_closed(menu_json)
        if closed:
            report['courts'][code] = {
                'status': 'closed',
                'display_name': display_name,
                'reason': reason or 'API returned no menu items',
            }
            continue
        api_items = extract_api_items(menu_json)
        api_idx = build_api_index(code, api_items)
        court_report = compare(api_idx, db_index, code, display_name)
        report['courts'][code] = court_report

    if args.format == 'json':
        print(json.dumps(report, indent=2))
    else:
        print(f"Verification Date: {report['date']}")
        print(format_table(report))

    if conn:
        conn.close()

if __name__ == '__main__':
    main()
