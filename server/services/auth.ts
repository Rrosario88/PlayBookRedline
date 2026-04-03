import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db.js";

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
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
  if (existing) throw new Error("An account with that email already exists.");
  const role = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  const passwordHash = await hashPassword(password);
  const info = db.prepare(
    "INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
  ).run(normalized, passwordHash, role.count === 0 ? "admin" : "user", new Date().toISOString());
  return db.prepare("SELECT id, email, role FROM users WHERE id = ?").get(info.lastInsertRowid) as AuthUser;
};

export const authenticateUser = async (email: string, password: string): Promise<AuthUser> => {
  const normalized = email.trim().toLowerCase();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalized) as { id: number; email: string; role: "user" | "admin"; password_hash: string } | undefined;
  if (!row) throw new Error("Invalid email or password.");
  const ok = await comparePassword(password, row.password_hash);
  if (!ok) throw new Error("Invalid email or password.");
  return { id: row.id, email: row.email, role: row.role };
};

export const signAuthToken = (user: AuthUser) => jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });

export const verifyAuthToken = (token: string) => jwt.verify(token, JWT_SECRET) as AuthUser;

export const getSafeUserById = (id: number): AuthUser | null => {
  const user = db.prepare("SELECT id, email, role FROM users WHERE id = ?").get(id) as AuthUser | undefined;
  return user ?? null;
};
