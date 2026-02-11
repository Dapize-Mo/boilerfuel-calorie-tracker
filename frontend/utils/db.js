import { Pool } from 'pg';

// Prefer Vercel Postgres URL if present, else fall back to generic DATABASE_URL
const connectionString = process.env.POSTGRES_URL
  || process.env.POSTGRES_PRISMA_URL
  || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[db] No DATABASE_URL/POSTGRES_URL found. API routes will fail until set.');
}

// In serverless, avoid long-lived pools across cold starts; keep a global
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString,
      // Many free Postgres providers require SSL
      ssl: shouldUseSSL(connectionString) ? { rejectUnauthorized: false } : undefined,
      max: 3,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}

function shouldUseSSL(url) {
  if (!url) return false;
  // If connecting to localhost, skip SSL
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  return url.startsWith('postgres');
}

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function ensureSchema() {
  // Create tables if they don't exist
  await query(`
    CREATE TABLE IF NOT EXISTS foods (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      calories INT NOT NULL,
      macros JSONB NOT NULL,
      dining_court VARCHAR(100),
      station VARCHAR(255),
      meal_time VARCHAR(50),
      next_available JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add columns missing from older deployments
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='foods' AND column_name='next_available') THEN
        ALTER TABLE foods ADD COLUMN next_available JSONB;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='foods' AND column_name='updated_at') THEN
        ALTER TABLE foods ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
      END IF;
    END $$;
  `);

  // Useful indexes
  await query(`CREATE INDEX IF NOT EXISTS idx_foods_dining_meal ON foods(dining_court, meal_time);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_foods_next_available ON foods USING GIN (next_available);`);

  await query(`
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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_snapshots' AND column_name='dining_court_code') THEN
        ALTER TABLE menu_snapshots ADD COLUMN dining_court_code VARCHAR(10);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_snapshots' AND column_name='source') THEN
        ALTER TABLE menu_snapshots ADD COLUMN source VARCHAR(20) DEFAULT 'api';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_snapshots' AND column_name='updated_at') THEN
        ALTER TABLE menu_snapshots ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
      END IF;
    END $$;
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_menu_snapshots_date ON menu_snapshots(menu_date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_menu_snapshots_court ON menu_snapshots(dining_court);`);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_snapshots_unique ON menu_snapshots(menu_date, dining_court, meal_time, station, name);`);

  await query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      calories_per_hour INT NOT NULL,
      category VARCHAR(50) DEFAULT 'other',
      intensity VARCHAR(50) DEFAULT 'moderate',
      muscle_groups JSONB DEFAULT '[]'::jsonb,
      equipment VARCHAR(255),
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Add new columns to existing activities table if they don't exist
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='activities' AND column_name='category') THEN
        ALTER TABLE activities ADD COLUMN category VARCHAR(50) DEFAULT 'other';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='activities' AND column_name='intensity') THEN
        ALTER TABLE activities ADD COLUMN intensity VARCHAR(50) DEFAULT 'moderate';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='activities' AND column_name='muscle_groups') THEN
        ALTER TABLE activities ADD COLUMN muscle_groups JSONB DEFAULT '[]'::jsonb;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='activities' AND column_name='equipment') THEN
        ALTER TABLE activities ADD COLUMN equipment VARCHAR(255);
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='activities' AND column_name='description') THEN
        ALTER TABLE activities ADD COLUMN description TEXT;
      END IF;
    END $$;
  `);
}
