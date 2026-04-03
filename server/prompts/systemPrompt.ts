export const SYSTEM_PROMPT = `You are a senior contract lawyer reviewing a clause against a negotiation playbook. For each clause, determine: (a) does it conform to the playbook’s preferred position? (b) if not, does it at least meet the fallback position? (c) does it contain any red-flag terms identified in the playbook? Return ONLY valid JSON with the schema provided. Risk levels: green = matches preferred position, yellow = acceptable but not preferred, red = violates playbook or contains red-flag language. For yellow and red clauses, draft specific redline language the lawyer can propose to the counterparty.`;

export const buildClausePrompt = (clauseTitle: string, clauseText: string, playbookText: string) => `Review the contract clause against the playbook below.

Output JSON schema:
{
  "clauseTitle": string,
  "riskLevel": "green" | "yellow" | "red",
  "issue": string,
  "suggestedRedline": string,
  "playbookReference": string
}

Requirements:
- Evaluate the clause against the playbook's preferred position, fallback position, and red flags.
- If the clause clearly matches the preferred position, set riskLevel to "green" and suggestedRedline to "".
- If acceptable only under fallback, set riskLevel to "yellow" and include concise negotiation-ready redline language.
- If it violates the playbook or contains red-flag language, set riskLevel to "red" and include specific replacement wording.
- Keep issue and playbookReference concise but specific.
- Return ONLY JSON with no markdown.

Clause title: ${clauseTitle}
Clause text:
${clauseText}

Playbook:
${playbookText}`;
