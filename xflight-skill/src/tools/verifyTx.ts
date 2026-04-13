export async function verifyTx(
  input: { txHash: string; chain?: string },
  config: { rpcUrl: string }
): Promise<Record<string, unknown>> {
  const res = await fetch(config.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [input.txHash],
      id: 1,
    }),
  });
  const data = await res.json();
  const receipt = data.result;

  if (!receipt) {
    return {
      txHash: input.txHash,
      chain: input.chain || "X Layer",
      status: "not_found",
      verdict: "FAILED",
      error: "Transaction not found",
    };
  }

  const status = receipt.status === "0x1" ? "confirmed" : "reverted";
  const verdict = receipt.status === "0x1" ? "PASS" : "WARNING";

  return {
    txHash: input.txHash,
    chain: "X Layer",
    status,
    sender: receipt.from,
    receiver: receipt.to,
    blockNumber: parseInt(receipt.blockNumber, 16),
    gasUsed: parseInt(receipt.gasUsed, 16),
    verdict,
    logs: receipt.logs?.length || 0,
  };
}
