export interface VerificationResult {
  claim: string;
  status: "verified" | "unverified" | "partial" | "contradicted";
  detail: string;
  source?: string;
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

  // ── 30 pts: X Layer proof (real on chain evidence) ──
  let xlayerPts = 0;
  const walletV = findVerification(results, "wallet");
  const txV = findVerification(results, "transaction");
  const contractV = findVerification(results, "contract");

  if (walletV) {
    if (walletV.status === "verified") xlayerPts += 10;
    else if (walletV.status === "partial") xlayerPts += 5;
  } else if (walletClaim) {
    results.push({ claim: "Wallet on X Layer", status: "unverified", detail: "Wallet address provided but could not be checked on chain" });
  }

  if (txV) {
    if (txV.status === "verified") xlayerPts += 10;
    else if (txV.status === "partial") xlayerPts += 5;
  } else if (txCountClaim && txCountClaim > 0) {
    results.push({ claim: `Transaction count (${txCountClaim}+ txs)`, status: "unverified", detail: "Transaction count claimed but not verified on chain" });
  }

  if (contractV) {
    if (contractV.status === "verified") xlayerPts += 10;
    else if (contractV.status === "partial") xlayerPts += 5;
  } else if (contractClaim) {
    results.push({ claim: `Contract deployment (${contractClaim.slice(0, 10)}...)`, status: "unverified", detail: "Contract address provided but not verified on chain" });
  }

  const xlayerMax = 30;
  const evidenceParts = [
    walletV?.status === "verified" && "wallet verified",
    txV?.status === "verified" && "txs confirmed",
    contractV?.status === "verified" && "contract live",
  ].filter(Boolean);
  breakdown.push({
    category: "X Layer Proof",
    points: Math.min(xlayerPts, xlayerMax),
    max: xlayerMax,
    reason: evidenceParts.length > 0
      ? `On chain evidence: ${evidenceParts.join(", ")}`
      : xlayerPts > 0
      ? "Partial on chain evidence found"
      : "No verifiable on chain evidence found",
  });
  score += Math.min(xlayerPts, xlayerMax);

  // ── 20 pts: Claim consistency ──
  let matchPts = 0;
  if (walletClaim && /^0x[a-fA-F0-9]{40}$/.test(walletClaim)) matchPts += 8;
  if (contractClaim && /^0x[a-fA-F0-9]{40}$/.test(contractClaim)) matchPts += 6;
  if (claims.deploymentChain) matchPts += 6;
  breakdown.push({
    category: "Claim Consistency",
    points: Math.min(matchPts, 20),
    max: 20,
    reason: walletClaim
      ? `Wallet ${walletClaim.slice(0, 10)}...${walletClaim.slice(-4)} provided, format ${/^0x[a-fA-F0-9]{40}$/.test(walletClaim) ? "valid" : "invalid"}`
      : "No wallet address provided",
  });
  score += Math.min(matchPts, 20);

  // ── 15 pts: OnchainOS / Uniswap evidence ──
  let skillPts = 0;
  const onchainosV = findVerification(results, "onchainos");
  const dexQuoteV = findVerification(results, "dex quote");
  const portfolioV = findVerification(results, "portfolio");

  if (onchainosV?.status === "verified") skillPts += 8;
  else if (onchainosV?.status === "partial") skillPts += 4;
  else if (onchainosClaim) {
    skillPts += 3;
    if (!onchainosV) {
      results.push({ claim: "OnchainOS usage", status: "unverified", detail: "OnchainOS claimed in post; set OKX_* to enable live skill verification" });
    }
  }
  if (dexQuoteV?.status === "verified" || portfolioV?.status === "verified") skillPts += 4;
  if (claims.uniswapUsed) skillPts += 3;

  const skillReasons: string[] = [];
  if (onchainosV?.status === "verified") skillReasons.push("OnchainOS skills live");
  else if (onchainosClaim) skillReasons.push("OnchainOS claimed");
  if (dexQuoteV?.status === "verified") skillReasons.push("DEX quote confirmed");
  if (portfolioV?.status === "verified") skillReasons.push("wallet portfolio read");
  if (claims.uniswapUsed) skillReasons.push("Uniswap referenced");

  breakdown.push({
    category: "OnchainOS / Uniswap Evidence",
    points: Math.min(skillPts, 15),
    max: 15,
    reason: skillReasons.length > 0 ? skillReasons.join(", ") : "No OnchainOS/Uniswap usage detected",
  });
  score += Math.min(skillPts, 15);

  // ── 15 pts: Execution continuity ──
  let continuityPts = 0;
  const realTxCount = txV?.status === "verified" ? parseInt(txV.detail.match(/(\d+)/)?.[1] || "0") : 0;
  const effectiveTxCount = realTxCount > 0 ? realTxCount : txCountClaim || 0;

  if (effectiveTxCount >= 10) continuityPts = 15;
  else if (effectiveTxCount >= 3) continuityPts = 8;
  else if (effectiveTxCount > 0) continuityPts = 3;

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

  // ── 10 pts: Proof completeness ──
  let completenessPts = 0;
  if (githubClaim) completenessPts += 4;
  if (demoClaim) completenessPts += 4;
  if (pnlClaim) completenessPts += 2;
  breakdown.push({
    category: "Proof Completeness",
    points: completenessPts,
    max: 10,
    reason: [githubClaim && "GitHub", demoClaim && "demo", pnlClaim && "PnL"].filter(Boolean).join(", ") || "No supplementary links provided",
  });
  score += completenessPts;

  // ── 10 pts: Risk hygiene ──
  let hygienePts = 10;
  let hygieneReason = "No obvious suspicious signals";
  if (pnlClaim && pnlClaim > 1000000) {
    hygienePts -= 4;
    hygieneReason = `Large PnL ($${pnlClaim.toLocaleString()}) unverifiable without full tx history`;
    if (!findVerification(results, "pnl")) {
      results.push({ claim: `PnL claim ($${pnlClaim.toLocaleString()})`, status: "unverified", detail: "PnL not independently verifiable from on chain data" });
    }
  }
  if (txCountClaim && txCountClaim > 10000) {
    hygienePts -= 3;
    hygieneReason += `; very high tx count (${txCountClaim}) flagged`;
  }
  if (!walletClaim && !contractClaim) {
    hygienePts -= 3;
    hygieneReason += "; no wallet or contract provided";
  }
  // Check for contradictions: claimed tx count vs actual
  if (realTxCount > 0 && txCountClaim && txCountClaim > realTxCount * 5) {
    hygienePts -= 3;
    hygieneReason += `; claimed ${txCountClaim} txs but only ${realTxCount} found on chain`;
    const existing = findVerification(results, "transaction");
    if (existing && existing.status !== "contradicted") {
      results.push({ claim: "Transaction count mismatch", status: "contradicted", detail: `Claimed ${txCountClaim} but wallet nonce is ${realTxCount}` });
    }
  }
  breakdown.push({
    category: "Risk Hygiene",
    points: Math.max(hygienePts, 0),
    max: 10,
    reason: hygieneReason,
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
    strongly_verified: "Multiple independent on chain evidence sources confirmed.",
    mostly_verified: "Core claims have on chain or supplementary evidence.",
    partially_verified: "Some claims can be verified; others remain unconfirmed.",
    weak_proof: "Limited evidence; most claims remain unverified.",
    unverified: "No verifiable on chain evidence found for claims.",
  };

  return { score, verdict, breakdown, results, explanation: explanations[verdict] };
}
