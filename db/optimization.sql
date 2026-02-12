-- Database Optimization Script
-- Indexes for faster queries on foods and menu_snapshots tables

-- === Foods Table Indexes ===
CREATE INDEX IF NOT EXISTS idx_foods_dining_court_meal ON foods(dining_court, meal_time);
CREATE INDEX IF NOT EXISTS idx_foods_station ON foods(station);
CREATE INDEX IF NOT EXISTS idx_foods_calories ON foods(calories);
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING gin(name gin_trgm_ops);

-- Enable trigram extension for fast text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- === Menu Snapshots Indexes (if exists) ===
CREATE INDEX IF NOT EXISTS idx_menu_date_court_meal ON menu_snapshots(menu_date, dining_court, meal_time);
CREATE INDEX IF NOT EXISTS idx_menu_updated_at ON menu_snapshots(updated_at DESC);

-- === Composite Indexes for Common Queries ===
CREATE INDEX IF NOT EXISTS idx_foods_court_meal_station ON foods(dining_court, meal_time, station);

-- === Statistics Update ===
-- Update table statistics for better query planning
ANALYZE foods;
ANALYZE menu_snapshots;

-- === Vacuum ===
-- Reclaim storage and update statistics
VACUUM ANALYZE foods;
VACUUM ANALYZE menu_snapshots;

-- === View for Popular Foods ===
CREATE OR REPLACE VIEW popular_foods AS
SELECT 
    id,
    name,
    calories,
    macros,
    dining_court,
    station,
    meal_time,
    created_at
FROM foods
WHERE dining_court IS NOT NULL
ORDER BY calories DESC
LIMIT 100;

-- === View for Healthy Options ===
CREATE OR REPLACE VIEW healthy_foods AS
SELECT 
    id,
    name,
    calories,
    macros,
    dining_court,
    station,
    meal_time,
    (macros->>'protein')::float as protein,
    (macros->>'carbs')::float as carbs,  (macros->>'fats')::float as fats
FROM foods
WHERE 
    dining_court IS NOT NULL
    AND calories < 400
    AND (macros->>'protein')::float > 15
ORDER BY (macros->>'protein')::float DESC;

-- === Function for Fast Food Search ===
CREATE OR REPLACE FUNCTION search_foods(search_term TEXT)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR,
    calories INTEGER,
    macros JSONB,
    dining_court VARCHAR,
    station VARCHAR,
    meal_time VARCHAR,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.calories,
        f.macros,
        f.dining_court,
        f.station,
        f.meal_time,
        similarity(f.name, search_term) as sim
    FROM foods f
    WHERE f.name % search_term
    ORDER BY sim DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- === Comment Documentation ===
COMMENT ON INDEX idx_foods_dining_court_meal IS 'Optimize filtering by dining court and meal time';
COMMENT ON INDEX idx_foods_court_meal_station IS 'Optimize queries with all three filters';
COMMENT ON FUNCTION search_foods IS 'Fast fuzzy search for food items';
