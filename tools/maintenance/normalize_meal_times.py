#!/usr/bin/env python3
"""
Normalize meal_time values in the foods table to lowercase.
This ensures consistency with API filters which expect lowercase values.
"""

import os
import sys
from sqlalchemy import text, create_engine

# Add parent directories to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def normalize_meal_times():
    """Normalize all meal_time values to lowercase"""
    
    db_url = os.getenv('POSTGRES_URL') or os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: POSTGRES_URL or DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Create database connection
    engine = create_engine(db_url)
    
    with engine.begin() as conn:
        # Get current unique meal times
        result = conn.execute(text("SELECT DISTINCT meal_time FROM foods WHERE meal_time IS NOT NULL"))
        current_meal_times = [row[0] for row in result]
        
        print("Current meal times in database:")
        for mt in sorted(current_meal_times):
            print(f"  - '{mt}'")
        
        # Normalize each unique meal time
        print("\nNormalizing meal times to lowercase...")
        for meal_time in current_meal_times:
            normalized = meal_time.lower()
            if meal_time != normalized:
                # Update all rows with this meal_time
                conn.execute(text(
                    "UPDATE foods SET meal_time = :normalized WHERE meal_time = :original"
                ), {"normalized": normalized, "original": meal_time})
                print(f"  '{meal_time}' -> '{normalized}'")
            else:
                print(f"  '{meal_time}' (already lowercase)")
        
        # Verify the changes
        print("\nVerifying normalized meal times:")
        result = conn.execute(text("SELECT DISTINCT meal_time FROM foods WHERE meal_time IS NOT NULL ORDER BY meal_time"))
        normalized_meal_times = [row[0] for row in result]
        for mt in normalized_meal_times:
            count = conn.execute(text("SELECT COUNT(*) FROM foods WHERE meal_time = :mt"), {"mt": mt}).scalar()
            print(f"  - '{mt}': {count} items")

if __name__ == '__main__':
    normalize_meal_times()
    print("\n✓ Meal times normalized successfully!")
