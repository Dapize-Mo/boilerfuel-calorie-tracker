"""
Scraper for Purdue Food Co (CampusDish) retail dining locations.

Fetches location metadata (name, address, hours, open status) from the
CampusDish API at purdue.campusdish.com.  These retail locations don't
expose per-item nutrition data through public APIs, so only location
info is persisted.
"""

import requests
import re
import json
import os
import psycopg2

CAMPUSDISH_BASE = "https://purdue.campusdish.com"
LOCATIONS_ENDPOINT = "/api/locations/GetLocations"


# ── Which locations are top-level retail (not sub-locations inside Atlas) ──
# Sub-location IDs belong to the Atlas Family Marketplace food court.
ATLAS_SUB_IDS = {
    "47988", "89899", "37757", "47986", "37761",
    "15092", "92017", "15091", "15088", "15087", "15089",
}


def fetch_retail_locations():
    """
    Fetch all Purdue Food Co retail locations from CampusDish.

    Returns:
        list of dicts with keys: id, name, url, address, city_state_zip,
        hours, is_open, is_food_court, child_locations, description
    """
    session = requests.Session()
    session.verify = False
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html, */*",
    })

    r = session.get(CAMPUSDISH_BASE + LOCATIONS_ENDPOINT, timeout=15)
    r.raise_for_status()

    # The response is HTML with an embedded JS variable containing JSON
    match = re.search(r"model:\s*(\{.*\})", r.text, re.DOTALL)
    if not match:
        raise RuntimeError("Could not parse location JSON from CampusDish response")

    raw = match.group(1)
    brace_count = 0
    end_idx = 0
    for i, c in enumerate(raw):
        if c == "{":
            brace_count += 1
        elif c == "}":
            brace_count -= 1
        if brace_count == 0:
            end_idx = i + 1
            break

    data = json.loads(raw[:end_idx])
    raw_locations = data.get("Locations", [])

    locations = []
    for loc in raw_locations:
        loc_id = str(loc.get("Id", ""))
        # Skip sub-locations inside Atlas Family Marketplace
        if loc_id in ATLAS_SUB_IDS:
            continue

        name = loc.get("DisplayName", "").strip()
        url_path = loc.get("LocationUrl", "")
        address = loc.get("Address", "")
        global_addr = loc.get("GlobalAddress", "")
        hours = loc.get("HoursOfOperations") or ""
        is_open = loc.get("IsOpenNow", False)
        is_food_court = loc.get("IsFoodCourt", False)
        child_names = loc.get("ChildLocationsNames") or []

        locations.append({
            "id": loc_id,
            "name": name,
            "url": url_path,
            "address": address,
            "city_state_zip": global_addr,
            "hours": hours,
            "is_open": is_open,
            "is_food_court": is_food_court,
            "child_locations": child_names,
        })

    return locations


def save_retail_locations(locations, database_url=None):
    """
    Save retail location metadata into the retail_locations table.
    Creates the table if it doesn't exist.
    """
    if not database_url:
        database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL not set")

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)

    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()

    # Ensure table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS retail_locations (
            id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            url VARCHAR(512),
            address VARCHAR(255),
            city_state_zip VARCHAR(255),
            hours VARCHAR(255),
            is_open BOOLEAN DEFAULT FALSE,
            is_food_court BOOLEAN DEFAULT FALSE,
            child_locations JSONB,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    upserted = 0
    for loc in locations:
        cursor.execute("""
            INSERT INTO retail_locations (id, name, url, address, city_state_zip, hours, is_open, is_food_court, child_locations, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                url = EXCLUDED.url,
                address = EXCLUDED.address,
                city_state_zip = EXCLUDED.city_state_zip,
                hours = EXCLUDED.hours,
                is_open = EXCLUDED.is_open,
                is_food_court = EXCLUDED.is_food_court,
                child_locations = EXCLUDED.child_locations,
                updated_at = CURRENT_TIMESTAMP
        """, (
            loc["id"], loc["name"], loc["url"], loc["address"],
            loc["city_state_zip"], loc["hours"], loc["is_open"],
            loc["is_food_court"], json.dumps(loc["child_locations"]),
        ))
        upserted += 1

    conn.commit()
    cursor.close()
    conn.close()
    print(f"Saved {upserted} retail locations to database")
    return upserted


def main():
    """CLI entry point."""
    from dotenv import load_dotenv
    load_dotenv()

    import warnings
    warnings.filterwarnings("ignore")

    print("Fetching Purdue Food Co retail locations from CampusDish...")
    locations = fetch_retail_locations()
    print(f"Found {len(locations)} retail locations:")
    for loc in locations:
        status = "OPEN" if loc["is_open"] else "CLOSED"
        print(f"  [{status:6s}] {loc['name']}")
        if loc["hours"]:
            print(f"           Hours: {loc['hours']}")

    print("\nSaving to database...")
    count = save_retail_locations(locations)
    print(f"Done! {count} locations saved.")


if __name__ == "__main__":
    main()
