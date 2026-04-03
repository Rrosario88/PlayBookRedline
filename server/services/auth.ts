import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

export interface AuthUser {
  id: number;
  email: string;
  role: "user" | "admin";
  emailVerifiedAt: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || "playbookredline-dev-secret-change-me";
const APP_URL = process.env.APP_URL || "https://playbookredline.187-124-249-117.sslip.io";
const COOKIE_NAME = "playbookredline_session";

export const authCookieName = COOKIE_NAME;
export const appUrl = APP_URL;
export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);
export const signAuthToken = (user: AuthUser) => jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
export const verifyAuthToken = (token: string) => jwt.verify(token, JWT_SECRET) as AuthUser;
const makeToken = () => crypto.randomBytes(24).toString("hex");

const mapUser = (row: any): AuthUser => ({
  id: row.id,
  email: row.email,
  role: row.role,
  emailVerifiedAt: row.email_verified_at ?? null,
});

export const getSafeUserById = async (id: number): Promise<AuthUser | null> => {
  const result = await pool.query("SELECT id, email, role, email_verified_at FROM users WHERE id = $1", [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
};

export const createInvite = async (email: string, role: "user" | "admin", createdByUserId: number) => {
  const normalized = email.trim().toLowerCase();
  const token = makeToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await pool.query(
    `INSERT INTO invite_tokens (email, role, token, expires_at, created_by_user_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [normalized, role, token, expiresAt, createdByUserId, new Date().toISOString()],
  );
  return { token, expiresAt, inviteLink: `${APP_URL}/?invite=${token}` };
};

export const createUser = async (email: string, password: string, inviteToken?: string): Promise<{ user: AuthUser; verificationLink?: string }> => {
  const normalized = email.trim().toLowerCase();
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [normalized]);
  if (existing.rowCount) throw new Error("An account with that email already exists.");

  const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM users");
  const userCount = countResult.rows[0]?.count ?? 0;

  let role: "user" | "admin" = userCount === 0 ? "admin" : "user";
  if (userCount > 0) {
    if (!inviteToken) throw new Error("Registration is invite-only. Enter a valid invite token.");
    const inviteResult = await pool.query(
      `SELECT * FROM invite_tokens WHERE token = $1 AND accepted_at IS NULL AND expires_at > NOW()`,
      [inviteToken],
    );
    const invite = inviteResult.rows[0];
    if (!invite || invite.email !== normalized) throw new Error("Invalid or expired invite token.");
    role = invite.role;
    await pool.query("UPDATE invite_tokens SET accepted_at = NOW() WHERE id = $1", [invite.id]);
  }

  const passwordHash = await hashPassword(password);
  const inserted = await pool.query(
    `INSERT INTO users (email, password_hash, role, created_at)
     VALUES ($1,$2,$3,$4)
     RETURNING id, email, role, email_verified_at`,
    [normalized, passwordHash, role, new Date().toISOString()],
  );
  const user = mapUser(inserted.rows[0]);

  if (userCount === 0) {
    await pool.query("UPDATE users SET email_verified_at = NOW() WHERE id = $1", [user.id]);
    return { user: { ...user, emailVerifiedAt: new Date().toISOString() } };
  }

  const verification = await createVerificationToken(user.id);
  return { user, verificationLink: verification.verifyLink };
};

export const authenticateUser = async (email: string, password: string): Promise<AuthUser> => {
  const normalized = email.trim().toLowerCase();
  const result = await pool.query(
    "SELECT id, email, role, email_verified_at, password_hash FROM users WHERE email = $1",
    [normalized],
  );
  const row = result.rows[0] as any;
  if (!row) throw new Error("Invalid email or password.");
  const ok = await comparePassword(password, row.password_hash);
  if (!ok) throw new Error("Invalid email or password.");
  return mapUser(row);
};

export const createVerificationToken = async (userId: number) => {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await pool.query(
    `INSERT INTO verification_tokens (user_id, token, expires_at, created_at) VALUES ($1,$2,$3,$4)`,
    [userId, token, expiresAt, new Date().toISOString()],
  );
  return { token, expiresAt, verifyLink: `${APP_URL}/?verify=${token}` };
};

export const verifyEmailToken = async (token: string): Promise<AuthUser> => {
  const result = await pool.query(
    `SELECT vt.id, vt.user_id FROM verification_tokens vt WHERE vt.token = $1 AND vt.consumed_at IS NULL AND vt.expires_at > NOW()`,
    [token],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Invalid or expired verification token.");
  await pool.query("UPDATE verification_tokens SET consumed_at = NOW() WHERE id = $1", [row.id]);
  await pool.query("UPDATE users SET email_verified_at = NOW() WHERE id = $1", [row.user_id]);
  const user = await getSafeUserById(row.user_id);
  if (!user) throw new Error("User not found.");
  return user;
};

export const createPasswordResetToken = async (email: string) => {
  const normalized = email.trim().toLowerCase();
  const result = await pool.query("SELECT id FROM users WHERE email = $1", [normalized]);
  const user = result.rows[0];
  if (!user) return { resetLink: null };
  const token = makeToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES ($1,$2,$3,$4)`,
    [user.id, token, expiresAt, new Date().toISOString()],
  );
  return { token, expiresAt, resetLink: `${APP_URL}/?reset=${token}` };
};

export const createPasswordResetTokenForUserId = async (userId: number) => {
  const token = makeToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES ($1,$2,$3,$4)`,
    [userId, token, expiresAt, new Date().toISOString()],
  );
  return { token, expiresAt, resetLink: `${APP_URL}/?reset=${token}` };
};

export const resetPasswordWithToken = async (token: string, password: string) => {
  const result = await pool.query(
    `SELECT id, user_id FROM password_reset_tokens WHERE token = $1 AND consumed_at IS NULL AND expires_at > NOW()`,
    [token],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Invalid or expired reset token.");
  const passwordHash = await hashPassword(password);
  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, row.user_id]);
  await pool.query("UPDATE password_reset_tokens SET consumed_at = NOW() WHERE id = $1", [row.id]);
};
