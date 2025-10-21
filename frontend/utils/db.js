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
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      calories_per_hour INT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
