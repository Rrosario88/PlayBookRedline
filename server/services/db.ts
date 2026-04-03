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
      email_verified_at TIMESTAMPTZ,
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

    CREATE TABLE IF NOT EXISTS invite_tokens (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      accepted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`);
};

export const pruneExpiredMatters = async () => {
  await pool.query("DELETE FROM matters WHERE delete_after <= NOW()");
};
