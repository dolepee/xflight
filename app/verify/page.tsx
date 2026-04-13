"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Loader2,
} from "lucide-react";

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
  verificationResults: { claim: string; status: string; detail: string; source?: string }[];
  attestation: Record<string, unknown>;
  explorerUrl?: string;
  proofUrl: string;
}

const verdictConfig: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  strongly_verified: { label: "Strongly Verified", color: "#00d4aa", icon: ShieldCheck },
  mostly_verified: { label: "Mostly Verified", color: "#4ade80", icon: ShieldCheck },
  partially_verified: { label: "Partially Verified", color: "#f5a623", icon: ShieldAlert },
  weak_proof: { label: "Weak Proof", color: "#f97316", icon: ShieldAlert },
  unverified: { label: "Unverified", color: "#ef4444", icon: ShieldX },
};

const statusColors: Record<string, string> = {
  verified: "#00d4aa",
  partial: "#f5a623",
  unverified: "#52526b",
  contradicted: "#ef4444",
};

function VerifyPageInner() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prefill = searchParams.get("url");
    if (prefill) {
      setUrl(prefill);
      // Auto-verify if URL came from homepage
      handleVerifyDirect(prefill);
    }
  }, []);

  async function handleVerifyDirect(verifyUrl: string) {
    if (!verifyUrl.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: verifyUrl.trim(), useAI: false }),
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

  async function handleVerify() {
    await handleVerifyDirect(url);
  }

  function scoreColor(score: number): string {
    if (score >= 85) return "#00d4aa";
    if (score >= 70) return "#4ade80";
    if (score >= 50) return "#f5a623";
    if (score >= 25) return "#f97316";
    return "#ef4444";
  }

  const vc = result ? verdictConfig[result.verdict] || verdictConfig.unverified : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">Verify Agent Claims</h1>
        <p className="text-[13px] text-[#a1a1b5] mt-2 leading-relaxed">
          Paste a Moltbook BuildX post URL, project page, or agent text.
          XFlight extracts claims, scores evidence, and attests the report on X Layer.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center bg-[#0d1117] border border-[#1e2130] rounded-md overflow-hidden focus-within:border-[#00d4aa] transition-all mb-10">
        <div className="pl-4 text-[#52526b]">
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="https://www.moltbook.com/posts/... or paste BuildX text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className="flex-1 bg-transparent border-none px-3 py-3 text-sm font-mono focus:ring-0 focus:outline-none"
          style={{ boxShadow: "none" }}
        />
        <button
          className="btn-primary rounded-none px-6 py-3 text-xs tracking-wide flex items-center gap-2"
          onClick={handleVerify}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Verifying
            </>
          ) : (
            "Verify"
          )}
        </button>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-md p-4 mb-8 flex items-start gap-3">
          <AlertTriangle size={16} className="text-[#ef4444] mt-0.5 shrink-0" />
          <p className="text-[#ef4444] text-sm">{error}</p>
        </div>
      )}

      {result && vc && (
        <div className="space-y-6">
          {/* Score header */}
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="text-center md:text-left">
                <div
                  className="text-6xl font-bold font-mono"
                  style={{ color: scoreColor(result.score) }}
                >
                  {result.score}
                </div>
                <div className="text-[11px] font-mono text-[#52526b] mt-1 tracking-wider">
                  / 100 FLIGHT SCORE
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="badge flex items-center gap-1.5"
                    style={{ background: `${vc.color}15`, color: vc.color }}
                  >
                    <vc.icon size={12} />
                    {vc.label}
                  </span>
                  {result.attestation?.txHash ? (
                    <a
                      href={result.explorerUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#00d4aa] hover:underline"
                    >
                      On-chain attestation
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#52526b]">
                      {result.attestation?.note
                        ? String(result.attestation.note)
                        : "Pending attestation"}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#a1a1b5] leading-relaxed">{result.explanation}</p>
                {result.proofUrl && (
                  <Link
                    href={result.proofUrl}
                    className="inline-flex items-center gap-1 mt-3 text-xs text-[#52526b] hover:text-[#00d4aa] transition-colors"
                  >
                    View proof card
                    <ChevronRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Verification results */}
          {result.verificationResults.length > 0 && (
            <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6">
              <h3 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
                Verification Results
              </h3>
              <div className="space-y-2">
                {result.verificationResults.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded bg-[#06080d] border border-[#151a25]"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: statusColors[v.status] || "#52526b" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-medium text-white">{v.claim}</span>
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider"
                          style={{ color: statusColors[v.status] || "#52526b" }}
                        >
                          {v.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#52526b] mt-0.5">{v.detail}</p>
                    </div>
                    {v.source && (
                      <a
                        href={v.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#52526b] hover:text-[#00d4aa] transition-colors shrink-0"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted claims */}
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6">
            <h3 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
              Extracted Claims
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                { label: "Agent Name", value: result.claims.agentName },
                { label: "Wallet", value: result.claims.walletAddress, mono: true },
                { label: "TX Count", value: result.claims.transactionCount },
                { label: "Claimed PnL", value: result.claims.claimedPnl ? `$${result.claims.claimedPnl.toLocaleString()} ${result.claims.pnlCurrency || "USD"}` : null },
                { label: "OnchainOS", value: result.claims.onchainosUsed ? "Claimed" : null },
                { label: "Uniswap", value: result.claims.uniswapUsed ? "Claimed" : null },
                { label: "Contract", value: result.claims.deployedContract, mono: true },
                { label: "GitHub", value: result.claims.githubUrl, link: true },
                { label: "Live Demo", value: result.claims.liveDemoUrl, link: true },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between p-3 rounded bg-[#06080d] border border-[#151a25]"
                  >
                    <span className="text-[11px] text-[#52526b] uppercase tracking-wider">
                      {row.label}
                    </span>
                    {row.link ? (
                      <a
                        href={String(row.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#00d4aa] hover:underline truncate max-w-[60%] inline-flex items-center gap-1"
                      >
                        {String(row.value).replace(/https?:\/\//, "").slice(0, 40)}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className={`text-[12px] ${row.mono ? "font-mono" : ""} text-white truncate max-w-[60%]`}>
                        {String(row.value)}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Score breakdown */}
          <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6">
            <h3 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
              Flight Score Breakdown
            </h3>
            <div className="space-y-4">
              {result.breakdown.map((item) => {
                const pct = item.max > 0 ? item.points / item.max : 0;
                const barColor = pct >= 0.7 ? "#00d4aa" : pct >= 0.4 ? "#f5a623" : "#ef4444";
                return (
                  <div key={item.category}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[12px] text-white">{item.category}</span>
                      <span className="font-mono text-[12px]">
                        <span style={{ color: barColor }}>{item.points}</span>
                        <span className="text-[#252a3a]">/{item.max}</span>
                      </span>
                    </div>
                    <div className="h-1 bg-[#151a25] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct * 100}%`, background: barColor }}
                      />
                    </div>
                    <p className="text-[11px] text-[#52526b] mt-1">{item.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Report hash */}
          {result.reportHash && (
            <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6">
              <h3 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-3">
                Report Hash
              </h3>
              <code className="text-[11px] font-mono text-[#a1a1b5] break-all block">
                {result.reportHash}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageInner />
    </Suspense>
  );
}
