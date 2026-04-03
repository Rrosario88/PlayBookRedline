import Anthropic from "@anthropic-ai/sdk";
import pLimit from "p-limit";
import { buildClausePrompt, SYSTEM_PROMPT } from "../prompts/systemPrompt.js";
import type { Clause } from "./documentParser.js";

export type RiskLevel = "green" | "yellow" | "red";

export interface AnalysisResult {
  id: string;
  clauseTitle: string;
  clauseText: string;
  riskLevel: RiskLevel;
  issue: string;
  suggestedRedline: string;
  playbookReference: string;
  index: number;
  source: "claude" | "fallback";
}

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const limit = pLimit(5);

const normalizeJson = (raw: string): AnalysisResult => {
  const parsed = JSON.parse(raw.trim());
  if (!["green", "yellow", "red"].includes(parsed.riskLevel)) {
    throw new Error("Invalid risk level returned by Claude.");
  }

  return {
    id: "",
    clauseTitle: parsed.clauseTitle,
    clauseText: "",
    riskLevel: parsed.riskLevel,
    issue: parsed.issue,
    suggestedRedline: parsed.suggestedRedline ?? "",
    playbookReference: parsed.playbookReference ?? "",
    index: 0,
    source: anthropic ? "claude" : "fallback",
  };
};

const heuristicAnalyze = (clause: Clause, playbookText: string): AnalysisResult => {
  const text = clause.clauseText.toLowerCase();
  const playbook = playbookText.toLowerCase();
  let riskLevel: RiskLevel = "green";
  let issue = "Clause appears aligned with the playbook’s preferred position.";
  let suggestedRedline = "";
  let playbookReference = "General alignment";

  const checks = [
    {
      match: /any internal business purpose|affiliates/.test(text),
      risk: "red" as RiskLevel,
      issue: "Use restriction is broader than the playbook allows.",
      redline: "Recipient may use Confidential Information solely to evaluate, negotiate, and if executed, implement the specific contemplated transaction between the parties.",
      reference: "Purpose / Use Restriction",
    },
    {
      match: /residuals/.test(text) || /unaided memory/.test(text),
      risk: "red" as RiskLevel,
      issue: "Residuals language is a red flag under the playbook.",
      redline: "Delete the residuals clause in its entirety. If counterparty resists, limit residual use to generalized ideas and expressly exclude source code, pricing, customer data, personal data, and trade secrets.",
      reference: "Residuals",
    },
    {
      match: /45 days/.test(text),
      risk: "red" as RiskLevel,
      issue: "Return/destruction timing exceeds the fallback position.",
      redline: "Upon written request, Recipient will return or destroy Confidential Information within 15 days, except Recipient may retain one archival copy required for legal or compliance purposes and routine backup copies maintained automatically.",
      reference: "Return or Destruction",
    },
    {
      match: /five years/.test(text),
      risk: playbook.includes("five-year survival") ? "yellow" as RiskLevel : "red" as RiskLevel,
      issue: "Term is acceptable only as a fallback position.",
      redline: "This Agreement will remain in effect for two years from the Effective Date, and confidentiality obligations will survive for three years thereafter; trade secrets remain protected for so long as they qualify as trade secrets.",
      reference: "Term",
    },
    {
      match: /new york/.test(text),
      risk: "yellow" as RiskLevel,
      issue: "Governing law is fallback-acceptable but not preferred.",
      redline: "This Agreement shall be governed by the laws of the State of Delaware, without regard to its conflict of laws principles.",
      reference: "Governing Law",
    },
  ];

  const found = checks.find((entry) => entry.match);
  if (found) {
    riskLevel = found.risk;
    issue = found.issue;
    suggestedRedline = found.redline;
    playbookReference = found.reference;
  }

  return {
    id: clause.id,
    clauseTitle: clause.clauseTitle,
    clauseText: clause.clauseText,
    riskLevel,
    issue,
    suggestedRedline,
    playbookReference,
    index: clause.index,
    source: "fallback",
  };
};

export const analyzeClause = async (clause: Clause, playbookText: string): Promise<AnalysisResult> => {
  if (!anthropic) {
    return heuristicAnalyze(clause, playbookText);
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: buildClausePrompt(clause.clauseTitle, clause.clauseText, playbookText),
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude returned no text response.");
    }

    const normalized = normalizeJson(textBlock.text);
    return {
      ...normalized,
      id: clause.id,
      clauseTitle: normalized.clauseTitle || clause.clauseTitle,
      clauseText: clause.clauseText,
      index: clause.index,
      source: "claude",
    };
  } catch (error) {
    const fallback = heuristicAnalyze(clause, playbookText);
    return {
      ...fallback,
      riskLevel: fallback.riskLevel === "green" ? "yellow" : fallback.riskLevel,
      issue: `${fallback.issue} Claude error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

export const analyzeClauses = async (
  clauses: Clause[],
  playbookText: string,
  onResult: (result: AnalysisResult, completed: number, total: number) => void,
): Promise<AnalysisResult[]> => {
  let completed = 0;
  const tasks = clauses.map((clause) =>
    limit(async () => {
      const result = await analyzeClause(clause, playbookText);
      completed += 1;
      onResult(result, completed, clauses.length);
      return result;
    }),
  );

  const results = await Promise.all(tasks);
  return results.sort((a, b) => a.index - b.index);
};
