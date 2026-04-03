import { Router } from "express";
import type { Response } from "express";
import multer from "multer";
import { analyzeClauses } from "../services/claudeAnalyzer.js";
import { extractTextFromFile, splitContractIntoClauses } from "../services/documentParser.js";
import { sampleContractName, sampleContractText, samplePlaybookName, samplePlaybookText } from "../sample/demoData.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const writeEvent = (res: Response, event: string, data: unknown) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  if (typeof (res as Response & { flush?: () => void }).flush === "function") {
    (res as Response & { flush?: () => void }).flush?.();
  }
};

router.get("/demo", (_req, res) => {
  res.json({
    contractName: sampleContractName,
    playbookName: samplePlaybookName,
    contractPreview: sampleContractText.split("\n\n").slice(0, 3).join("\n\n"),
    playbookPreview: samplePlaybookText.split("\n\n").slice(0, 3).join("\n\n"),
  });
});

router.post("/analyze", upload.fields([{ name: "contract", maxCount: 1 }, { name: "playbook", maxCount: 1 }]), async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const files = req.files as { contract?: Express.Multer.File[]; playbook?: Express.Multer.File[] } | undefined;
    const useDemo = req.body?.demo === "true";

    let contractText = sampleContractText;
    let playbookText = samplePlaybookText;
    let contractName = sampleContractName;
    let playbookName = samplePlaybookName;

    if (!useDemo) {
      const contractFile = files?.contract?.[0];
      const playbookFile = files?.playbook?.[0];

      if (!contractFile || !playbookFile) {
        throw new Error("Please upload both a contract and a playbook, or use the Sample Demo.");
      }

      contractName = contractFile.originalname;
      playbookName = playbookFile.originalname;
      contractText = await extractTextFromFile(contractFile);
      playbookText = await extractTextFromFile(playbookFile);
    }

    if (!contractText.trim() || !playbookText.trim()) {
      throw new Error("One or both documents did not contain readable text.");
    }

    const clauses = splitContractIntoClauses(contractText);
    if (!clauses.length) {
      throw new Error("No clauses were detected in the contract.");
    }

    writeEvent(res, "metadata", {
      contractName,
      playbookName,
      totalClauses: clauses.length,
      contractText,
      clauses,
    });

    const results = await analyzeClauses(clauses, playbookText, (result, completed, total) => {
      writeEvent(res, "progress", {
        completed,
        total,
        message: `Analyzing clause ${completed} of ${total}…`,
      });
      writeEvent(res, "clause", result);
    });

    writeEvent(res, "complete", {
      results,
      contractText,
      clauses,
      contractName,
      playbookName,
    });
  } catch (error) {
    writeEvent(res, "error", {
      message: error instanceof Error ? error.message : "Unknown analysis error.",
    });
  } finally {
    res.end();
  }
});

export default router;
