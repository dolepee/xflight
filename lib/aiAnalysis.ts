import { VerificationResult } from "./flightScorer";
import { ExtractedClaims } from "./claims";

interface AnalysisInput {
  claims: ExtractedClaims;
  verifications: VerificationResult[];
  score: number;
  verdict: string;
  breakdown: { category: string; points: number; max: number; reason: string }[];
  postText: string;
}

const ANALYSIS_PROMPT = `You are XFlight, an on-chain verification analyst for X Layer agents. You have just completed a deterministic verification of a Moltbook BuildX post. Your job is to write a concise, professional analysis explaining the verification results.

Be direct and technical. Reference specific on-chain evidence (wallet addresses, tx counts, contract addresses) when available. Explain why claims were marked verified, partial, unverified, or contradicted. Highlight any red flags or inconsistencies. If the score is low, explain what evidence would improve it.

Rules:
- Write 3-5 sentences max
- Be neutral and factual, never accusatory
- Reference the specific data points (addresses, counts) you found
- Explain the gap between claimed and verified where relevant
- End with a one-sentence overall assessment

Output ONLY the analysis text, no formatting or headers.`;

export async function generateAIAnalysis(input: AnalysisInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return input.verdict.replace(/_/g, " ");

  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    const context = buildContext(input);

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: ANALYSIS_PROMPT },
        { role: "user", content: context },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || input.verdict.replace(/_/g, " ");
  } catch {
    return input.verdict.replace(/_/g, " ");
  }
}

function buildContext(input: AnalysisInput): string {
  const lines: string[] = [];

  lines.push(`Flight Score: ${input.score}/100 (${input.verdict.replace(/_/g, " ")})`);
  lines.push("");

  lines.push("Score Breakdown:");
  for (const b of input.breakdown) {
    lines.push(`  ${b.category}: ${b.points}/${b.max} — ${b.reason}`);
  }
  lines.push("");

  lines.push("Extracted Claims:");
  if (input.claims.agentName) lines.push(`  Agent: ${input.claims.agentName}`);
  if (input.claims.walletAddress) lines.push(`  Wallet: ${input.claims.walletAddress}`);
  if (input.claims.transactionCount) lines.push(`  Claimed TX count: ${input.claims.transactionCount}`);
  if (input.claims.claimedPnl) lines.push(`  Claimed PnL: $${input.claims.claimedPnl}`);
  if (input.claims.deployedContract) lines.push(`  Contract: ${input.claims.deployedContract}`);
  if (input.claims.onchainosUsed) lines.push(`  OnchainOS: claimed`);
  if (input.claims.uniswapUsed) lines.push(`  Uniswap: claimed`);
  if (input.claims.githubUrl) lines.push(`  GitHub: ${input.claims.githubUrl}`);
  if (input.claims.liveDemoUrl) lines.push(`  Demo: ${input.claims.liveDemoUrl}`);
  lines.push("");

  lines.push("Verification Results:");
  for (const v of input.verifications) {
    lines.push(`  [${v.status.toUpperCase()}] ${v.claim}: ${v.detail}`);
  }
  lines.push("");

  lines.push("Original post excerpt:");
  lines.push(input.postText.slice(0, 500));

  return lines.join("\n");
}
