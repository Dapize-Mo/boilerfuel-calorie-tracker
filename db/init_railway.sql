-- Complete database initialization for Railway
-- Run this to create all tables and seed initial data

-- Create foods table
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    macros JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories_per_hour INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed sample foods
INSERT INTO foods (name, calories, macros) VALUES
('Grilled Chicken', 250, '{"protein": 30, "carbs": 0, "fats": 10}'),
('Caesar Salad', 150, '{"protein": 5, "carbs": 10, "fats": 12}'),
('Spaghetti', 300, '{"protein": 10, "carbs": 60, "fats": 5}'),
('Apple', 95, '{"protein": 0, "carbs": 25, "fats": 0}'),
('Brown Rice', 215, '{"protein": 5, "carbs": 45, "fats": 2}'),
('Broccoli', 55, '{"protein": 5, "carbs": 11, "fats": 0}'),
('Salmon', 367, '{"protein": 39, "carbs": 0, "fats": 22}'),
('Greek Yogurt', 100, '{"protein": 10, "carbs": 6, "fats": 0}'),
('Oatmeal', 154, '{"protein": 6, "carbs": 27, "fats": 3}'),
('Almonds', 164, '{"protein": 6, "carbs": 6, "fats": 14}')
ON CONFLICT DO NOTHING;

-- Seed sample activities
INSERT INTO activities (name, calories_per_hour) VALUES
('Running', 600),
('Walking', 280),
('Cycling', 500),
('Swimming', 450),
('Weight Training', 365),
('Yoga', 180),
('Basketball', 440),
('Elliptical', 400)
ON CONFLICT DO NOTHING;
