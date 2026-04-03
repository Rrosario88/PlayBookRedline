import { Router } from "express";

const router = Router();

const privacy = `# Privacy and Data Retention Policy

Last updated: 2026-04-03

PlayBookRedline uses a privacy-first default model. Uploaded contract and playbook files are processed in memory for analysis and are not intentionally persisted server-side by default unless a user explicitly saves a matter. If Anthropic is enabled, clause and playbook text may be transmitted to Anthropic for inference.`;

const terms = `# Terms of Use

Last updated: 2026-04-03

PlayBookRedline is an assistive software tool and not legal advice. Users remain responsible for reviewing outputs, complying with confidentiality obligations, and validating all redlines before use.`;

router.get("/legal/privacy", (_req, res) => {
  res.json({ title: "Privacy and Data Retention Policy", content: privacy });
});

router.get("/legal/terms", (_req, res) => {
  res.json({ title: "Terms of Use", content: terms });
});

export default router;
