import { defineChain } from "viem";

export const xlayer = defineChain({
  id: 196,
  name: "X Layer",
  network: "xlayer",
  nativeCurrency: {
    decimals: 18,
    name: "OKB",
    symbol: "OKB",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.xlayer.tech"],
    },
  },
  blockExplorers: {
    default: {
      name: "OKLink",
      url: "https://www.oklink.com/xlayer",
    },
  },
});

export const XLAYER_CHAIN_ID = 196;
export const XLAYER_RPC = process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech";
export const XLAYER_EXPLORER = "https://www.oklink.com/xlayer";

export function explorerTxUrl(hash: string): string {
  return `${XLAYER_EXPLORER}/tx/${hash}`;
}

export function explorerAddressUrl(addr: string): string {
  return `${XLAYER_EXPLORER}/address/${addr}`;
}
