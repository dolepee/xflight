import { z } from "zod";

export const ClaimSchema = z.object({
  agentName: z.string().nullish(),
  walletAddress: z.string().nullish(),
  transactionCount: z.number().nullish(),
  claimedPnl: z.number().nullish(),
  pnlCurrency: z.string().nullish(),
  onchainosUsed: z.boolean().nullish(),
  uniswapUsed: z.boolean().nullish(),
  deployedContract: z.string().nullish(),
  githubUrl: z.string().nullish(),
  liveDemoUrl: z.string().nullish(),
  otherSkills: z.array(z.string()).nullish(),
  deploymentChain: z.string().nullish(),
  rawText: z.string(),
});

export type ExtractedClaims = z.infer<typeof ClaimSchema>;

const WALLET_REGEX = /0x[a-fA-F0-9]{40}/g;
const TX_COUNT_REGEX = /(\d+)\+?\s*(?:successful\s+)?(?:swap|trade|tx|transaction)/gi;
const PNL_REGEX = /\$?([\d,]+(?:\.\d+)?)\s*(?:USD|\$|USDC|USDT|OKB)?/gi;
const GITHUB_REGEX = /https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+/gi;
const CONTRACT_REGEX = /0x[a-fA-F0-9]{40}/g;
const DEMO_URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
const ONCHAINOS_KEYWORDS = ["onchainos", "onchain os", "okx wallet api", "okx dex api", "onchainos dev portal"];
const UNISWAP_KEYWORDS = ["uniswap", "uniswapx", "uniswap v2", "uniswap v3", "uniswap v4"];

export async function extractClaims(
  text: string,
  useAI: boolean = false
): Promise<ExtractedClaims> {
  if (useAI && process.env.DGRID_API_KEY) {
    try {
      return await extractClaimsAI(text);
    } catch {
      return extractClaimsFallback(text);
    }
  }
  return extractClaimsFallback(text);
}

async function extractClaimsAI(text: string): Promise<ExtractedClaims> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({
    baseURL: "https://api.dgrid.ai/v1",
    apiKey: process.env.DGRID_API_KEY || "",
  });

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
    model: "openai/gpt-4o",
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
  const deploymentChain = /\bx\s*layer\b|\bxlayer\b/i.test(text) ? "X Layer" : null;

  const githubUrl = githubMatches[0] || null;
  const liveDemoUrl = demoMatches.find(
    (u) => u.includes("demo") || u.includes("app.") || u.includes("vercel.app") || u.includes("pages.dev")
  ) || null;

  const agentMatch = text.match(/(?:@|agent\s+name[:\s]+)([a-zA-Z0-9_\-]{2,32})/i);
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
    deploymentChain,
    rawText: text.slice(0, 2000),
  });
}
