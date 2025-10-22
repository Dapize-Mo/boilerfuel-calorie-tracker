"""
Delete placeholder/test food items from the database
"""
import os
import psycopg2

def delete_placeholder_foods():
    """Delete test foods that don't have a dining_court"""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("ERROR: DATABASE_URL not set")
        print("\nSet it first:")
        print('$env:DATABASE_URL = "your_railway_postgres_url"')
        return
    
    # Convert postgres:// to postgresql://
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Option 1: Delete foods without a dining_court (these are placeholders)
        cursor.execute("SELECT COUNT(*) FROM foods WHERE dining_court IS NULL")
        count_null = cursor.fetchone()[0]
        
        print(f"\nFound {count_null} items without dining_court (likely placeholders)")
        
        if count_null > 0:
            confirm = input("Delete these items? (yes/no): ")
            if confirm.lower() == 'yes':
                cursor.execute("DELETE FROM foods WHERE dining_court IS NULL")
                conn.commit()
                print(f"✓ Deleted {count_null} placeholder items")
        
        # Option 2: Show items with dining_court (real scraped data)
        cursor.execute("SELECT COUNT(*) FROM foods WHERE dining_court IS NOT NULL")
        count_real = cursor.fetchone()[0]
        print(f"\n{count_real} items with dining_court (real Purdue menu items)")
        
        # Option 3: Show a sample of remaining items
        cursor.execute("SELECT name, calories, dining_court FROM foods LIMIT 5")
        print("\nSample of remaining items:")
        for row in cursor.fetchall():
            name, calories, dining_court = row
            print(f"  - {name} ({calories} cal) from {dining_court}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("DELETE PLACEHOLDER FOODS")
    print("=" * 60)
    delete_placeholder_foods()
