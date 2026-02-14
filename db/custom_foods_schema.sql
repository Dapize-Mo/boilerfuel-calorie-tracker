-- ============================================================================
-- CUSTOM FOODS FEATURE
-- Allows users to add their own food items locally with custom nutrition data
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_foods (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    macros JSONB NOT NULL,  -- {"protein": X, "carbs": Y, "fats": Z}
    serving_size VARCHAR(100),  -- Optional: "1 cup", "100g", "1 item", etc.
    notes TEXT,  -- Optional: User notes about the food
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster user-specific queries
CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON custom_foods(user_id);

-- Index for searching by name
CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name);
