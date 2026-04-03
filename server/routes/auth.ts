import { Router } from "express";
import { authCookieName, authenticateUser, createUser, getSafeUserById, signAuthToken } from "../services/auth.js";
import { pool } from "../services/db.js";
import { attachUser, requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const baseCookieOptions = { httpOnly: true, sameSite: "lax" as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
router.use(attachUser);

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password || password.length < 10) throw new Error("Email and a password of at least 10 characters are required.");
    const user = await createUser(email, password);
    const token = signAuthToken(user);
    res.cookie(authCookieName, token, { ...baseCookieOptions, secure: req.secure || req.headers['x-forwarded-proto'] === 'https' });
    res.status(201).json({ user });
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
    res.cookie(authCookieName, token, { ...baseCookieOptions, secure: req.secure || req.headers['x-forwarded-proto'] === 'https' });
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

router.get("/admin/users", requireRole("admin"), async (_req, res) => {
  const users = await pool.query("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC");
  res.json({ users: users.rows });
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
