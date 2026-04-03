import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
}

const JWT_SECRET = process.env.JWT_SECRET || "playbookredline-dev-secret-change-me";
const COOKIE_NAME = "playbookredline_session";

export const authCookieName = COOKIE_NAME;

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const createUser = async (email: string, password: string): Promise<AuthUser> => {
  const normalized = email.trim().toLowerCase();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalized]);
  if (existing.rowCount) throw new Error("An account with that email already exists.");

  const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  const userCount = countResult.rows[0]?.count ?? 0;
  const passwordHash = await hashPassword(password);

  const inserted = await pool.query(
    "INSERT INTO users (email, password_hash, role, created_at) VALUES ($1, $2, $3, $4) RETURNING id, email, role",
    [normalized, passwordHash, userCount === 0 ? "admin" : "user", new Date().toISOString()],
  );
  return inserted.rows[0] as AuthUser;
};

export const authenticateUser = async (email: string, password: string): Promise<AuthUser> => {
  const normalized = email.trim().toLowerCase();
  const result = await pool.query("SELECT id, email, role, password_hash FROM users WHERE email = $1", [normalized]);
  const row = result.rows[0] as { id: number; email: string; role: "user" | "admin"; password_hash: string } | undefined;
  if (!row) throw new Error("Invalid email or password.");
  const ok = await comparePassword(password, row.password_hash);
  if (!ok) throw new Error("Invalid email or password.");
  return { id: row.id, email: row.email, role: row.role };
};

export const signAuthToken = (user: AuthUser) => jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
export const verifyAuthToken = (token: string) => jwt.verify(token, JWT_SECRET) as AuthUser;

export const getSafeUserById = async (id: number): Promise<AuthUser | null> => {
  const result = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [id]);
  return (result.rows[0] as AuthUser | undefined) ?? null;
};
