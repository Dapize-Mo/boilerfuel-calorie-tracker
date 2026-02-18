"""Generate SQL INSERT statements from chain restaurant scrapers."""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from chain_scrapers import (
    get_panera_items,
    get_qdoba_items,
    get_jersey_mikes_items,
    get_starbucks_items,
    get_dining_court_beverage_items,
    DINING_COURTS,
)


def generate_sql_insert(item, dining_court):
    """Generate a single SQL INSERT statement for a menu item."""
    name = item['name'].replace("'", "''")  # Escape single quotes
    calories = item['calories']
    protein = item['protein']
    carbs = item['carbs']
    fats = item['fats']
    station = item['station']
    meal_time = item['meal_time']

    macros = f'{{"protein":{protein},"carbs":{carbs},"fats":{fats}}}'

    return (f"('2099-01-01', '{name}', {calories}, '{macros}', "
            f"'{dining_court}', '{station}', '{meal_time}', 'retail')")


def generate_beverage_sql_insert(item, dining_court):
    """Generate a SQL INSERT with full nutrition macros for a beverage."""
    name = item['name'].replace("'", "''")
    calories = item['calories']
    station = item['station']
    meal_time = item['meal_time']

    macros = json.dumps({
        "protein": item["protein"],
        "carbs": item["carbs"],
        "fats": item["fats"],
        "saturated_fat": item.get("saturated_fat", 0),
        "cholesterol": item.get("cholesterol", 0),
        "sodium": item.get("sodium", 0),
        "fiber": item.get("fiber", 0),
        "sugar": item.get("sugar", 0),
        "added_sugar": item.get("added_sugar", 0),
        "is_vegetarian": item.get("is_vegetarian", False),
        "is_vegan": item.get("is_vegan", False),
        "allergens": item.get("allergens", []),
        "ingredients": item.get("ingredients", ""),
        "serving_size": item.get("serving_size", "16 oz"),
    }, ensure_ascii=False).replace("'", "''")

    return (f"('2099-01-01', '{name}', {calories}, '{macros}', "
            f"'{dining_court}', '{station}', '{meal_time}', 'retail')")


def generate_chain_sql():
    """Generate SQL for all chain restaurants."""
    
    # Panera
    print("-- ============================================================================")
    print("-- PANERA BREAD")
    print("-- Source: Panera nutrition data (panerabread.com)")
    print("-- ============================================================================\n")
    
    panera_items = get_panera_items()
    print("INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES")
    sql_lines = [generate_sql_insert(item, 'Panera') for item in panera_items]
    print(",\n".join(sql_lines) + ";\n")
    
    # Qdoba
    print("-- ============================================================================")
    print("-- QDOBA MEXICAN EATS")
    print("-- Source: Qdoba nutrition calculator (qdoba.com/nutrition)")
    print("-- ============================================================================\n")
    
    qdoba_items = get_qdoba_items()
    print("INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES")
    sql_lines = [generate_sql_insert(item, 'Qdoba') for item in qdoba_items]
    print(",\n".join(sql_lines) + ";\n")
    
    # Jersey Mike's
    print("-- ============================================================================")
    print("-- JERSEY MIKE'S SUBS")
    print("-- Source: Jersey Mike's nutrition guide (jerseymikes.com/menu/nutrition)")
    print("-- ============================================================================\n")
    
    jersey_items = get_jersey_mikes_items()
    print("INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES")
    sql_lines = [generate_sql_insert(item, "Jersey Mike's") for item in jersey_items]
    print(",\n".join(sql_lines) + ";\n")
    
    # Starbucks (both locations)
    print("-- ============================================================================")
    print("-- STARBUCKS @ MSEE")
    print("-- Source: Starbucks nutrition data (starbucks.com/menu)")
    print("-- ============================================================================\n")
    
    starbucks_items = get_starbucks_items()
    print("INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES")
    sql_lines = [generate_sql_insert(item, 'Starbucks @ MSEE') for item in starbucks_items]
    print(",\n".join(sql_lines) + ";\n")
    
    print("-- ============================================================================")
    print("-- STARBUCKS @ WINIFRED PARKER HALL")
    print("-- Source: Starbucks nutrition data (starbucks.com/menu)")
    print("-- Same menu as MSEE location")
    print("-- ============================================================================\n")
    
    print("INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES")
    sql_lines = [generate_sql_insert(item, 'Starbucks @ Winifred Parker Hall') for item in starbucks_items]
    print(",\n".join(sql_lines) + ";\n")

    # Dining Court Beverages (all five courts)
    beverage_items = get_dining_court_beverage_items()
    for court in DINING_COURTS:
        print("-- ============================================================================")
        print(f"-- {court.upper()} DINING COURT - BEVERAGES")
        print("-- Source: Prairie Farms (milk), Coca-Cola (fountain drinks)")
        print("-- Cup size: 16 oz standard dining hall cup")
        print("-- ============================================================================\n")

        print("INSERT INTO menu_snapshots (menu_date, name, calories, macros, dining_court, station, meal_time, source) VALUES")
        sql_lines = [generate_beverage_sql_insert(item, court) for item in beverage_items]
        print(",\n".join(sql_lines) + ";\n")


if __name__ == "__main__":
    generate_chain_sql()
