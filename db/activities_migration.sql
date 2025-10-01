-- Migration to add activities table for gym/activity tracking
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories_per_hour INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample activities
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
