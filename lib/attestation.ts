import { createPublicClient, createWalletClient, http, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xlayer } from "./chains";

const CONTRACT_ABI = [
  {
    inputs: [
      { name: "actionId", type: "bytes32" },
      { name: "planHash", type: "bytes32" },
      { name: "metadataURI", type: "string" },
    ],
    name: "commitPlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "actionId", type: "bytes32" },
      { name: "txHash", type: "bytes32" },
      { name: "observedHash", type: "bytes32" },
    ],
    name: "recordExecution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "reportId", type: "bytes32" },
      { name: "reportHash", type: "bytes32" },
      { name: "verdict", type: "uint8" },
      { name: "flightScore", type: "uint16" },
      { name: "reportURI", type: "string" },
    ],
    name: "attestReport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Verdict enum matching contract uint8
export const Verdict = {
  UNVERIFIED: 0,
  WEAK: 1,
  PARTIAL: 2,
  MOSTLY_VERIFIED: 3,
  STRONGLY_VERIFIED: 4,
} as const;

export function scoreToVerdict(score: number): number {
  if (score >= 85) return Verdict.STRONGLY_VERIFIED;
  if (score >= 70) return Verdict.MOSTLY_VERIFIED;
  if (score >= 50) return Verdict.PARTIAL;
  if (score >= 25) return Verdict.WEAK;
  return Verdict.UNVERIFIED;
}

export interface AttestationResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  error?: string;
  gasUsed?: bigint;
}

function getClients(privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const rpcUrl = process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech";
  const publicClient = createPublicClient({ chain: xlayer, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ chain: xlayer, transport: http(rpcUrl), account });
  return { account, publicClient, walletClient };
}

export async function commitPlan(
  actionId: string,
  planHash: string,
  metadataURI: string,
  contractAddress: string,
  privateKey: string
): Promise<AttestationResult> {
  try {
    const { account, publicClient, walletClient } = getClients(privateKey);
    const actionIdBytes = keccak256(toBytes(actionId));
    const planHashBytes = keccak256(toBytes(planHash));

    const { request } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "commitPlan",
      args: [actionIdBytes, planHashBytes, metadataURI],
      account: account.address,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber),
      contractAddress,
      gasUsed: receipt.gasUsed,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function recordExecution(
  actionId: string,
  txHash: string,
  observedHash: string,
  contractAddress: string,
  privateKey: string
): Promise<AttestationResult> {
  try {
    const { account, publicClient, walletClient } = getClients(privateKey);
    const actionIdBytes = keccak256(toBytes(actionId));
    const txHashBytes = txHash.startsWith("0x") ? (txHash as `0x${string}`) : keccak256(toBytes(txHash));
    const observedHashBytes = keccak256(toBytes(observedHash));

    const { request } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "recordExecution",
      args: [actionIdBytes, txHashBytes, observedHashBytes],
      account: account.address,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber),
      contractAddress,
      gasUsed: receipt.gasUsed,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function attestReport(
  reportId: string,
  reportHash: string,
  score: number,
  reportURI: string,
  contractAddress: string,
  privateKey: string
): Promise<AttestationResult> {
  try {
    const { account, publicClient, walletClient } = getClients(privateKey);
    const reportIdBytes = keccak256(toBytes(reportId));
    const hashBytes = keccak256(toBytes(reportHash));
    const verdict = scoreToVerdict(score);
    const flightScore = Math.min(100, Math.max(0, score));

    const { request } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "attestReport",
      args: [reportIdBytes, hashBytes, verdict, flightScore, reportURI],
      account: account.address,
    });

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber),
      contractAddress,
      gasUsed: receipt.gasUsed,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
