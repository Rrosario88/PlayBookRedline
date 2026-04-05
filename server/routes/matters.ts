import { Router } from "express";
import { requireAuth, attachUser, type AuthenticatedRequest } from "../middleware/auth.js";
import { ensureCsrfCookie, requireCsrf } from "../middleware/csrf.js";
import { pool, pruneExpiredMatters } from "../services/db.js";

const router = Router();
router.use(attachUser);
router.use(ensureCsrfCookie);
router.use(requireAuth);
router.use(requireCsrf);

router.get("/matters", async (req: AuthenticatedRequest, res) => {
  await pruneExpiredMatters();
  const rows = await pool.query(
    "SELECT id, name, contract_name, playbook_name, retention_days, delete_after, retain_source_files, created_at FROM matters WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user!.id],
  );
  res.json({ matters: rows.rows });
});

router.get("/matters/:id", async (req: AuthenticatedRequest, res) => {
  await pruneExpiredMatters();
  const row = await pool.query("SELECT * FROM matters WHERE id = $1 AND user_id = $2", [req.params.id, req.user!.id]);
  const matter = row.rows[0] as any;
  if (!matter) return res.status(404).json({ message: "Matter not found." });
  res.json({
    matter: {
      id: matter.id,
      name: matter.name,
      contractName: matter.contract_name,
      playbookName: matter.playbook_name,
      retentionDays: matter.retention_days,
      deleteAfter: matter.delete_after,
      retainSourceFiles: Boolean(matter.retain_source_files),
      createdAt: matter.created_at,
      clauses: matter.clauses_json,
      analyses: matter.analyses_json,
    },
  });
});

router.post("/matters", async (req: AuthenticatedRequest, res) => {
  try {
    const { name, contractName, playbookName, clauses, analyses, retentionDays, retainSourceFiles } = req.body as any;
    if (!name || !Array.isArray(clauses) || !Array.isArray(analyses) || !analyses.length) throw new Error("Matter name, clauses, and analyses are required.");
    const days = Number(retentionDays || 30);
    if (![7, 30, 90].includes(days)) throw new Error("Retention must be 7, 30, or 90 days.");
    const now = new Date();
    const deleteAfter = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const info = await pool.query(
      `INSERT INTO matters (user_id, name, contract_name, playbook_name, clauses_json, analyses_json, retention_days, delete_after, retain_source_files, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [req.user!.id, name, contractName ?? null, playbookName ?? null, JSON.stringify(clauses), JSON.stringify(analyses), days, deleteAfter, retainSourceFiles ? true : false, now.toISOString()],
    );
    res.status(201).json({ id: info.rows[0].id, deleteAfter });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Failed to save matter." });
  }
});

router.delete("/matters/:id", async (req: AuthenticatedRequest, res) => {
  const info = await pool.query("DELETE FROM matters WHERE id = $1 AND user_id = $2", [req.params.id, req.user!.id]);
  if (!info.rowCount) return res.status(404).json({ message: "Matter not found." });
  res.json({ ok: true });
});

export default router;
