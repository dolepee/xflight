/**
 * XFlight Agentic Wallet.
 *
 * The same key that signs XFlightRecorder attestations is also the agent's
 * onchain identity — an "Agentic Wallet" in the OKX Build X sense:
 *   - lives on X Layer (chainId 196)
 *   - signs every verification report autonomously
 *   - is the single, publicly auditable caller for the contract
 *
 * This module exposes the wallet's public surface (address, balance, nonce)
 * without ever leaking the private key.
 */
import { createPublicClient, http, formatEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xlayer } from "./chains";

const rpc = process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech";

const client = createPublicClient({
  chain: xlayer,
  transport: http(rpc),
});

export interface AgenticWalletStatus {
  address: `0x${string}`;
  chain: "X Layer";
  chainId: 196;
  balance: string;
  balanceFormatted: string;
  nonce: number;
  explorer: string;
  role: string;
  skills: string[];
}

function getAccount() {
  const pk = process.env.ATTESTER_PRIVATE_KEY;
  if (!pk) return null;
  const normalized = pk.startsWith("0x") ? pk : `0x${pk}`;
  try {
    return privateKeyToAccount(normalized as `0x${string}`);
  } catch {
    return null;
  }
}

/** Public address of the XFlight Agentic Wallet (no key material exposed). */
export function getAgenticWalletAddress(): `0x${string}` | null {
  const acct = getAccount();
  return acct ? acct.address : null;
}

/** Live status snapshot from X Layer RPC. */
export async function getAgenticWalletStatus(): Promise<AgenticWalletStatus | null> {
  const addr = getAgenticWalletAddress();
  if (!addr) return null;

  const [balance, nonce] = await Promise.all([
    client.getBalance({ address: addr }),
    client.getTransactionCount({ address: addr }),
  ]);

  return {
    address: addr,
    chain: "X Layer",
    chainId: 196,
    balance: balance.toString(),
    balanceFormatted: `${formatEther(balance)} OKB`,
    nonce,
    explorer: `https://www.oklink.com/xlayer/address/${addr}`,
    role: "XFlight verification attester",
    skills: [
      "okx-agentic-wallet",
      "okx-dex-swap",
      "okx-wallet-portfolio",
      "xflight.attest_report",
      "xflight.verify_wallet",
      "xflight.verify_tx",
    ],
  };
}
