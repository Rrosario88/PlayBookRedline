import { Router } from "express";
import { requireAuth, attachUser, type AuthenticatedRequest } from "../middleware/auth.js";
import { db, pruneExpiredMatters } from "../services/db.js";

const router = Router();
router.use(attachUser);
router.use(requireAuth);

router.get("/matters", (req: AuthenticatedRequest, res) => {
  pruneExpiredMatters();
  const rows = db.prepare(
    "SELECT id, name, contract_name, playbook_name, retention_days, delete_after, retain_source_files, created_at FROM matters WHERE user_id = ? ORDER BY created_at DESC",
  ).all(req.user!.id);
  res.json({ matters: rows });
});

router.get("/matters/:id", (req: AuthenticatedRequest, res) => {
  pruneExpiredMatters();
  const row = db.prepare(
    "SELECT * FROM matters WHERE id = ? AND user_id = ?",
  ).get(req.params.id, req.user!.id) as any;
  if (!row) return res.status(404).json({ message: "Matter not found." });
  res.json({
    matter: {
      id: row.id,
      name: row.name,
      contractName: row.contract_name,
      playbookName: row.playbook_name,
      retentionDays: row.retention_days,
      deleteAfter: row.delete_after,
      retainSourceFiles: Boolean(row.retain_source_files),
      createdAt: row.created_at,
      clauses: JSON.parse(row.clauses_json),
      analyses: JSON.parse(row.analyses_json),
    },
  });
});

router.post("/matters", (req: AuthenticatedRequest, res) => {
  try {
    const { name, contractName, playbookName, clauses, analyses, retentionDays, retainSourceFiles } = req.body as any;
    if (!name || !Array.isArray(clauses) || !Array.isArray(analyses) || !analyses.length) {
      throw new Error("Matter name, clauses, and analyses are required.");
    }
    const days = Number(retentionDays || 30);
    if (![7, 30, 90].includes(days)) throw new Error("Retention must be 7, 30, or 90 days.");
    const now = new Date();
    const deleteAfter = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
    const info = db.prepare(
      `INSERT INTO matters (user_id, name, contract_name, playbook_name, clauses_json, analyses_json, retention_days, delete_after, retain_source_files, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(req.user!.id, name, contractName ?? null, playbookName ?? null, JSON.stringify(clauses), JSON.stringify(analyses), days, deleteAfter, retainSourceFiles ? 1 : 0, now.toISOString());
    res.status(201).json({ id: info.lastInsertRowid, deleteAfter });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Failed to save matter." });
  }
});

router.delete("/matters/:id", (req: AuthenticatedRequest, res) => {
  const info = db.prepare("DELETE FROM matters WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
  if (!info.changes) return res.status(404).json({ message: "Matter not found." });
  res.json({ ok: true });
});

export default router;
