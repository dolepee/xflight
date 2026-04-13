"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
      <div className="max-w-4xl mx-auto px-6 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✈</div>
          <p className="text-gray-400">Loading proof card...</p>
        </div>
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
        <p className="text-gray-400 mb-6">
          This proof card does not exist or has been removed.
        </p>
        <Link href="/verify">
          <button className="btn-primary">Run New Verification</button>
        </Link>
      </div>
    );
  }

  const verdictInfo: Record<string, { label: string; cls: string; color: string }> = {
    strongly_verified: { label: "Strongly Verified", cls: "badge-success", color: "#10b981" },
    mostly_verified: { label: "Mostly Verified", cls: "badge-neutral", color: "#3b82f6" },
    partially_verified: { label: "Partially Verified", cls: "badge-warning", color: "#f59e0b" },
    weak_proof: { label: "Weak Proof", cls: "badge-warning", color: "#f97316" },
    unverified: { label: "Unverified", cls: "badge-danger", color: "#ef4444" },
  };
  const vinfo = verdictInfo[report.verdict] || verdictInfo.unverified;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
          ← Back
        </Link>
        <span className="text-gray-700">|</span>
        <span className="text-gray-500 text-sm">Proof Card</span>
      </div>

      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">✈</span>
          <div>
            <h1 className="font-bold text-lg">XFlight Proof Card</h1>
            <p className="text-xs text-gray-500 font-mono">{report.id}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="text-center md:text-left">
            <div
              className="text-7xl font-bold font-mono"
              style={{ color: vinfo.color }}
            >
              {report.score}
            </div>
            <div className="text-sm text-gray-400 mt-1">/ 100</div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`badge ${vinfo.cls}`}>{vinfo.label}</span>
              {report.txHash && (
                <a
                  href={`https://www.oklink.com/xlayer/tx/${report.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge badge-neutral"
                >
                  ⛓ Attested on X Layer
                </a>
              )}
              <span className="badge badge-neutral">
                {report.verifier}
              </span>
            </div>

            <p className="text-gray-300 text-sm">{report.explanation}</p>

            {report.projectUrl && (
              <div className="text-xs text-gray-500">
                Source:{" "}
                <a
                  href={report.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {report.projectUrl}
                </a>
              </div>
            )}

            {report.reportHash && (
              <div className="text-xs text-gray-500">
                Report Hash:{" "}
                <code className="font-mono text-gray-400 break-all">
                  {report.reportHash}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {Array.isArray(report.flightScoreBreakdown) && report.flightScoreBreakdown.length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
            Score Breakdown
          </h2>
          <div className="space-y-4">
            {report.flightScoreBreakdown.map((item: Record<string, unknown>, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span>{String(item.category)}</span>
                  <span className="font-mono">
                    <span
                      style={{
                        color:
                          Number(item.points) >= Number(item.max) * 0.7
                            ? "#10b981"
                            : Number(item.points) >= Number(item.max) * 0.4
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    >
                      {Number(item.points)}
                    </span>
                    <span className="text-gray-600">/{Number(item.max)}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(Number(item.points) / Number(item.max)) * 100}%`,
                      background:
                        Number(item.points) >= Number(item.max) * 0.7
                          ? "#10b981"
                          : Number(item.points) >= Number(item.max) * 0.4
                          ? "#f59e0b"
                          : "#ef4444",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{String(item.reason)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.claims && Object.keys(report.claims).length > 0 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-400 mb-4">
            Extracted Claims
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(report.claims)
              .filter(([k, v]) => v && k !== "rawText")
              .map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col gap-1 p-3 bg-white/3 rounded-lg"
                >
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="text-sm font-mono break-all">
                    {String(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-600">
        Generated by XFlight BlackBox · X Layer · {new Date(report.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
