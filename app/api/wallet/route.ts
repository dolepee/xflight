import { NextRequest, NextResponse } from "next/server";
import { verifyWalletOnChain, verifyContractOnChain } from "@/lib/xlayerVerifier";
import { XLAYER_EXPLORER } from "@/lib/chains";

export const runtime = "nodejs";

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body as { address: string };

    if (!address || !WALLET_RE.test(address)) {
      return NextResponse.json({ error: "Valid 0x address is required" }, { status: 400 });
    }

    const [walletResult, contractResult] = await Promise.all([
      verifyWalletOnChain(address),
      verifyContractOnChain(address),
    ]);

    return NextResponse.json({
      address,
      chain: "X Layer",
      chainId: 196,
      exists: walletResult.exists,
      balance: walletResult.balanceFormatted,
      txCount: walletResult.txCount,
      hasActivity: walletResult.hasActivity,
      isContract: contractResult.hasCode,
      explorerUrl: `${XLAYER_EXPLORER}/address/${address}`,
      verdict: walletResult.hasActivity
        ? "VERIFIED"
        : walletResult.exists
        ? "PARTIAL"
        : "UNVERIFIED",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
