export async function verifyMoltbookPost(
  input: { url: string; useAI?: boolean },
  config: { apiUrl: string }
): Promise<Record<string, unknown>> {
  const res = await fetch(`${config.apiUrl}/api/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input.url, useAI: input.useAI ?? false }),
  });
  if (!res.ok) throw new Error(`verify_moltbook_post failed: ${res.status}`);
  return res.json();
}
