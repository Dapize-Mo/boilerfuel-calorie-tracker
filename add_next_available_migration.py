#!/usr/bin/env python3
"""
Migration script to add next_available column to foods table.
This column stores an array of upcoming meal availability for forecasting.

Usage:
    python add_next_available_migration.py
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def run_migration():
    """Run the migration to add next_available column."""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set")
        print("\nPlease set your DATABASE_URL:")
        print("  Windows PowerShell:")
        print("    $env:DATABASE_URL = 'postgresql://user:password@host:port/database'")
        print("  Linux/Mac:")
        print("    export DATABASE_URL='postgresql://user:password@host:port/database'")
        return 1
    
    # Convert postgres:// to postgresql:// if needed
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    print(f"Connecting to database...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("Running migration...")
        
        # Add next_available column
        cursor.execute("""
            ALTER TABLE foods ADD COLUMN IF NOT EXISTS next_available JSONB;
        """)
        print("✓ Added next_available column")
        
        # Add updated_at column if it doesn't exist
        cursor.execute("""
            ALTER TABLE foods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        """)
        print("✓ Added updated_at column")
        
        # Create GIN index for JSONB queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_foods_next_available 
            ON foods USING GIN (next_available);
        """)
        print("✓ Created index on next_available")
        
        # Add column comment
        cursor.execute("""
            COMMENT ON COLUMN foods.next_available IS 
            'Array of upcoming availability: [{date: "YYYY-MM-DD", day_name: "Monday", meal_time: "breakfast"}]';
        """)
        print("✓ Added column comment")
        
        # Commit changes
        conn.commit()
        
        # Verify column exists
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'foods' AND column_name IN ('next_available', 'updated_at');
        """)
        
        columns = cursor.fetchall()
        print(f"\n✓ Migration completed successfully!")
        print(f"  Verified columns: {columns}")
        
        cursor.close()
        conn.close()
        
        print("\nNext steps:")
        print("1. Run the scraper to populate next_available data:")
        print("   python scraper/menu_scraper.py --days 7")
        print("2. Check the API endpoint to see the forecast data:")
        print("   GET /api/foods?dining_court=Wiley")
        
        return 0
        
    except psycopg2.Error as e:
        print(f"\nERROR: Database error occurred:")
        print(f"  {e}")
        if 'conn' in locals():
            conn.rollback()
        return 1
    except Exception as e:
        print(f"\nERROR: Unexpected error:")
        print(f"  {e}")
        return 1

if __name__ == '__main__':
    sys.exit(run_migration())
