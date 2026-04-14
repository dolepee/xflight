import { NextRequest, NextResponse } from "next/server";
import { parseUnits } from "viem";
import { getQuoteWithFallback, parseSwapAction, XLAYER_TOKENS } from "@/lib/dexQuote";
import { getOnchainOSQuote, hasOnchainOSCredentials } from "@/lib/onchainos";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, fromToken, toToken, amount } = body as {
      action?: string;
      fromToken?: string;
      toToken?: string;
      amount?: string;
    };

    let from: string;
    let to: string;
    let qty: string;

    if (fromToken && toToken && amount) {
      from = fromToken;
      to = toToken;
      qty = amount;
    } else if (action) {
      const parsed = parseSwapAction(action);
      if (!parsed) {
        return NextResponse.json(
          { error: "Could not parse swap action. Try: 'Swap 0.1 OKB to USDC'" },
          { status: 400 }
        );
      }
      from = parsed.fromToken;
      to = parsed.toToken;
      qty = parsed.amount;
    } else {
      return NextResponse.json(
        { error: "Provide action text or fromToken + toToken + amount" },
        { status: 400 }
      );
    }

    const fromMeta = XLAYER_TOKENS[from.toUpperCase()];
    const toMeta = XLAYER_TOKENS[to.toUpperCase()];
    if (!fromMeta) {
      return NextResponse.json(
        { error: `Unknown token: ${from}. Supported: ${Object.keys(XLAYER_TOKENS).join(", ")}` },
        { status: 400 }
      );
    }
    if (!toMeta) {
      return NextResponse.json(
        { error: `Unknown token: ${to}. Supported: ${Object.keys(XLAYER_TOKENS).join(", ")}` },
        { status: 400 }
      );
    }

    // 1) Try OnchainOS (OKX DEX Aggregator) first — canonical hackathon skill surface.
    if (hasOnchainOSCredentials()) {
      const amountInWei = parseUnits(qty, fromMeta.decimals).toString();
      const oos = await getOnchainOSQuote({
        fromTokenAddress: fromMeta.address,
        toTokenAddress: toMeta.address,
        amount: amountInWei,
        fromSymbol: fromMeta.symbol,
        toSymbol: toMeta.symbol,
      });
      if (oos) {
        return NextResponse.json({
          ...oos,
          chain: "X Layer",
          chainId: 196,
          dex: "OKX DEX Aggregator (OnchainOS)",
          slippage: "0.5%",
          skill: "okx-dex-swap",
        });
      }
    }

    // 2) Fall back to direct Uniswap V3 QuoterV2 on X Layer.
    const quote = await getQuoteWithFallback(from, to, qty);

    return NextResponse.json({
      ...quote,
      chain: "X Layer",
      chainId: 196,
      dex: "Uniswap V3",
      slippage: "0.5%",
      skill: "uniswap-ai",
      source: quote.live ? "uniswap-v3" : "estimate",
      onchainosConfigured: hasOnchainOSCredentials(),
    });
  } catch (err) {
    console.error("[/api/quote] Error:", err);
    return NextResponse.json({ error: "Quote failed", detail: String(err) }, { status: 500 });
  }
}
