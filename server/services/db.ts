import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://playbookredline:playbookredline@postgres:5432/playbookredline";

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" && !DATABASE_URL.includes("postgres:") ? { rejectUnauthorized: false } : false,
});

export const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matters (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      contract_name TEXT,
      playbook_name TEXT,
      clauses_json JSONB NOT NULL,
      analyses_json JSONB NOT NULL,
      retention_days INTEGER NOT NULL,
      delete_after TIMESTAMPTZ NOT NULL,
      retain_source_files BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
};

export const pruneExpiredMatters = async () => {
  await pool.query("DELETE FROM matters WHERE delete_after <= NOW()");
};
