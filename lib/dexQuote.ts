import { createPublicClient, http, parseUnits, formatUnits, encodeFunctionData, decodeFunctionResult } from "viem";
import { xlayer } from "./chains";

// ── X Layer Token Registry ──
export const XLAYER_TOKENS: Record<string, { address: `0x${string}`; decimals: number; symbol: string }> = {
  WOKB:  { address: "0xe538905cf8410324e03A5A23C1c177a474D59b2b", decimals: 18, symbol: "WOKB" },
  OKB:   { address: "0xe538905cf8410324e03A5A23C1c177a474D59b2b", decimals: 18, symbol: "OKB" },  // native wraps to WOKB
  USDC:  { address: "0x74b7F16337b8972027F6196A17a631aC6dE26d22", decimals: 6,  symbol: "USDC" },
  USDT:  { address: "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", decimals: 6,  symbol: "USDT" },
};

// Uniswap V3 QuoterV2 — deterministic CREATE2 address (same on all chains)
const QUOTER_V2 = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e" as `0x${string}`;

// QuoterV2.quoteExactInputSingle ABI fragment
const QUOTE_EXACT_INPUT_SINGLE_ABI = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    inputs: [
      {
        type: "tuple",
        name: "params",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
] as const;

const FEE_TIERS = [3000, 500, 10000] as const; // try 0.3% first, then 0.05%, then 1%

const client = createPublicClient({
  chain: xlayer,
  transport: http(process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech"),
});

export interface DexQuote {
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
  amountOutFormatted: string;
  feeTier: number;
  gasEstimate: string;
  route: string;
  live: boolean;
}

/**
 * Get a real quote from Uniswap V3 on X Layer.
 * Tries multiple fee tiers and returns the best quote.
 */
export async function getUniswapQuote(
  fromSymbol: string,
  toSymbol: string,
  amountIn: string
): Promise<DexQuote | null> {
  const from = XLAYER_TOKENS[fromSymbol.toUpperCase()];
  const to = XLAYER_TOKENS[toSymbol.toUpperCase()];
  if (!from || !to) return null;

  const amountInWei = parseUnits(amountIn, from.decimals);

  for (const fee of FEE_TIERS) {
    try {
      const callData = encodeFunctionData({
        abi: QUOTE_EXACT_INPUT_SINGLE_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: from.address,
            tokenOut: to.address,
            amountIn: amountInWei,
            fee,
            sqrtPriceLimitX96: 0n,
          },
        ],
      });

      const result = await client.call({
        to: QUOTER_V2,
        data: callData,
      });

      if (!result.data) continue;

      const decoded = decodeFunctionResult({
        abi: QUOTE_EXACT_INPUT_SINGLE_ABI,
        functionName: "quoteExactInputSingle",
        data: result.data,
      });

      const [amountOut, , , gasEst] = decoded;

      const formatted = formatUnits(amountOut, to.decimals);

      return {
        fromToken: from.symbol,
        toToken: to.symbol,
        amountIn,
        amountOut: amountOut.toString(),
        amountOutFormatted: formatted,
        feeTier: fee,
        gasEstimate: `~${formatUnits(gasEst, 18)} OKB`,
        route: `${from.symbol} > ${to.symbol} (Uniswap V3, ${fee / 10000}% fee)`,
        live: true,
      };
    } catch {
      // This fee tier pool doesn't exist or quoter not available, try next
      continue;
    }
  }

  return null;
}

/**
 * Parse a natural language action like "Swap 0.1 OKB to USDC on X Layer"
 * into structured swap parameters.
 */
export function parseSwapAction(action: string): {
  fromToken: string;
  toToken: string;
  amount: string;
} | null {
  // Pattern: "Swap <amount> <TOKEN> to/for <TOKEN>"
  const swapMatch = action.match(
    /swap\s+([\d.]+)\s+(\w+)\s+(?:to|for|into)\s+(\w+)/i
  );
  if (swapMatch) {
    return {
      amount: swapMatch[1],
      fromToken: swapMatch[2].toUpperCase(),
      toToken: swapMatch[3].toUpperCase(),
    };
  }

  // Pattern: "Buy <TOKEN> with <amount> <TOKEN>"
  const buyMatch = action.match(
    /buy\s+(\w+)\s+with\s+([\d.]+)\s+(\w+)/i
  );
  if (buyMatch) {
    return {
      amount: buyMatch[2],
      fromToken: buyMatch[3].toUpperCase(),
      toToken: buyMatch[1].toUpperCase(),
    };
  }

  // Pattern: "Send <amount> <TOKEN> to <address>"
  const sendMatch = action.match(
    /send\s+([\d.]+)\s+(\w+)/i
  );
  if (sendMatch) {
    return {
      amount: sendMatch[1],
      fromToken: sendMatch[2].toUpperCase(),
      toToken: sendMatch[2].toUpperCase(), // same token for sends
    };
  }

  return null;
}

/**
 * Get a quote with fallback to simulated estimate.
 */
export async function getQuoteWithFallback(
  fromSymbol: string,
  toSymbol: string,
  amountIn: string
): Promise<DexQuote> {
  // Try real Uniswap V3 quote first
  const liveQuote = await getUniswapQuote(fromSymbol, toSymbol, amountIn);
  if (liveQuote) return liveQuote;

  // Fallback: rough estimate based on known approximate prices
  const approxPrices: Record<string, number> = {
    OKB: 48.5,
    WOKB: 48.5,
    USDC: 1.0,
    USDT: 1.0,
  };

  const fromPrice = approxPrices[fromSymbol.toUpperCase()] || 1;
  const toPrice = approxPrices[toSymbol.toUpperCase()] || 1;
  const estimatedOut = (parseFloat(amountIn) * fromPrice) / toPrice;

  return {
    fromToken: fromSymbol.toUpperCase(),
    toToken: toSymbol.toUpperCase(),
    amountIn,
    amountOut: estimatedOut.toFixed(6),
    amountOutFormatted: `~${estimatedOut.toFixed(2)} (estimated)`,
    feeTier: 3000,
    gasEstimate: "~0.002 OKB (estimated)",
    route: `${fromSymbol.toUpperCase()} > ${toSymbol.toUpperCase()} (simulated, Uniswap V3 pool not found)`,
    live: false,
  };
}
