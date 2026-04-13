import { createPublicClient, createWalletClient, http, keccak256, toBytes, encodeAbiParameters, parseAbiParameters, stringify } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { xlayer } from "./chains";

const CONTRACT_ABI = [
  {
    inputs: [
      { name: "reportId", type: "bytes32" },
      { name: "reportHash", type: "bytes32" },
      { name: "projectUrl", type: "string" },
      { name: "score", type: "uint8" },
    ],
    name: "recordReport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export interface AttestationResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  contractAddress?: string;
  error?: string;
  gasUsed?: bigint;
}

export async function attestReport(
  reportId: string,
  reportHash: string,
  projectUrl: string,
  score: number,
  contractAddress: string,
  privateKey: string
): Promise<AttestationResult> {
  try {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const publicClient = createPublicClient({
      chain: xlayer,
      transport: http(process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech"),
    });
    const walletClient = createWalletClient({
      chain: xlayer,
      transport: http(process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech"),
      account,
    });

    const reportIdBytes = keccak256(toBytes(reportId.slice(0, 32)));
    const hashBytes = keccak256(toBytes(reportHash));

    const { request } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: "recordReport",
      args: [reportIdBytes, hashBytes, projectUrl, Math.min(100, Math.max(0, score))],
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
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function generateOnChainReportHash(reportId: string, reportData: string): string {
  const combined = reportId + reportData;
  return "0x" + keccak256(toBytes(combined)).slice(0, 34);
}
