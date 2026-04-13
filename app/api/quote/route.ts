import { NextRequest, NextResponse } from "next/server";
import { getQuoteWithFallback, parseSwapAction, XLAYER_TOKENS } from "@/lib/dexQuote";

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

    if (!XLAYER_TOKENS[from.toUpperCase()]) {
      return NextResponse.json(
        { error: `Unknown token: ${from}. Supported: ${Object.keys(XLAYER_TOKENS).join(", ")}` },
        { status: 400 }
      );
    }
    if (!XLAYER_TOKENS[to.toUpperCase()]) {
      return NextResponse.json(
        { error: `Unknown token: ${to}. Supported: ${Object.keys(XLAYER_TOKENS).join(", ")}` },
        { status: 400 }
      );
    }

    const quote = await getQuoteWithFallback(from, to, qty);

    return NextResponse.json({
      ...quote,
      chain: "X Layer",
      chainId: 196,
      dex: "Uniswap V3",
      slippage: "0.5%",
    });
  } catch (err) {
    console.error("[/api/quote] Error:", err);
    return NextResponse.json({ error: "Quote failed", detail: String(err) }, { status: 500 });
  }
}
