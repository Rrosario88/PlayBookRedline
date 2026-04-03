import { Router } from "express";
import { generateRedlinedDocx } from "../services/docxGenerator.js";
import type { AnalysisResult } from "../services/claudeAnalyzer.js";
import type { Clause } from "../services/documentParser.js";

const router = Router();

const isValidClause = (value: Clause) =>
  typeof value?.id === "string" && typeof value?.clauseTitle === "string" && typeof value?.originalText === "string";

const isValidAnalysis = (value: AnalysisResult) =>
  typeof value?.id === "string" && typeof value?.riskLevel === "string" && typeof value?.suggestedRedline === "string";

router.post("/export", async (req, res) => {
  try {
    const { contractName, clauses, analyses } = req.body as {
      contractName?: string;
      clauses?: Clause[];
      analyses?: AnalysisResult[];
    };

    if (!clauses?.length || !clauses.every(isValidClause)) {
      throw new Error("No valid contract clauses were provided for export.");
    }

    if (!analyses?.length || !analyses.every(isValidAnalysis)) {
      throw new Error("No valid analysis results were provided for export.");
    }

    const buffer = await generateRedlinedDocx({
      contractTitle: contractName?.replace(/\.(pdf|docx)$/i, "") || "PlaybookRedline Export",
      clauses,
      analyses,
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${(contractName || "playbook-redline").replace(/\.(pdf|docx)$/i, "")}-redlined.docx"`);
    res.send(buffer);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Failed to export DOCX." });
  }
});

export default router;
