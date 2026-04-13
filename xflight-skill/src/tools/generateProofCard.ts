export async function generateProofCard(
  input: { reportId: string },
  config: { apiUrl: string }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${config.apiUrl}/api/proof/${input.reportId}`);
  if (!res.ok) throw new Error(`generate_proof_card failed: ${res.status}`);
  const report = await res.json();
  return {
    proofUrl: `${config.apiUrl}/proof/${input.reportId}`,
    reportHash: report.reportHash,
    score: report.score,
    verdict: report.verdict,
    projectUrl: report.projectUrl,
    breakdown: report.flightScoreBreakdown,
    claims: report.claims,
  };
}
