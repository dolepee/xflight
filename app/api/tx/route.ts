import { NextRequest, NextResponse } from "next/server";
import { verifyTransactionOnChain } from "@/lib/xlayerVerifier";
import { XLAYER_EXPLORER } from "@/lib/chains";

export const runtime = "nodejs";

const TX_RE = /^0x[a-fA-F0-9]{64}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash } = body as { txHash: string };

    if (!txHash || !TX_RE.test(txHash)) {
      return NextResponse.json({ error: "Valid transaction hash is required" }, { status: 400 });
    }

    const result = await verifyTransactionOnChain(txHash);

    return NextResponse.json({
      txHash,
      chain: "X Layer",
      chainId: 196,
      exists: result.exists,
      status: result.status,
      from: result.from,
      to: result.to,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      explorerUrl: result.exists ? `${XLAYER_EXPLORER}/tx/${txHash}` : null,
      verdict: result.status === "success" ? "PASS" : result.status === "failed" ? "WARNING" : "FAILED",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
