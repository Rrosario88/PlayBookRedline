import { Router } from "express";
import { authCookieName, authenticateUser, createUser, getSafeUserById, signAuthToken } from "../services/auth.js";
import { db } from "../services/db.js";
import { attachUser, requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

router.use(attachUser);

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password || password.length < 10) {
      throw new Error("Email and a password of at least 10 characters are required.");
    }
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

router.get("/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
  const user = getSafeUserById(req.user!.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ user });
});

router.get("/admin/users", requireRole("admin"), (_req, res) => {
  const users = db.prepare("SELECT id, email, role, created_at FROM users ORDER BY created_at DESC").all();
  res.json({ users });
});

export default router;
