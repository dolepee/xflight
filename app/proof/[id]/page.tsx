"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface ProofReport {
  id: string;
  reportHash: string;
  projectUrl: string;
  score: number;
  verdict: string;
  claims: Record<string, unknown>;
  verificationResults: Record<string, unknown>[];
  flightScoreBreakdown: Record<string, unknown>[];
  explanation: string;
  txHash?: string;
  blockNumber?: number;
  timestamp: string;
  verifier: string;
}

const verdictConfig: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  strongly_verified: { label: "Strongly Verified", color: "#00d4aa", icon: ShieldCheck },
  mostly_verified: { label: "Mostly Verified", color: "#4ade80", icon: ShieldCheck },
  partially_verified: { label: "Partially Verified", color: "#f5a623", icon: ShieldAlert },
  weak_proof: { label: "Weak Proof", color: "#f97316", icon: ShieldAlert },
  unverified: { label: "Unverified", color: "#ef4444", icon: ShieldX },
};

export default function ProofPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [report, setReport] = useState<ProofReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/proof/${id}`)
        .then((r) => {
          if (!r.ok) { setNotFound(true); setLoading(false); return null; }
          return r.json();
        })
        .then((data) => {
          if (data) setReport(data);
          setLoading(false);
        })
        .catch(() => { setNotFound(true); setLoading(false); });
    });
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={24} className="animate-spin text-[#00d4aa] mx-auto" />
          <p className="text-[#52525b] text-sm mt-4">Loading proof card...</p>
        </div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <ShieldX size={32} className="text-[#52525b] mx-auto" />
        <h1 className="text-xl font-bold mt-4 mb-2">Report Not Found</h1>
        <p className="text-[#52525b] text-sm mb-6">
          This proof card does not exist or has been removed.
        </p>
        <Link href="/verify">
          <button className="btn-primary">Run New Verification</button>
        </Link>
      </div>
    );
  }

  const vc = verdictConfig[report.verdict] || verdictConfig.unverified;
  const VerdictIcon = vc.icon;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12px] text-[#52525b] hover:text-[#00d4aa] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back
      </Link>

      {/* Main proof card */}
      <div className="bg-[#141414] border border-[#262626] rounded-md p-8 mb-6">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[15px] font-bold text-white">XFlight Proof Card</span>
          <span className="font-mono text-[10px] text-[#52525b] tracking-wider">{report.id}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="text-center md:text-left">
            <div
              className="text-7xl font-bold font-mono leading-none"
              style={{ color: vc.color }}
            >
              {report.score}
            </div>
            <div className="text-[11px] font-mono text-[#52525b] mt-2 tracking-wider">
              / 100
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span
                className="badge flex items-center gap-1.5"
                style={{ background: `${vc.color}15`, color: vc.color }}
              >
                <VerdictIcon size={12} />
                {vc.label}
              </span>
              {report.txHash && (
                <a
                  href={`https://www.oklink.com/xlayer/tx/${report.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge badge-accent flex items-center gap-1"
                >
                  Attested on X Layer
                  <ExternalLink size={10} />
                </a>
              )}
              <span className="badge badge-neutral font-mono text-[10px]">
                {report.verifier}
              </span>
            </div>

            <p className="text-[13px] text-[#a1a1aa] leading-relaxed">{report.explanation}</p>

            {report.projectUrl && (
              <div className="text-[12px] text-[#52525b]">
                Source:{" "}
                <a
                  href={report.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00d4aa] hover:underline"
                >
                  {report.projectUrl.slice(0, 60)}{report.projectUrl.length > 60 ? "..." : ""}
                </a>
              </div>
            )}

            {report.reportHash && (
              <div className="text-[11px] text-[#52525b]">
                Hash:{" "}
                <code className="font-mono text-[#a1a1aa] break-all">
                  {report.reportHash}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {Array.isArray(report.flightScoreBreakdown) && report.flightScoreBreakdown.length > 0 && (
        <div className="bg-[#141414] border border-[#262626] rounded-md p-6 mb-4">
          <h2 className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase mb-4">
            Score Breakdown
          </h2>
          <div className="space-y-4">
            {report.flightScoreBreakdown.map((item: Record<string, unknown>, i: number) => {
              const pts = Number(item.points);
              const max = Number(item.max);
              const pct = max > 0 ? pts / max : 0;
              const barColor = pct >= 0.7 ? "#00d4aa" : pct >= 0.4 ? "#f5a623" : "#ef4444";
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] text-white">{String(item.category)}</span>
                    <span className="font-mono text-[12px]">
                      <span style={{ color: barColor }}>{pts}</span>
                      <span className="text-[#333]">/{max}</span>
                    </span>
                  </div>
                  <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct * 100}%`, background: barColor }}
                    />
                  </div>
                  <p className="text-[11px] text-[#52525b] mt-1">{String(item.reason)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claims */}
      {report.claims && Object.keys(report.claims).length > 0 && (
        <div className="bg-[#141414] border border-[#262626] rounded-md p-6 mb-4">
          <h2 className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase mb-4">
            Extracted Claims
          </h2>
          <div className="grid md:grid-cols-2 gap-2">
            {Object.entries(report.claims)
              .filter(([k, v]) => v && k !== "rawText")
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]"
                >
                  <span className="text-[11px] text-[#52525b] uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-[12px] font-mono text-white truncate max-w-[60%]">
                    {String(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="text-center text-[10px] font-mono text-[#333] mt-8">
        Generated by XFlight BlackBox · X Layer · {new Date(report.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
