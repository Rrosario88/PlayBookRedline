import { Router } from "express";
import {
  authCookieName,
  authenticateUser,
  createInvite,
  createPasswordResetToken,
  createPasswordResetTokenForUserId,
  createUser,
  createVerificationToken,
  getSafeUserById,
  resetPasswordWithToken,
  signAuthToken,
  verifyEmailToken,
} from "../services/auth.js";
import { pool } from "../services/db.js";
import { attachUser, requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const baseCookieOptions = { httpOnly: true, sameSite: "lax" as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
router.use(attachUser);
const cookieOptions = (req: any) => ({ ...baseCookieOptions, secure: req.secure || req.headers['x-forwarded-proto'] === 'https' });

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, inviteToken } = req.body as { email?: string; password?: string; inviteToken?: string };
    if (!email || !password || password.length < 10) throw new Error("Email and a password of at least 10 characters are required.");
    const created = await createUser(email, password, inviteToken);
    const token = signAuthToken(created.user);
    res.cookie(authCookieName, token, cookieOptions(req));
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed." });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw new Error("Email and password are required.");
    const user = await authenticateUser(email, password);
    const token = signAuthToken(user);
    res.cookie(authCookieName, token, cookieOptions(req));
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Login failed." });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie(authCookieName, { path: "/" });
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = await getSafeUserById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user });
});

router.post("/auth/request-password-reset", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ message: "Email is required." });
  const reset = await createPasswordResetToken(email);
  res.json({ ok: true, message: "If the account exists, a reset link has been generated.", ...reset });
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password || password.length < 10) throw new Error("A valid token and a password of at least 10 characters are required.");
    await resetPasswordWithToken(token, password);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Password reset failed." });
  }
});

router.post("/auth/request-email-verification", requireAuth, async (req: AuthenticatedRequest, res) => {
  const link = await createVerificationToken(req.user!.id);
  res.json(link);
});

router.post("/auth/verify-email", async (req, res) => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) throw new Error("Verification token is required.");
    const user = await verifyEmailToken(token);
    const sessionToken = signAuthToken(user);
    res.cookie(authCookieName, sessionToken, cookieOptions(req));
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Verification failed." });
  }
});

router.get("/admin/users", requireRole("admin"), async (_req, res) => {
  const users = await pool.query("SELECT id, email, role, email_verified_at, created_at FROM users ORDER BY created_at DESC");
  res.json({ users: users.rows });
});

router.post("/admin/invites", requireRole("admin"), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, role } = req.body as { email?: string; role?: "user" | "admin" };
    if (!email) throw new Error("Email is required.");
    const invite = await createInvite(email, role === "admin" ? "admin" : "user", req.user!.id);
    res.status(201).json(invite);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Invite creation failed." });
  }
});

router.post("/admin/users/:id/reset-link", requireRole("admin"), async (req, res) => {
  const reset = await createPasswordResetTokenForUserId(Number(req.params.id));
  res.json(reset);
});

router.get("/admin/matters", requireRole("admin"), async (_req, res) => {
  const matters = await pool.query("SELECT id, user_id, name, contract_name, playbook_name, retention_days, delete_after, retain_source_files, created_at FROM matters ORDER BY created_at DESC");
  const stats = await pool.query("SELECT (SELECT COUNT(*)::int FROM users) AS users, (SELECT COUNT(*)::int FROM matters) AS matters");
  res.json({ matters: matters.rows, stats: stats.rows[0] });
});

router.post("/admin/prune-matters", requireRole("admin"), async (_req, res) => {
  const result = await pool.query("DELETE FROM matters WHERE delete_after <= NOW() RETURNING id");
  res.json({ deleted: result.rowCount ?? 0 });
});

export default router;
