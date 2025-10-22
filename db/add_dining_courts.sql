-- Add dining court and station columns to foods table
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS dining_court VARCHAR(100),
ADD COLUMN IF NOT EXISTS station VARCHAR(255);

-- Create index for faster filtering by dining court
CREATE INDEX IF NOT EXISTS idx_foods_dining_court ON foods(dining_court);
