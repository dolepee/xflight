import { z } from "zod";

export const ClaimSchema = z.object({
  agentName: z.string().optional(),
  walletAddress: z.string().optional(),
  transactionCount: z.number().optional(),
  claimedPnl: z.number().optional(),
  pnlCurrency: z.string().optional(),
  onchainosUsed: z.boolean().optional(),
  uniswapUsed: z.boolean().optional(),
  deployedContract: z.string().optional(),
  githubUrl: z.string().optional(),
  liveDemoUrl: z.string().optional(),
  otherSkills: z.array(z.string()).optional(),
  deploymentChain: z.string().optional(),
  rawText: z.string(),
});

export type ExtractedClaims = z.infer<typeof ClaimSchema>;

const WALLET_REGEX = /0x[a-fA-F0-9]{40}/g;
const TX_COUNT_REGEX = /(\d+)\+?\s*(?:successful\s+)?(?:swap|trade|tx|transaction)/gi;
const PNL_REGEX = /\$?([\d,]+(?:\.\d+)?)\s*(?:USD|\$|USDC|USDT|OKB)?/gi;
const GITHUB_REGEX = /https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/gi;
const CONTRACT_REGEX = /0x[a-fA-F0-9]{40}/g;
const DEMO_URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
const ONCHAINOS_KEYWORDS = ["onchianos", "onchainos", "on-chain os", "openclaw"];
const UNISWAP_KEYWORDS = ["uniswap", "swap", "dex"];

export async function extractClaims(
  text: string,
  useAI: boolean = false
): Promise<ExtractedClaims> {
  if (useAI && process.env.OPENAI_API_KEY) {
    try {
      return await extractClaimsAI(text);
    } catch {
      return extractClaimsFallback(text);
    }
  }
  return extractClaimsFallback(text);
}

async function extractClaimsAI(text: string): Promise<ExtractedClaims> {
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Extract structured claims from this BuildX post. Return ONLY valid JSON with these fields (null if not mentioned):
- agentName: string | null
- walletAddress: string (0x...) | null
- transactionCount: number | null
- claimedPnl: number (just the number, no $) | null
- pnlCurrency: string | null
- onchainosUsed: boolean
- uniswapUsed: boolean
- deployedContract: string (0x...) | null
- githubUrl: string | null
- liveDemoUrl: string | null
- deploymentChain: string | null
- rawText: string (original text)

BuildX post:
${text.slice(0, 2000)}`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content || "{}";
  const cleaned = content.replace(/```json\n?|```/g, "").trim();
  const raw = JSON.parse(cleaned);
  return ClaimSchema.parse(raw);
}

function extractClaimsFallback(text: string): ExtractedClaims {
  const wallets = text.match(WALLET_REGEX) || [];
  const contracts = text.match(CONTRACT_REGEX) || [];
  const githubMatches = text.match(GITHUB_REGEX) || [];
  const demoMatches = text.match(DEMO_URL_REGEX) || [];

  const txCounts = text.match(TX_COUNT_REGEX) || [];
  const maxTxCount = txCounts.reduce((max, m) => {
    const n = parseInt(m.match(/\d+/)?.[0] || "0", 10);
    return n > max ? n : max;
  }, 0);

  const pnlMatches = text.match(PNL_REGEX) || [];
  const maxPnl = pnlMatches.reduce((max, m) => {
    const n = parseFloat(m.replace(/[$,]/g, ""));
    return n > max ? n : max;
  }, 0);

  const lowerText = text.toLowerCase();
  const onchainosUsed = ONCHAINOS_KEYWORDS.some((k) => lowerText.includes(k));
  const uniswapUsed = UNISWAP_KEYWORDS.some((k) => lowerText.includes(k));

  const githubUrl = githubMatches[0] || null;
  const liveDemoUrl = demoMatches.find(
    (u) => u.includes("demo") || u.includes("app.") || u.includes("https://")
  ) || null;

  const agentMatch = text.match(/@?([a-zA-Z0-9_]{2,20})/);
  const agentName = agentMatch?.[1] || null;

  return ClaimSchema.parse({
    agentName,
    walletAddress: wallets[0] || null,
    transactionCount: maxTxCount || null,
    claimedPnl: maxPnl || null,
    pnlCurrency: maxPnl ? "USD" : null,
    onchainosUsed,
    uniswapUsed,
    deployedContract: contracts[0] || null,
    githubUrl,
    liveDemoUrl,
    deploymentChain: "X Layer",
    rawText: text.slice(0, 2000),
  });
}
