CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    protein INT NOT NULL,
    carbs INT NOT NULL,
    fats INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    meal_id INT REFERENCES meals(id) ON DELETE CASCADE,
    servings INT NOT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- App foods table to match backend SQLAlchemy model (Food)
-- The backend expects a "foods" table with a JSON/JSONB "macros" column
-- containing { protein, carbs, fats }
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    macros JSONB NOT NULL,
    dining_court VARCHAR(100),
    station VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster filtering by dining court
CREATE INDEX IF NOT EXISTS idx_foods_dining_court ON foods(dining_court);

CREATE TABLE IF NOT EXISTS menu_snapshots (
    id SERIAL PRIMARY KEY,
    menu_date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    calories INT NOT NULL,
    macros JSONB NOT NULL,
    dining_court VARCHAR(100) NOT NULL,
    dining_court_code VARCHAR(10),
    station VARCHAR(255),
    meal_time VARCHAR(50),
    source VARCHAR(20) DEFAULT 'api',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_menu_snapshots_date ON menu_snapshots(menu_date);
CREATE INDEX IF NOT EXISTS idx_menu_snapshots_court ON menu_snapshots(dining_court);
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_snapshots_unique
    ON menu_snapshots(menu_date, dining_court, meal_time, station, name);