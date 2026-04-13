export async function attestReport(
  input: { reportId: string },
  config: { apiUrl: string }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${config.apiUrl}/api/attest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId: input.reportId }),
  });
  if (!res.ok) throw new Error(`attest_report failed: ${res.status}`);
  const data = await res.json();
  return {
    success: data.success,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    explorerUrl: data.explorerUrl,
  };
}
