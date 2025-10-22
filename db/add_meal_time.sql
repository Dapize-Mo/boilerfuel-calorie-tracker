-- Add meal_time column to foods table
ALTER TABLE foods ADD COLUMN IF NOT EXISTS meal_time VARCHAR(50);

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_foods_meal_time ON foods(meal_time);

-- Create composite index for dining court and meal time
CREATE INDEX IF NOT EXISTS idx_foods_dining_meal ON foods(dining_court, meal_time);
