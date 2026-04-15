export interface VerificationResult {
  claim: string;
  status: "verified" | "unverified" | "partial" | "contradicted";
  detail: string;
  source?: string;
  evidence?: Record<string, string | number | boolean | null>;
}

export interface FlightScoreResult {
  score: number;
  verdict: "strongly_verified" | "mostly_verified" | "partially_verified" | "weak_proof" | "unverified";
  breakdown: { category: string; points: number; max: number; reason: string }[];
  results: VerificationResult[];
  explanation: string;
}

function findVerification(results: VerificationResult[], keyword: string): VerificationResult | undefined {
  return results.find((r) => r.claim.toLowerCase().includes(keyword.toLowerCase()));
}

function statusPoints(status: VerificationResult["status"] | undefined, full: number, partial: number): number {
  if (status === "verified") return full;
  if (status === "partial") return partial;
  return 0;
}

function evidenceNumber(result: VerificationResult | undefined, key: string): number {
  const value = result?.evidence?.[key];
  return typeof value === "number" ? value : 0;
}

export function calculateFlightScore(
  claims: Record<string, unknown>,
  verifications: VerificationResult[]
): FlightScoreResult {
  let score = 0;
  const breakdown: FlightScoreResult["breakdown"] = [];
  const results: VerificationResult[] = [...verifications];

  const walletClaim = claims.walletAddress as string | null;
  const txCountClaim = claims.transactionCount as number | null;
  const pnlClaim = claims.claimedPnl as number | null;
  const onchainosClaim = claims.onchainosUsed as boolean | null;
  const githubClaim = claims.githubUrl as string | null;
  const contractClaim = claims.deployedContract as string | null;
  const demoClaim = claims.liveDemoUrl as string | null;
  const chainClaim = claims.deploymentChain as string | null;
  const uniswapClaim = claims.uniswapUsed as boolean | null;

  const walletV = findVerification(results, "wallet");
  const txV = findVerification(results, "transaction count");
  const contractV = findVerification(results, "contract");
  const onchainosV = findVerification(results, "onchainos");
  const dexQuoteV = findVerification(results, "dex quote");
  const portfolioV = findVerification(results, "portfolio");

  // 30 pts: X Layer proof
  let xlayerPts = 0;
  xlayerPts += statusPoints(walletV?.status, 10, 5);
  xlayerPts += statusPoints(txV?.status, 10, 5);
  xlayerPts += statusPoints(contractV?.status, 10, 5);

  if (!walletV && walletClaim) {
    results.push({ claim: "Wallet on X Layer", status: "unverified", detail: "Wallet address provided but could not be checked on chain" });
  }
  if (!txV && txCountClaim && txCountClaim > 0) {
    results.push({ claim: `Transaction count (${txCountClaim}+ txs)`, status: "unverified", detail: "Transaction count claimed but not verified on chain" });
  }
  if (!contractV && contractClaim) {
    results.push({ claim: `Contract deployment (${contractClaim.slice(0, 10)}...)`, status: "unverified", detail: "Contract address provided but not verified on chain" });
  }

  const evidenceParts = [
    walletV?.status === "verified" && "wallet verified",
    txV?.status === "verified" && "tx count confirmed",
    contractV?.status === "verified" && "contract live",
  ].filter(Boolean);
  breakdown.push({
    category: "X Layer Proof",
    points: Math.min(xlayerPts, 30),
    max: 30,
    reason: evidenceParts.length > 0
      ? `On chain evidence: ${evidenceParts.join(", ")}`
      : xlayerPts > 0
      ? "Partial on chain evidence found"
      : "No verifiable on chain evidence found",
  });
  score += Math.min(xlayerPts, 30);

  // 20 pts: Claim consistency
  let matchPts = 0;
  if (walletClaim && /^0x[a-fA-F0-9]{40}$/.test(walletClaim)) matchPts += 6;
  if (contractClaim && /^0x[a-fA-F0-9]{40}$/.test(contractClaim)) matchPts += 4;
  if (githubClaim) matchPts += 4;
  if (demoClaim) matchPts += 3;
  if (chainClaim && /x\s*layer|xlayer/i.test(chainClaim)) matchPts += 3;
  breakdown.push({
    category: "Claim Consistency",
    points: Math.min(matchPts, 20),
    max: 20,
    reason: [
      walletClaim && "wallet format present",
      contractClaim && "contract format present",
      githubClaim && "GitHub linked",
      demoClaim && "demo linked",
      chainClaim && `chain stated as ${chainClaim}`,
    ].filter(Boolean).join(", ") || "Claims are sparse or poorly specified",
  });
  score += Math.min(matchPts, 20);

  // 15 pts: OnchainOS / Uniswap evidence
  let skillPts = 0;
  skillPts += statusPoints(onchainosV?.status, 8, 4);
  if (dexQuoteV?.status === "verified") skillPts += 4;
  if (portfolioV?.status === "verified") skillPts += 3;
  if (skillPts === 0 && (onchainosClaim || uniswapClaim)) {
    results.push({
      claim: "Claimed skill usage",
      status: "unverified",
      detail: "Build post mentions OnchainOS or Uniswap, but no direct evidence was recovered",
    });
  }
  const skillReasons: string[] = [];
  if (onchainosV?.status === "verified") skillReasons.push("OnchainOS usage verified");
  else if (onchainosClaim) skillReasons.push("OnchainOS only claimed");
  if (dexQuoteV?.status === "verified") skillReasons.push("DEX quote confirmed");
  if (portfolioV?.status === "verified") skillReasons.push("wallet portfolio verified");
  if (uniswapClaim && !dexQuoteV) skillReasons.push("Uniswap only claimed");

  breakdown.push({
    category: "OnchainOS / Uniswap Evidence",
    points: Math.min(skillPts, 15),
    max: 15,
    reason: skillReasons.length > 0 ? skillReasons.join(", ") : "No direct OnchainOS/Uniswap evidence found",
  });
  score += Math.min(skillPts, 15);

  // 15 pts: Execution continuity
  const realTxCount = Math.max(
    evidenceNumber(txV, "txCount"),
    evidenceNumber(walletV, "txCount")
  );
  let continuityPts = 0;
  if (realTxCount >= 10) continuityPts = 15;
  else if (realTxCount >= 3) continuityPts = 8;
  else if (realTxCount > 0) continuityPts = 3;

  breakdown.push({
    category: "Execution Continuity",
    points: continuityPts,
    max: 15,
    reason: realTxCount > 0
      ? `${realTxCount} transactions confirmed on chain`
      : txCountClaim
      ? `${txCountClaim} transactions claimed (not independently verified)`
      : "No transaction count provided",
  });
  score += continuityPts;

  // 10 pts: Proof completeness
  let completenessPts = 0;
  if (githubClaim) completenessPts += 4;
  if (demoClaim) completenessPts += 4;
  if (walletClaim || contractClaim) completenessPts += 2;
  breakdown.push({
    category: "Proof Completeness",
    points: completenessPts,
    max: 10,
    reason: [githubClaim && "GitHub", demoClaim && "demo", (walletClaim || contractClaim) && "on chain identifier"].filter(Boolean).join(", ") || "No supplementary links provided",
  });
  score += completenessPts;

  // 10 pts: Risk hygiene
  let hygienePts = 10;
  const hygieneReasons: string[] = [];
  if (pnlClaim && pnlClaim > 1000000) {
    hygienePts -= 4;
    hygieneReasons.push(`large PnL ($${pnlClaim.toLocaleString()}) not independently verified`);
    if (!findVerification(results, "pnl")) {
      results.push({ claim: `PnL claim ($${pnlClaim.toLocaleString()})`, status: "unverified", detail: "PnL is not independently reconstructed from chain data" });
    }
  }
  if (txCountClaim && txCountClaim > 10000) {
    hygienePts -= 3;
    hygieneReasons.push(`very high tx count (${txCountClaim})`);
  }
  if (!walletClaim && !contractClaim) {
    hygienePts -= 3;
    hygieneReasons.push("no wallet or contract provided");
  }
  if (realTxCount > 0 && txCountClaim && txCountClaim > realTxCount * 5) {
    hygienePts -= 3;
    hygieneReasons.push(`claimed ${txCountClaim} txs but only ${realTxCount} were evidenced`);
    const existing = findVerification(results, "transaction count mismatch");
    if (!existing) {
      results.push({ claim: "Transaction count mismatch", status: "contradicted", detail: `Claimed ${txCountClaim} but only ${realTxCount} were supported by on chain evidence` });
    }
  }

  breakdown.push({
    category: "Risk Hygiene",
    points: Math.max(hygienePts, 0),
    max: 10,
    reason: hygieneReasons.length > 0 ? hygieneReasons.join("; ") : "No obvious suspicious signals",
  });
  score += Math.max(hygienePts, 0);

  score = Math.min(100, Math.max(0, score));

  let verdict: FlightScoreResult["verdict"];
  if (score >= 85) verdict = "strongly_verified";
  else if (score >= 70) verdict = "mostly_verified";
  else if (score >= 50) verdict = "partially_verified";
  else if (score >= 25) verdict = "weak_proof";
  else verdict = "unverified";

  const explanations: Record<string, string> = {
    strongly_verified: "Multiple independent on chain evidence sources confirmed the core claims.",
    mostly_verified: "Core claims have strong supporting evidence, with limited unresolved gaps.",
    partially_verified: "Some claims can be verified, but meaningful parts remain unconfirmed.",
    weak_proof: "Evidence is thin and relies heavily on unverified claims.",
    unverified: "No reliable evidence was found for the core claims.",
  };

  return { score, verdict, breakdown, results, explanation: explanations[verdict] };
}
