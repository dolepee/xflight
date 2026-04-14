import { NextRequest, NextResponse } from "next/server";
import { fetchPostFromUrl } from "@/lib/moltbook";
import { extractClaims, type ExtractedClaims } from "@/lib/claims";
import { calculateFlightScore, VerificationResult } from "@/lib/flightScorer";
import { generateReportId, generateReportHash, saveReport, XFlightReport } from "@/lib/reportStore";
import { attestReport } from "@/lib/attestation";
import { verifyWalletOnChain, verifyContractOnChain, getWalletTxSample } from "@/lib/xlayerVerifier";
import { XLAYER_EXPLORER } from "@/lib/chains";
import { generateAIAnalysis } from "@/lib/aiAnalysis";
import {
  getOnchainOSPortfolio,
  hasOnchainOSCredentials,
  describeOnchainOSUsage,
} from "@/lib/onchainos";

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

    const input = url.trim();

    // Detect input type: wallet address, tx hash, or Moltbook URL/text
    const isWallet = WALLET_RE.test(input);
    const isTxHash = TX_RE.test(input);

    let post;
    let claims;

    if (isWallet) {
      // Direct wallet verification: synthesize a post from the address
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
      claims = { rawText: `Wallet: ${input}`, walletAddress: input } as ExtractedClaims & Record<string, unknown>;
    } else if (isTxHash) {
      // Direct tx verification: synthesize a post from the hash
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
      claims = { rawText: `TX: ${input}`, transactionHash: input } as ExtractedClaims & Record<string, unknown>;
    } else {
      // Moltbook URL or freeform text
      post = await fetchPostFromUrl(input);
      if (!post) {
        return NextResponse.json({ error: "Could not fetch post" }, { status: 404 });
      }
      claims = await extractClaims(post.content, useAI ?? false);
    }

    if (!claims) {
      claims = await extractClaims(post.content, useAI ?? false);
    }

    // Cast common fields for type safety
    const walletAddr = String(claims.walletAddress || "");
    const txCount = Number(claims.transactionCount || 0) || null;
    const contractAddr = String(claims.deployedContract || "");
    const txHash = String((claims as Record<string, unknown>).transactionHash || "");

    // ── Real on chain verification ──
    const verifications: VerificationResult[] = [];

    // Verify wallet
    if (walletAddr && WALLET_RE.test(walletAddr)) {
      try {
        const walletResult = await verifyWalletOnChain(walletAddr);
        if (walletResult.hasActivity) {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "verified",
            detail: `Wallet exists with ${walletResult.txCount} transactions and ${walletResult.balanceFormatted} OKB balance`,
            source: `${XLAYER_EXPLORER}/address/${walletAddr}`,
          });
        } else if (walletResult.exists) {
          verifications.push({
            claim: "Wallet on X Layer",
            status: "partial",
            detail: `Wallet exists on X Layer but has no transaction history (balance: ${walletResult.balanceFormatted} OKB)`,
            source: `${XLAYER_EXPLORER}/address/${walletAddr}`,
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
            });
          } else if (ratio <= 5) {
            verifications.push({
              claim: `Transaction count (${txCount} claimed)`,
              status: "partial",
              detail: `Wallet nonce is ${realTxCount}, claimed ${txCount} is higher but within range (may include internal txs)`,
            });
          } else {
            verifications.push({
              claim: `Transaction count (${txCount} claimed)`,
              status: "contradicted",
              detail: `Wallet nonce is ${realTxCount} but post claims ${txCount} transactions`,
            });
          }
        } else {
          verifications.push({
            claim: `Transaction count (${txCount} claimed)`,
            status: "unverified",
            detail: "Wallet has no outgoing transactions on X Layer",
          });
        }
      } catch {
        // Fall through, scorer will handle missing verification
      }
    }

    // Verify deployed contract
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

    // Verify transaction hash if provided
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
          });
          // If we got a sender from the tx, also verify that wallet
          if (txResult.from && !walletAddr) {
            claims.walletAddress = txResult.from;
            const walletResult = await verifyWalletOnChain(txResult.from);
            if (walletResult.hasActivity) {
              verifications.push({
                claim: "Sender wallet on X Layer",
                status: "verified",
                detail: `Sender has ${walletResult.txCount} transactions and ${walletResult.balanceFormatted} OKB`,
                source: `${XLAYER_EXPLORER}/address/${txResult.from}`,
              });
            }
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

    // ── OnchainOS skill evidence (okx-wallet-portfolio) ──
    // When OKX credentials are set, read the wallet portfolio via OnchainOS
    // and attach the response as first-hand evidence the agent integrates
    // with OKX DEX/Wallet skills on X Layer.
    if (walletAddr && WALLET_RE.test(walletAddr) && hasOnchainOSCredentials()) {
      try {
        const snap = await getOnchainOSPortfolio(walletAddr);
        if (snap && snap.assets.length > 0) {
          verifications.push({
            claim: "OnchainOS wallet portfolio",
            status: "verified",
            detail: `OKX Wallet Portfolio API returned ${snap.assets.length} assets, total value ~$${snap.totalValueUsd}`,
            source: `${XLAYER_EXPLORER}/address/${walletAddr}`,
          });
        } else if (snap) {
          verifications.push({
            claim: "OnchainOS wallet portfolio",
            status: "partial",
            detail: "OnchainOS responded but wallet has no tracked assets on X Layer",
          });
        }
      } catch {
        // Soft-fail: OnchainOS unavailable; scorer still works on claim text.
      }
    }

    // Score with real verifications
    const scoreResult = calculateFlightScore(claims, verifications);

    // AI analysis: generate detailed reasoning from the deterministic results
    const aiExplanation = await generateAIAnalysis({
      claims: claims as ExtractedClaims,
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
      onchainos: describeOnchainOSUsage(),
      explorerUrl: fullReport.txHash ? `${XLAYER_EXPLORER}/tx/${fullReport.txHash}` : null,
      proofUrl: `/proof/${reportId}`,
    });
  } catch (err) {
    console.error("[/api/verify] Error:", err);
    return NextResponse.json({ error: "Verification failed", detail: String(err) }, { status: 500 });
  }
}
