export async function attestReport(
  input: { reportId: string },
  config: { apiUrl: string }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${config.apiUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId: input.reportId }),
  });
  if (!res.ok) throw new Error(`attest_report failed: ${res.status}`);
  const data = await res.json();
  return {
    success: !!data.attestation?.txHash,
    txHash: data.attestation?.txHash,
    blockNumber: data.attestation?.blockNumber,
    explorerUrl: data.explorerUrl,
    reportHash: data.reportHash,
    score: data.score,
  };
}
