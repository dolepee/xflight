"use client";

import { useState } from "react";
import Link from "next/link";

interface FlightScoreResult {
  score: number;
  verdict: string;
  breakdown: { category: string; points: number; max: number; reason: string }[];
  explanation: string;
}

interface Claims {
  agentName?: string;
  walletAddress?: string;
  transactionCount?: number;
  claimedPnl?: number;
  onchainosUsed?: boolean;
  uniswapUsed?: boolean;
  deployedContract?: string;
  githubUrl?: string;
  liveDemoUrl?: string;
  pnlCurrency?: string;
}

interface VerificationResponse {
  reportId: string;
  reportHash: string;
  score: number;
  verdict: string;
  explanation: string;
  breakdown: FlightScoreResult["breakdown"];
  claims: Claims;
  verificationResults: { claim: string; status: string; detail: string }[];
  attestation: Record<string, unknown>;
  explorerUrl?: string;
  proofUrl: string;
}

const verdictLabels: Record<string, { label: string; cls: string }> = {
  strongly_verified: { label: "Strongly Verified", cls: "badge-success" },
  mostly_verified: { label: "Mostly Verified", cls: "badge-neutral" },
  partially_verified: { label: "Partially Verified", cls: "badge-warning" },
  weak_proof: { label: "Weak Proof", cls: "badge-warning" },
  unverified: { label: "Unverified", cls: "badge-danger" },
};

export default function VerifyPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), useAI: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score: number): string {
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-blue-400";
    if (score >= 50) return "text-yellow-400";
    if (score >= 25) return "text-orange-400";
    return "text-red-400";
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify Agent Claims</h1>
        <p className="text-gray-400">
          Paste a Moltbook BuildX post URL, project page, or paste agent text
          directly. XFlight will extract claims, score evidence, and attest on
          X Layer.
        </p>
      </div>

      <div className="card mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="https://www.moltbook.com/posts/... or paste BuildX text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="flex-1 font-mono text-sm"
          />
          <button
            className="btn-primary whitespace-nowrap"
            onClick={handleVerify}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-500/30 bg-red-500/5 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-center md:text-left">
                <div className={`text-6xl font-bold font-mono ${scoreColor(result.score)}`}>
                  {result.score}
                </div>
                <div className="text-sm text-gray-400 mt-1">/ 100 Flight Score</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`badge ${verdictLabels[result.verdict]?.cls || "badge-neutral"}`}>
                    {verdictLabels[result.verdict]?.label || result.verdict}
                  </span>
                  {result.attestation?.txHash ? (
                    <a
                      href={result.explorerUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-white transition"
                    >
                      ⛓ On-chain attestation ↗
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {result.attestation?.note
                        ? String(result.attestation.note)
                        : "Pending on-chain attestation"}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 text-sm">{result.explanation}</p>
                {result.proofUrl && (
                  <Link href={result.proofUrl}>
                    <button className="mt-3 text-xs text-gray-400 hover:text-white transition">
                      View full proof card →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Extracted Claims
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { label: "Agent Name", value: result.claims.agentName },
                { label: "Wallet", value: result.claims.walletAddress, mono: true },
                { label: "TX Count", value: result.claims.transactionCount },
                { label: "Claimed PnL", value: result.claims.claimedPnl ? `$${result.claims.claimedPnl.toLocaleString()} ${result.claims.pnlCurrency || "USD"}` : null },
                { label: "OnchainOS", value: result.claims.onchainosUsed ? "Claimed" : "Not mentioned" },
                { label: "Uniswap", value: result.claims.uniswapUsed ? "Claimed" : "Not mentioned" },
                { label: "Contract", value: result.claims.deployedContract, mono: true },
                { label: "GitHub", value: result.claims.githubUrl, link: true },
                { label: "Live Demo", value: result.claims.liveDemoUrl, link: true },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div key={row.label} className="flex flex-col gap-1 p-3 bg-white/3 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{row.label}</span>
                    {row.link ? (
                      <a
                        href={String(row.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 truncate"
                      >
                        {String(row.value)}
                      </a>
                    ) : (
                      <span className={`text-sm ${row.mono ? "font-mono" : ""}`}>
                        {String(row.value)}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
              Flight Score Breakdown
            </h3>
            <div className="space-y-3">
              {result.breakdown.map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.category}</span>
                    <span className="font-mono">
                      <span className={item.points >= item.max * 0.7 ? "text-emerald-400" : item.points >= item.max * 0.4 ? "text-yellow-400" : "text-red-400"}>
                        {item.points}
                      </span>
                      <span className="text-gray-600">/{item.max}</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.points / item.max) * 100}%`,
                        background: item.points >= item.max * 0.7 ? "#10b981" : item.points >= item.max * 0.4 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {result.reportHash && (
            <div className="card">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-3">
                Report Hash
              </h3>
              <code className="text-xs font-mono text-gray-400 break-all block">
                {result.reportHash}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
