import { NextRequest, NextResponse } from "next/server";
import { getOnchainOSPortfolio, hasOnchainOSCredentials } from "@/lib/onchainos";
import { verifyWalletOnChain } from "@/lib/xlayerVerifier";
import { XLAYER_EXPLORER } from "@/lib/chains";

export const runtime = "nodejs";

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * POST /api/portfolio  { address }
 *
 * Reads a wallet portfolio on X Layer. Prefers OKX Wallet Portfolio API
 * (OnchainOS skill `okx-wallet-portfolio`). Falls back to a native-balance
 * snapshot from X Layer RPC when OnchainOS credentials are absent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address } = body as { address?: string };
    if (!address || !WALLET_RE.test(address)) {
      return NextResponse.json({ error: "Valid 0x address required" }, { status: 400 });
    }

    if (hasOnchainOSCredentials()) {
      const snap = await getOnchainOSPortfolio(address);
      if (snap) {
        return NextResponse.json({
          ...snap,
          explorer: `${XLAYER_EXPLORER}/address/${address}`,
          skill: "okx-wallet-portfolio",
        });
      }
    }

    // Fallback: native balance only, via X Layer RPC.
    const wallet = await verifyWalletOnChain(address);
    return NextResponse.json({
      address,
      chain: "X Layer",
      chainId: 196,
      totalValueUsd: "0",
      assets: wallet.exists
        ? [
            {
              symbol: "OKB",
              address: "0x0000000000000000000000000000000000000000",
              balance: wallet.balance,
              balanceUsd: "0",
              decimals: 18,
            },
          ]
        : [],
      nativeBalance: wallet.balanceFormatted,
      txCount: wallet.txCount,
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      explorer: `${XLAYER_EXPLORER}/address/${address}`,
      skill: "xflight.rpc-native-balance",
      onchainosConfigured: hasOnchainOSCredentials(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
