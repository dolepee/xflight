import { NextRequest, NextResponse } from "next/server";
import { fetchPostFromUrl } from "@/lib/moltbook";
import { extractClaims, type ExtractedClaims } from "@/lib/claims";
import { calculateFlightScore, type VerificationResult } from "@/lib/flightScorer";
import { buildProofUrl } from "@/lib/reportCodec";
import { generateReportId, generateReportHash, saveReport, type XFlightReport } from "@/lib/reportStore";
import { attestReport } from "@/lib/attestation";
import { verifyWalletOnChain, verifyContractOnChain, getWalletTxSample } from "@/lib/xlayerVerifier";
import { XLAYER_EXPLORER } from "@/lib/chains";
import { generateAIAnalysis } from "@/lib/aiAnalysis";
import { getOnchainOSPortfolio, hasOnchainOSCredentials } from "@/lib/onchainos";

export const runtime = "nodejs";

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_RE = /^0x[a-fA-F0-9]{64}$/;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, useAI } = body as { url: string; useAI?: boolean };

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const input = url.trim();
    const isWallet = WALLET_RE.test(input);
    const isTxHash = TX_RE.test(input);

    let post;
    let claims: (ExtractedClaims & Record<string, unknown>) | null = null;

    if (isWallet) {
      post = {
        id: `wallet-${input.slice(0, 10)}`,
        url: `https://www.oklink.com/xlayer/address/${input}`,
        author: "Direct Wallet Check",
        title: "Wallet Verification",
        content: `Wallet address: ${input}\nDirect wallet verification on X Layer.`,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        type: "buildx" as const,
      };
      claims = { rawText: `Wallet: ${input}`, walletAddress: input };
    } else if (isTxHash) {
      post = {
        id: `tx-${input.slice(0, 10)}`,
        url: `https://www.oklink.com/xlayer/tx/${input}`,
        author: "Direct TX Check",
        title: "Transaction Verification",
        content: `Transaction hash: ${input}\nDirect transaction verification on X Layer.`,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        type: "buildx" as const,
      };
      claims = { rawText: `TX: ${input}`, transactionHash: input };
    } else if (isHttpUrl(input)) {
      post = await fetchPostFromUrl(input);
      if (!post) {
        return NextResponse.json({ error: "Could not fetch source content from the provided URL" }, { status: 502 });
      }
      claims = await extractClaims(post.content, useAI ?? false);
    } else {
      post = {
        id: `text-${Date.now()}`,
        url: "raw-text-input",
        author: "Direct Text Check",
        title: "Raw BuildX Text",
        content: input,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        type: "buildx" as const,
      };
      claims = await extractClaims(input, useAI ?? false);
    }

    if (!claims) {
      claims = await extractClaims(post.content, useAI ?? false);
    }

    const walletAddr = String(claims.walletAddress || "");
    const txCount = Number(claims.transactionCount || 0) || null;
    const contractAddr = String(claims.deployedContract || "");
    const txHash = String((claims as Record<string, unknown>).transactionHash || "");

    const verifications: VerificationResult[] = [];

    if (walletAddr && WALLET_RE.test(walletAddr)) {
      try {
        const walletResult = await verifyWalletOnChain(walletAddr);
        if (walletResult.hasActivity) {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "verified",
            detail: `Wallet exists with ${walletResult.txCount} transactions and ${walletResult.balanceFormatted} OKB balance`,
            source: `${XLAYER_EXPLORER}/address/${walletAddr}`,
            evidence: { txCount: walletResult.txCount, balanceOkb: walletResult.balanceFormatted },
          });
        } else if (walletResult.exists) {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "partial",
            detail: `Wallet exists on X Layer but has no transaction history (balance: ${walletResult.balanceFormatted} OKB)`,
            source: `${XLAYER_EXPLORER}/address/${walletAddr}`,
            evidence: { txCount: walletResult.txCount, balanceOkb: walletResult.balanceFormatted },
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

    if (walletAddr && WALLET_RE.test(walletAddr) && txCount) {
      try {
        const realTxCount = await getWalletTxSample(walletAddr);
        if (realTxCount > 0) {
          const ratio = txCount / realTxCount;
          if (ratio <= 2) {
            verifications.push({
              claim: `Transaction count (${txCount} claimed)`,
              status: "verified",
              detail: `Wallet nonce is ${realTxCount}, consistent with claimed ${txCount} transactions`,
              evidence: { txCount: realTxCount },
            });
          } else if (ratio <= 5) {
            verifications.push({
              claim: `Transaction count (${txCount} claimed)`,
              status: "partial",
              detail: `Wallet nonce is ${realTxCount}, claimed ${txCount} is higher but within range (may include internal txs)`,
              evidence: { txCount: realTxCount },
            });
          } else {
            verifications.push({
              claim: `Transaction count (${txCount} claimed)`,
              status: "contradicted",
              detail: `Wallet nonce is ${realTxCount} but post claims ${txCount} transactions`,
              evidence: { txCount: realTxCount },
            });
          }
        } else {
          verifications.push({
            claim: `Transaction count (${txCount} claimed)`,
            status: "unverified",
            detail: "Wallet has no outgoing transactions on X Layer",
            evidence: { txCount: 0 },
          });
        }
      } catch {
        verifications.push({
          claim: `Transaction count (${txCount} claimed)`,
          status: "unverified",
          detail: "Could not independently verify transaction count",
        });
      }
    }

    if (contractAddr && WALLET_RE.test(contractAddr)) {
      try {
        const contractResult = await verifyContractOnChain(contractAddr);
        if (contractResult.hasCode) {
          verifications.push({
            claim: `Contract deployment (${contractAddr.slice(0, 10)}...)`,
            status: "verified",
            detail: "Contract bytecode confirmed on X Layer",
            source: `${XLAYER_EXPLORER}/address/${contractAddr}`,
          });
        } else {
          verifications.push({
            claim: `Contract deployment (${contractAddr.slice(0, 10)}...)`,
            status: "unverified",
            detail: "No contract code found at this address on X Layer",
          });
        }
      } catch {
        verifications.push({
          claim: `Contract deployment (${contractAddr.slice(0, 10)}...)`,
          status: "unverified",
          detail: "Could not verify contract, RPC call failed",
        });
      }
    }

    if (txHash && TX_RE.test(txHash)) {
      try {
        const { verifyTransactionOnChain } = await import("@/lib/xlayerVerifier");
        const txResult = await verifyTransactionOnChain(txHash);
        if (txResult.exists && txResult.status === "success") {
          verifications.push({
            claim: "Transaction on X Layer",
            status: "verified",
            detail: `Transaction confirmed in block ${txResult.blockNumber}, from ${txResult.from?.slice(0, 10)}... to ${txResult.to?.slice(0, 10) || "contract creation"}...`,
            source: `${XLAYER_EXPLORER}/tx/${txHash}`,
            evidence: { blockNumber: txResult.blockNumber ?? 0 },
          });
          if (txResult.from && !walletAddr) {
            claims.walletAddress = txResult.from;
          }
        } else if (txResult.exists) {
          verifications.push({
            claim: "Transaction on X Layer",
            status: "partial",
            detail: `Transaction found but status is ${txResult.status}`,
            source: `${XLAYER_EXPLORER}/tx/${txHash}`,
          });
        } else {
          verifications.push({
            claim: "Transaction on X Layer",
            status: "unverified",
            detail: "Transaction hash not found on X Layer",
          });
        }
      } catch {
        verifications.push({
          claim: "Transaction on X Layer",
          status: "unverified",
          detail: "Could not verify transaction, RPC call failed",
        });
      }
    }

    if (walletAddr && WALLET_RE.test(walletAddr) && hasOnchainOSCredentials()) {
      try {
        const snap = await getOnchainOSPortfolio(walletAddr);
        if (snap && snap.assets.length > 0) {
          verifications.push({
            claim: "OnchainOS wallet portfolio",
            status: "verified",
            detail: `OKX Wallet Portfolio API returned ${snap.assets.length} assets, total value ~$${snap.totalValueUsd}`,
            source: `${XLAYER_EXPLORER}/address/${walletAddr}`,
            evidence: { assetCount: snap.assets.length, totalValueUsd: snap.totalValueUsd },
          });
        } else if (snap) {
          verifications.push({
            claim: "OnchainOS wallet portfolio",
            status: "partial",
            detail: "OnchainOS responded but wallet has no tracked assets on X Layer",
            evidence: { assetCount: 0, totalValueUsd: snap.totalValueUsd },
          });
        }
      } catch {
        verifications.push({
          claim: "OnchainOS wallet portfolio",
          status: "unverified",
          detail: "Could not verify OnchainOS wallet usage",
        });
      }
    }

    const scoreResult = calculateFlightScore(claims, verifications);
    const aiExplanation = await generateAIAnalysis({
      claims: claims as ExtractedClaims,
      verifications: scoreResult.results,
      score: scoreResult.score,
      verdict: scoreResult.verdict,
      breakdown: scoreResult.breakdown,
      postText: post.content,
    });

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
      verifier: "XFlight BlackBox v0.2",
    };
    const reportHash = generateReportHash(reportData);
    const fullReport: XFlightReport = { ...reportData, reportHash };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://xflight.vercel.app";
    const proofUrl = buildProofUrl(baseUrl, fullReport);

    const contractAddress = process.env.XFLIGHT_CONTRACT_ADDRESS;
    const privateKey = process.env.ATTESTER_PRIVATE_KEY;
    let attestation: Record<string, unknown> = {};

    if (contractAddress && privateKey && contractAddress.length === 42) {
      const result = await attestReport(reportId, reportHash, scoreResult.score, proofUrl, contractAddress, privateKey);
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
      explorerUrl: attestation.explorerUrl,
      proofUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    );
  }
}
