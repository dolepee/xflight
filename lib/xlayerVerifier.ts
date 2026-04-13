import { createPublicClient, http, formatEther } from "viem";
import { xlayer } from "./chains";

const client = createPublicClient({
  chain: xlayer,
  transport: http(process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech"),
});

export interface WalletVerification {
  address: string;
  exists: boolean;
  balance: string;
  balanceFormatted: string;
  txCount: number;
  hasActivity: boolean;
  error?: string;
}

export interface ContractVerification {
  address: string;
  hasCode: boolean;
  error?: string;
}

export interface TxVerification {
  txHash: string;
  exists: boolean;
  status: "success" | "failed" | "not_found";
  from?: string;
  to?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

export async function verifyWalletOnChain(address: string): Promise<WalletVerification> {
  try {
    const addr = address as `0x${string}`;
    const [balance, txCount] = await Promise.all([
      client.getBalance({ address: addr }),
      client.getTransactionCount({ address: addr }),
    ]);
    return {
      address,
      exists: balance > 0n || txCount > 0,
      balance: balance.toString(),
      balanceFormatted: formatEther(balance),
      txCount,
      hasActivity: txCount > 0,
    };
  } catch (err) {
    return {
      address,
      exists: false,
      balance: "0",
      balanceFormatted: "0",
      txCount: 0,
      hasActivity: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function verifyContractOnChain(address: string): Promise<ContractVerification> {
  try {
    const code = await client.getCode({ address: address as `0x${string}` });
    const hasCode = !!code && code !== "0x" && code.length > 2;
    return { address, hasCode };
  } catch (err) {
    return {
      address,
      hasCode: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function verifyTransactionOnChain(txHash: string): Promise<TxVerification> {
  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    return {
      txHash,
      exists: true,
      status: receipt.status === "success" ? "success" : "failed",
      from: receipt.from,
      to: receipt.to || undefined,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch {
    return { txHash, exists: false, status: "not_found" };
  }
}

export async function getWalletTxSample(address: string): Promise<number> {
  try {
    const count = await client.getTransactionCount({ address: address as `0x${string}` });
    return count;
  } catch {
    return 0;
  }
}
