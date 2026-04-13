import { NextRequest, NextResponse } from "next/server";
import { fetchPostFromUrl } from "@/lib/moltbook";
import { extractClaims } from "@/lib/claims";
import { calculateFlightScore, VerificationResult } from "@/lib/flightScorer";
import { generateReportId, generateReportHash, saveReport, XFlightReport } from "@/lib/reportStore";
import { attestReport } from "@/lib/attestation";
import { verifyWalletOnChain, verifyContractOnChain, getWalletTxSample } from "@/lib/xlayerVerifier";
import { XLAYER_EXPLORER } from "@/lib/chains";
import { generateAIAnalysis } from "@/lib/aiAnalysis";

export const runtime = "nodejs";

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_RE = /^0x[a-fA-F0-9]{64}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, useAI } = body as { url: string; useAI?: boolean };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Fetch post content
    const post = await fetchPostFromUrl(url);
    if (!post) {
      return NextResponse.json({ error: "Could not fetch post" }, { status: 404 });
    }

    // Extract claims from post text
    const claims = await extractClaims(post.content, useAI ?? false);

    // ── Real on chain verification ──
    const verifications: VerificationResult[] = [];

    // Verify wallet
    if (claims.walletAddress && WALLET_RE.test(claims.walletAddress)) {
      try {
        const walletResult = await verifyWalletOnChain(claims.walletAddress);
        if (walletResult.hasActivity) {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "verified",
            detail: `Wallet exists with ${walletResult.txCount} transactions and ${walletResult.balanceFormatted} OKB balance`,
            source: `${XLAYER_EXPLORER}/address/${claims.walletAddress}`,
          });
        } else if (walletResult.exists) {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "partial",
            detail: `Wallet exists on X Layer but has no transaction history (balance: ${walletResult.balanceFormatted} OKB)`,
            source: `${XLAYER_EXPLORER}/address/${claims.walletAddress}`,
          });
        } else {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "unverified",
            detail: "Wallet address has no balance or activity on X Layer",
          });
        }
      } catch {
        verifications.push({
          claim: "Wallet on X Layer",
          status: "unverified",
          detail: "Could not verify wallet, RPC call failed",
        });
      }
    }

    // Verify transaction count against wallet nonce
    if (claims.walletAddress && WALLET_RE.test(claims.walletAddress) && claims.transactionCount) {
      try {
        const realTxCount = await getWalletTxSample(claims.walletAddress);
        if (realTxCount > 0) {
          const ratio = claims.transactionCount / realTxCount;
          if (ratio <= 2) {
            verifications.push({
              claim: `Transaction count (${claims.transactionCount} claimed)`,
              status: "verified",
              detail: `Wallet nonce is ${realTxCount}, consistent with claimed ${claims.transactionCount} transactions`,
            });
          } else if (ratio <= 5) {
            verifications.push({
              claim: `Transaction count (${claims.transactionCount} claimed)`,
              status: "partial",
              detail: `Wallet nonce is ${realTxCount}, claimed ${claims.transactionCount} is higher but within range (may include internal txs)`,
            });
          } else {
            verifications.push({
              claim: `Transaction count (${claims.transactionCount} claimed)`,
              status: "contradicted",
              detail: `Wallet nonce is ${realTxCount} but post claims ${claims.transactionCount} transactions`,
            });
          }
        } else {
          verifications.push({
            claim: `Transaction count (${claims.transactionCount} claimed)`,
            status: "unverified",
            detail: "Wallet has no outgoing transactions on X Layer",
          });
        }
      } catch {
        // Fall through, scorer will handle missing verification
      }
    }

    // Verify deployed contract
    if (claims.deployedContract && WALLET_RE.test(claims.deployedContract)) {
      try {
        const contractResult = await verifyContractOnChain(claims.deployedContract);
        if (contractResult.hasCode) {
          verifications.push({
            claim: `Contract deployment (${claims.deployedContract.slice(0, 10)}...)`,
            status: "verified",
            detail: "Contract bytecode confirmed on X Layer",
            source: `${XLAYER_EXPLORER}/address/${claims.deployedContract}`,
          });
        } else {
          verifications.push({
            claim: `Contract deployment (${claims.deployedContract.slice(0, 10)}...)`,
            status: "unverified",
            detail: "No contract code found at this address on X Layer",
          });
        }
      } catch {
        verifications.push({
          claim: `Contract deployment (${claims.deployedContract.slice(0, 10)}...)`,
          status: "unverified",
          detail: "Could not verify contract, RPC call failed",
        });
      }
    }

    // Score with real verifications
    const scoreResult = calculateFlightScore(claims, verifications);

    // AI analysis: generate detailed reasoning from the deterministic results
    const aiExplanation = await generateAIAnalysis({
      claims,
      verifications: scoreResult.results,
      score: scoreResult.score,
      verdict: scoreResult.verdict,
      breakdown: scoreResult.breakdown,
      postText: post.content,
    });

    // Build report
    const reportId = generateReportId();
    const reportData = {
      id: reportId,
      projectUrl: url,
      score: scoreResult.score,
      verdict: scoreResult.verdict,
      claims,
      verificationResults: scoreResult.results,
      flightScoreBreakdown: scoreResult.breakdown,
      explanation: aiExplanation || scoreResult.explanation,
      timestamp: new Date().toISOString(),
      verifier: "XFlight BlackBox v0.1",
    };
    const reportHash = generateReportHash(reportData);
    const fullReport: XFlightReport = { ...reportData, reportHash };

    // On chain attestation
    const contractAddress = process.env.XFLIGHT_CONTRACT_ADDRESS;
    const privateKey = process.env.ATTESTER_PRIVATE_KEY;
    let attestation: Record<string, unknown> = {};

    if (contractAddress && privateKey && contractAddress.length === 42) {
      const reportURI = `${process.env.NEXT_PUBLIC_BASE_URL || "https://xflight.vercel.app"}/proof/${reportId}`;
      const result = await attestReport(reportId, reportHash, scoreResult.score, reportURI, contractAddress, privateKey);
      if (result.success) {
        fullReport.txHash = result.txHash;
        fullReport.blockNumber = result.blockNumber;
        attestation = {
          success: true,
          txHash: result.txHash,
          explorerUrl: result.txHash ? `${XLAYER_EXPLORER}/tx/${result.txHash}` : null,
        };
      } else {
        attestation = { success: false, error: result.error };
      }
    } else {
      attestation = { success: false, note: "Contract not deployed or wallet not configured. Deploy with: npm run deploy" };
    }

    saveReport(fullReport);

    return NextResponse.json({
      reportId,
      reportHash,
      score: scoreResult.score,
      verdict: scoreResult.verdict,
      explanation: aiExplanation || scoreResult.explanation,
      breakdown: scoreResult.breakdown,
      claims,
      verificationResults: scoreResult.results,
      attestation,
      explorerUrl: fullReport.txHash ? `${XLAYER_EXPLORER}/tx/${fullReport.txHash}` : null,
      proofUrl: `/proof/${reportId}`,
    });
  } catch (err) {
    console.error("[/api/verify] Error:", err);
    return NextResponse.json({ error: "Verification failed", detail: String(err) }, { status: 500 });
  }
}
