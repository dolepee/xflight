import * as z from "zod";

const VerifyMoltbookPostInput = z.object({
  url: z.string(),
});

const VerifyTxInput = z.object({
  txHash: z.string(),
  chain: z.string().optional().default("xlayer"),
});

const VerifyWalletInput = z.object({
  address: z.string(),
});

const GenerateProofCardInput = z.object({
  reportId: z.string(),
});

const AttestReportInput = z.object({
  reportId: z.string(),
});

export type VerifyMoltbookPostInput = z.infer<typeof VerifyMoltbookPostInput>;
export type VerifyTxInput = z.infer<typeof VerifyTxInput>;
export type VerifyWalletInput = z.infer<typeof VerifyWalletInput>;
export type GenerateProofCardInput = z.infer<typeof GenerateProofCardInput>;
export type AttestReportInput = z.infer<typeof AttestReportInput>;

export interface XFlightConfig {
  apiUrl: string;
  contractAddress?: string;
  privateKey?: string;
  rpcUrl?: string;
  openaiApiKey?: string;
}

let config: XFlightConfig = {
  apiUrl: process.env.XFLIGHT_API_URL || "http://localhost:3000",
};

export function configure(cfg: Partial<XFlightConfig>) {
  config = { ...config, ...cfg };
}

async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.apiUrl}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`xflight API error: ${res.status} ${(errBody as Record<string, string>).error || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${config.apiUrl}${endpoint}`);
  if (!res.ok) {
    throw new Error(`xflight API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function verifyMoltbookPost(
  input: VerifyMoltbookPostInput
): Promise<Record<string, unknown>> {
  const parsed = VerifyMoltbookPostInput.parse(input);
  return apiPost("/api/verify", { url: parsed.url, useAI: false });
}

export async function verifyTx(
  input: VerifyTxInput
): Promise<Record<string, unknown>> {
  const parsed = VerifyTxInput.parse(input);
  return apiPost("/api/tx", { txHash: parsed.txHash });
}

export async function verifyWallet(
  input: VerifyWalletInput
): Promise<Record<string, unknown>> {
  const parsed = VerifyWalletInput.parse(input);
  return apiPost("/api/wallet", { address: parsed.address });
}

export async function generateProofCard(
  input: GenerateProofCardInput
): Promise<Record<string, unknown>> {
  const parsed = GenerateProofCardInput.parse(input);
  return apiGet(`/api/proof/${parsed.reportId}`);
}

export async function attestReportSkill(
  input: AttestReportInput
): Promise<Record<string, unknown>> {
  const parsed = AttestReportInput.parse(input);
  return apiPost("/api/attest", { reportId: parsed.reportId });
}

export const xflight = {
  configure,
  verify_moltbook_post: verifyMoltbookPost,
  verify_tx: verifyTx,
  verify_wallet: verifyWallet,
  generate_proof_card: generateProofCard,
  attest_report: attestReportSkill,
};

export default xflight;
