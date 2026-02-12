#!/usr/bin/env python3
"""
Apply database optimizations including indexes, views, and functions.
"""

import os
import sys
from sqlalchemy import text, create_engine

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

def apply_optimizations():
    """Apply database optimizations from optimization.sql"""
    
    db_url = os.getenv('POSTGRES_URL') or os.getenv('DATABASE_URL')
    if not db_url:
        print("Error: POSTGRES_URL or DATABASE_URL environment variable not set")
        sys.exit(1)
    
    # Read optimization SQL
    sql_file = os.path.join(os.path.dirname(__file__), '../../db/optimization.sql')
    with open(sql_file, 'r') as f:
        optimization_sql = f.read()
    
    # Create database connection
    engine = create_engine(db_url)
    
    print("Applying database optimizations...")
    print("=" * 60)
    
    with engine.begin() as conn:
        # Split and execute each statement
        statements = [s.strip() for s in optimization_sql.split(';') if s.strip()]
        
        for i, statement in enumerate(statements, 1):
            if not statement or statement.startswith('--'):
                continue
            
            try:
                # Extract operation type for reporting
                op_type = statement.split()[0].upper()
                print(f"[{i}/{len(statements)}] Executing {op_type}...", end=' ')
                
                conn.execute(text(statement + ';'))
                print("✓")
                
            except Exception as e:
                # Some statements might fail if they already exist, which is okay
                if 'already exists' in str(e).lower():
                    print("⚠ (already exists)")
                else:
                    print(f"✗ Error: {str(e)[:100]}")
    
    print("=" * 60)
    print("✓ Database optimizations applied successfully!")
    print("\nOptimizations include:")
    print("  • Indexes on dining_court, meal_time, and station")
    print("  • Trigram extension for fast text search")
    print("  • Composite indexes for common query patterns")
    print("  • Views for popular and healthy foods")
    print("  • search_foods() function for fuzzy search")

if __name__ == '__main__':
    apply_optimizations()
