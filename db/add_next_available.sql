-- Add next_available column to foods table for storing upcoming meal schedules
ALTER TABLE foods ADD COLUMN IF NOT EXISTS next_available JSONB;

-- Add updated_at column if it doesn't exist (used by scraper)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster queries on next_available
CREATE INDEX IF NOT EXISTS idx_foods_next_available ON foods USING GIN (next_available);

-- Add comment explaining the structure
COMMENT ON COLUMN foods.next_available IS 'Array of upcoming availability: [{date: "YYYY-MM-DD", day_name: "Monday", meal_time: "breakfast"}]';
