import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { Express } from "express";

export interface Clause {
  id: string;
  index: number;
  clauseTitle: string;
  clauseText: string;
  originalText: string;
}

const cleanText = (value: string) =>
  value
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const extractTextFromFile = async (file: Express.Multer.File): Promise<string> => {
  if (!file) {
    throw new Error("Missing upload.");
  }

  const filename = file.originalname.toLowerCase();

  if (filename.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer: file.buffer });
    const text = cleanText(value);
    if (!text) throw new Error(`DOCX file ${file.originalname} contained no readable text.`);
    return text;
  }

  if (filename.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) });
    const parsed = await parser.getText();
    await parser.destroy();
    const text = cleanText(parsed.text || "");
    if (!text) throw new Error(`PDF file ${file.originalname} contained no readable text.`);
    return text;
  }

  throw new Error(`Unsupported file type for ${file.originalname}. Please upload PDF or DOCX.`);
};

const looksLikeHeading = (line: string) => /^(\d+(?:\.\d+)*[.)]?\s+|[A-Z][A-Z\s,&/-]{4,}|[A-Z][A-Za-z\s/&,-]{2,60}:)$/.test(line.trim());

const makeClause = (index: number, clauseTitle: string, clauseText: string): Clause => ({
  id: `clause-${index + 1}`,
  index,
  clauseTitle,
  clauseText,
  originalText: clauseText,
});

export const splitContractIntoClauses = (contractText: string): Clause[] => {
  const normalized = cleanText(contractText);
  const paragraphs = normalized
    .split(/\n\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const numberedClauses: Clause[] = [];

  for (const paragraph of paragraphs) {
    const inlineClauseMatch = paragraph.match(/^(\d+(?:\.\d+)*)\.\s+([^.:\n]{2,120})\.\s+([\s\S]+)$/);
    if (inlineClauseMatch) {
      const [, number, title, body] = inlineClauseMatch;
      numberedClauses.push(makeClause(numberedClauses.length, `${number}. ${title.trim()}`, cleanText(body)));
      continue;
    }

    if (looksLikeHeading(paragraph)) {
      continue;
    }

    if (numberedClauses.length === 0) {
      numberedClauses.push(makeClause(0, "Preamble", cleanText(paragraph)));
      continue;
    }

    const previous = numberedClauses[numberedClauses.length - 1];
    previous.clauseText = cleanText(`${previous.clauseText}\n${paragraph}`);
    previous.originalText = previous.clauseText;
  }

  if (numberedClauses.length > 1) {
    return numberedClauses;
  }

  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const clauses: Clause[] = [];
  let currentTitle = "Preamble";
  let currentBody: string[] = [];

  const pushClause = () => {
    const body = cleanText(currentBody.join("\n"));
    if (!body) return;
    clauses.push(makeClause(clauses.length, currentTitle, body));
  };

  for (const line of lines) {
    if (looksLikeHeading(line) && currentBody.length > 0) {
      pushClause();
      currentTitle = line.replace(/\s+/g, " ");
      currentBody = [];
      continue;
    }

    if (looksLikeHeading(line) && currentBody.length === 0) {
      currentTitle = line.replace(/\s+/g, " ");
      continue;
    }

    currentBody.push(line);
  }

  pushClause();

  if (clauses.length === 0) {
    return paragraphs.map((paragraph, index) => makeClause(index, `Clause ${index + 1}`, paragraph));
  }

  return clauses;
};
