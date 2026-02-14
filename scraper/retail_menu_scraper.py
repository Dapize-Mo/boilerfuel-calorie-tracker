"""
Retail Menu Scraper - Automated updates for Food Co locations

This script updates menu data for Purdue Food Co retail locations:
1. Chain restaurants: Re-scrapes from chain_scrapers modules
2. PDF-based menus: Extracts and parses PDF menus from CampusDish
3. Updates database with latest menu information

Usage:
    python retail_menu_scraper.py [--chains-only] [--pdfs-only] [--location LOCATION_ID]
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import argparse
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values

# Import chain scrapers
from chain_scrapers import (
    get_panera_items,
    get_qdoba_items,
    get_jersey_mikes_items,
    get_starbucks_items
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_db_connection():
    """Get database connection from environment variables."""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(db_url)


def clear_location_menu(cursor, dining_court):
    """Clear existing menu data for a specific location."""
    cursor.execute(
        "DELETE FROM menu_snapshots WHERE dining_court = %s AND source = 'retail'",
        (dining_court,)
    )
    deleted = cursor.rowcount
    logger.info(f"Cleared {deleted} existing items for {dining_court}")


def insert_menu_items(cursor, items, dining_court):
    """Insert menu items into database."""
    menu_data = []
    for item in items:
        menu_data.append((
            '2099-01-01',  # Sentinel date for retail menus
            item['name'],
            item['calories'],
            psycopg2.extras.Json({
                'protein': item['protein'],
                'carbs': item['carbs'],
                'fats': item['fats']
            }),
            dining_court,
            item['station'],
            item['meal_time'],
            'retail'
        ))
    
    execute_values(
        cursor,
        """
        INSERT INTO menu_snapshots 
        (menu_date, name, calories, macros, dining_court, station, meal_time, source)
        VALUES %s
        """,
        menu_data,
        template="(%s, %s, %s, %s, %s, %s, %s, %s)"
    )
    logger.info(f"Inserted {len(menu_data)} items for {dining_court}")


def update_chain_restaurants(conn):
    """Update menu data for chain restaurants."""
    logger.info("Updating chain restaurant menus...")
    
    chains = [
        ("Panera", get_panera_items),
        ("Qdoba", get_qdoba_items),
        ("Jersey Mike's", get_jersey_mikes_items),
        ("Starbucks @ MSEE", get_starbucks_items),
        ("Starbucks @ Winifred Parker Hall", get_starbucks_items),
    ]
    
    cursor = conn.cursor()
    
    for dining_court, scraper_func in chains:
        try:
            logger.info(f"Processing {dining_court}...")
            items = scraper_func()
            
            clear_location_menu(cursor, dining_court)
            insert_menu_items(cursor, items, dining_court)
            
            conn.commit()
            logger.info(f"✓ Successfully updated {dining_court}")
        
        except Exception as e:
            logger.error(f"✗ Failed to update {dining_court}: {e}")
            conn.rollback()
    
    cursor.close()


def update_pdf_menus(conn):
    """Update menus from PDF sources (placeholder for future implementation)."""
    logger.info("PDF menu updates not yet implemented")
    logger.info("To implement: Extract PDFs → Parse text → Insert data")
    logger.info("See: scraper/extract_menus.py and scraper/parse_walk_ons.py")


def main():
    parser = argparse.ArgumentParser(description='Update retail menu data')
    parser.add_argument('--chains-only', action='store_true', help='Only update chain restaurants')
    parser.add_argument('--pdfs-only', action='store_true', help='Only update PDF-based menus')
    parser.add_argument('--location', help='Update specific location only')
    
    args = parser.parse_args()
    
    try:
        conn = get_db_connection()
        logger.info("Connected to database")
        
        if args.pdfs_only:
            update_pdf_menus(conn)
        elif args.chains_only or not args.pdfs_only:
            update_chain_restaurants(conn)
        
        conn.close()
        logger.info("Retail menu update completed successfully")
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
