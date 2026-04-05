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
import { attachUser, requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth.js";
import { ensureCsrfCookie, issueCsrfToken, requireCsrf } from "../middleware/csrf.js";
import { pool } from "../services/db.js";
import { getActiveModel, setActiveModel } from "../services/claudeAnalyzer.js";

// Popular OpenRouter models available for contract analysis
export const OPENROUTER_MODELS = [
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic", tier: "Recommended" },
  { id: "anthropic/claude-opus-4", label: "Claude Opus 4", provider: "Anthropic", tier: "Most capable" },
  { id: "anthropic/claude-haiku-4", label: "Claude Haiku 4", provider: "Anthropic", tier: "Fastest" },
  { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI", tier: "Recommended" },
  { id: "openai/gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI", tier: "Fastest" },
  { id: "openai/o3", label: "o3", provider: "OpenAI", tier: "Most capable" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google", tier: "Most capable" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google", tier: "Fastest" },
  { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", provider: "Meta", tier: "Open source" },
  { id: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral", tier: "Open source" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", provider: "DeepSeek", tier: "Open source" },
];

const router = Router();
const baseCookieOptions = { httpOnly: true, sameSite: "lax" as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (email?: string) => {
  const normalized = email?.trim().toLowerCase();
  if (!normalized || !emailPattern.test(normalized) || normalized.length > 254) {
    throw new Error("Enter a valid email address.");
  }
  return normalized;
};
const validatePassword = (password?: string) => {
  if (!password || password.length < 10 || password.length > 128) {
    throw new Error("Password must be between 10 and 128 characters.");
  }
  return password;
};
router.use(attachUser);
router.use(ensureCsrfCookie);
const cookieOptions = (req: any) => ({ ...baseCookieOptions, secure: req.secure || req.headers['x-forwarded-proto'] === 'https' });

router.get("/auth/csrf", (req, res) => {
  const csrfToken = res.locals.csrfToken || req.cookies?.playbookredline_csrf || issueCsrfToken(req, res);
  res.json({ csrfToken });
});

router.use(requireCsrf);

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, inviteToken } = req.body as { email?: string; password?: string; inviteToken?: string };
    const normalizedEmail = validateEmail(email);
    const safePassword = validatePassword(password);
    const created = await createUser(normalizedEmail, safePassword, inviteToken);
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
    const normalizedEmail = validateEmail(email);
    const safePassword = validatePassword(password);
    const user = await authenticateUser(normalizedEmail, safePassword);
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
  try {
    const { email } = req.body as { email?: string };
    const normalizedEmail = validateEmail(email);
    const reset = await createPasswordResetToken(normalizedEmail);
    res.json({ ok: true, message: "If the account exists, a reset link has been generated.", ...reset });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Password reset request failed." });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token) throw new Error("A valid reset token is required.");
    const safePassword = validatePassword(password);
    await resetPasswordWithToken(token, safePassword);
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
    const normalizedEmail = validateEmail(email);
    const invite = await createInvite(normalizedEmail, role === "admin" ? "admin" : "user", req.user!.id);
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

router.get("/admin/model", requireRole("admin"), (_req, res) => {
  res.json({
    activeModel: getActiveModel(),
    models: OPENROUTER_MODELS,
    hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
  });
});

router.post("/admin/model", requireRole("admin"), (req, res) => {
  const { model } = req.body as { model?: string };
  if (!model || typeof model !== "string") {
    res.status(400).json({ message: "model field is required." });
    return;
  }
  setActiveModel(model);
  res.json({ activeModel: getActiveModel() });
});

export default router;
