"use client";

import { useState } from "react";
import { keccak256, toBytes } from "viem";
import {
  Wallet,
  Activity,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowDownUp,
} from "lucide-react";

interface WalletCheck {
  address: string;
  exists: boolean;
  balance: string;
  txCount: number;
  hasActivity: boolean;
  isContract: boolean;
  verdict: string;
}

interface PreflightResult {
  action: string;
  walletCheck: WalletCheck;
  fromToken: string;
  toToken: string;
  amount: string;
  expectedOutput: string;
  route: string;
  slippage: string;
  gasEstimate: string;
  planHash: string;
  riskFlags: string[];
}

interface PostflightResult {
  txHash: string;
  exists: boolean;
  status: string;
  from?: string;
  blockNumber?: number;
  matchesWallet: boolean;
  verdict: string;
  explanation: string;
}

export default function PreflightPage() {
  const [action, setAction] = useState("Swap 0.1 OKB to USDC on X Layer");
  const [wallet, setWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [attachedTx, setAttachedTx] = useState("");
  const [postResult, setPostResult] = useState<PostflightResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runPreflight() {
    if (!action.trim() || !wallet.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPostResult(null);

    try {
      const walletRes = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.trim() }),
      });
      const walletData = await walletRes.json();
      if (!walletRes.ok) throw new Error(walletData.error || "Wallet check failed");

      const planInput = `${action}|${wallet}|${Date.now()}`;
      const planHash = keccak256(toBytes(planInput));

      const riskFlags: string[] = [];
      if (!walletData.hasActivity) riskFlags.push("Wallet has no transaction history");
      if (walletData.balance === "0" || walletData.balance === "0.0") riskFlags.push("Wallet has zero OKB balance");
      if (walletData.isContract) riskFlags.push("Address is a contract, not an EOA");

      setResult({
        action,
        walletCheck: walletData,
        fromToken: "OKB",
        toToken: "USDC",
        amount: "0.1",
        expectedOutput: "~$4.85 (simulated quote)",
        route: "OKB > WOKB > USDC (Uniswap V3 path, simulated)",
        slippage: "0.5% default",
        gasEstimate: "~0.002 OKB (estimated)",
        planHash,
        riskFlags,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preflight failed");
    }
    setLoading(false);
  }

  async function verifyAttachedTx() {
    if (!attachedTx.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: attachedTx.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "TX verification failed");

      const matchesWallet = data.from?.toLowerCase() === wallet.trim().toLowerCase();

      let verdict = "UNVERIFIABLE";
      let explanation = "";
      if (!data.exists) {
        verdict = "FAILED";
        explanation = "Transaction not found on X Layer.";
      } else if (data.status === "success" && matchesWallet) {
        verdict = "PASS";
        explanation = `Transaction confirmed on X Layer (block ${data.blockNumber}). Sender matches the preflight wallet.`;
      } else if (data.status === "success" && !matchesWallet) {
        verdict = "WARNING";
        explanation = `Transaction exists but sender (${data.from?.slice(0, 10)}...) does not match the preflight wallet.`;
      } else {
        verdict = "WARNING";
        explanation = `Transaction found but status is "${data.status}".`;
      }

      setPostResult({
        txHash: attachedTx.trim(),
        exists: data.exists,
        status: data.status,
        from: data.from,
        blockNumber: data.blockNumber,
        matchesWallet,
        verdict,
        explanation,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Postflight failed");
    }
    setLoading(false);
  }

  const verdictColor = (v: string) =>
    v === "PASS" ? "#00d4aa" : v === "WARNING" ? "#f5a623" : "#ef4444";

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">Preflight Check</h1>
        <p className="text-[13px] text-[#a1a1aa] mt-2 leading-relaxed">
          Check agent wallet status on X Layer before execution. Wallet
          verification is live. Route quotes are simulated for demo.
        </p>
      </div>

      {/* Input form */}
      <div className="bg-[#141414] border border-[#262626] rounded-md p-6 mb-6">
        <h3 className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase mb-5">
          Preflight Plan
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-[#52525b] uppercase tracking-wider block mb-1.5">
              Agent Action
            </label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Swap 0.1 OKB to USDC on X Layer"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#52525b] uppercase tracking-wider block mb-1.5">
              Wallet Address
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={runPreflight}
            disabled={loading || !action.trim() || !wallet.trim()}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
            {loading ? "Checking..." : "Run Preflight"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-md p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-[#ef4444] mt-0.5 shrink-0" />
          <p className="text-[#ef4444] text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Wallet check */}
          <div
            className="bg-[#141414] border rounded-md p-6"
            style={{
              borderColor: result.walletCheck.hasActivity
                ? "rgba(0,212,170,0.3)"
                : result.walletCheck.exists
                ? "rgba(245,166,35,0.3)"
                : "rgba(239,68,68,0.3)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Wallet size={16} className="text-[#a1a1aa]" />
              <span className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase">
                Wallet Verification — Live
              </span>
              <span
                className="badge ml-auto"
                style={{
                  background: result.walletCheck.hasActivity
                    ? "rgba(0,212,170,0.1)"
                    : result.walletCheck.exists
                    ? "rgba(245,166,35,0.1)"
                    : "rgba(239,68,68,0.1)",
                  color: result.walletCheck.hasActivity
                    ? "#00d4aa"
                    : result.walletCheck.exists
                    ? "#f5a623"
                    : "#ef4444",
                }}
              >
                {result.walletCheck.verdict}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                { label: "Address", value: result.walletCheck.address, mono: true },
                { label: "Balance", value: `${result.walletCheck.balance} OKB`, mono: true },
                { label: "TX Count", value: String(result.walletCheck.txCount), mono: true },
                { label: "Type", value: result.walletCheck.isContract ? "Contract" : "EOA", mono: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]"
                >
                  <span className="text-[11px] text-[#52525b] uppercase tracking-wider">{row.label}</span>
                  <span className={`text-[12px] text-white ${row.mono ? "font-mono" : ""} truncate max-w-[60%]`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            {result.riskFlags.length > 0 && (
              <div className="mt-4 space-y-1">
                {result.riskFlags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-[#f5a623]">
                    <AlertTriangle size={12} />
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Route plan */}
          <div className="bg-[#141414] border border-[#262626] rounded-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowDownUp size={16} className="text-[#a1a1aa]" />
              <span className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase">
                Route Plan — Simulated
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                { label: "Action", value: result.action },
                { label: "Route", value: result.route },
                { label: "Expected Output", value: result.expectedOutput },
                { label: "Slippage", value: result.slippage },
                { label: "Gas Estimate", value: result.gasEstimate },
                { label: "Plan Hash", value: result.planHash, mono: true },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1 p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]"
                >
                  <span className="text-[11px] text-[#52525b] uppercase tracking-wider">{row.label}</span>
                  <span className={`text-[12px] text-white ${row.mono ? "font-mono break-all" : ""}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Postflight */}
          <div className="bg-[#141414] border border-[#262626] rounded-md p-6">
            <h3 className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase mb-4">
              Attach Execution Transaction
            </h3>
            <p className="text-[12px] text-[#52525b] mb-4">
              After executing the action, paste the X Layer transaction hash to verify it.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={attachedTx}
                onChange={(e) => setAttachedTx(e.target.value)}
                placeholder="0x... (X Layer transaction hash)"
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && verifyAttachedTx()}
              />
              <button
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
                onClick={verifyAttachedTx}
                disabled={loading || !attachedTx.trim()}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                Postflight Verify
              </button>
            </div>
          </div>

          {/* Postflight result */}
          {postResult && (
            <div
              className="bg-[#141414] border rounded-md p-6"
              style={{ borderColor: `${verdictColor(postResult.verdict)}30` }}
            >
              <div className="flex items-center gap-3 mb-3">
                {postResult.verdict === "PASS" ? (
                  <CheckCircle2 size={18} style={{ color: verdictColor(postResult.verdict) }} />
                ) : (
                  <XCircle size={18} style={{ color: verdictColor(postResult.verdict) }} />
                )}
                <span
                  className="badge"
                  style={{
                    background: `${verdictColor(postResult.verdict)}15`,
                    color: verdictColor(postResult.verdict),
                  }}
                >
                  {postResult.verdict}
                </span>
                <span className="text-[10px] font-mono text-[#52525b] tracking-widest uppercase">
                  Live on-chain check
                </span>
              </div>
              <p className="text-[13px] text-[#a1a1aa] mb-3">{postResult.explanation}</p>
              {postResult.exists && (
                <a
                  href={`https://www.oklink.com/xlayer/tx/${postResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#52525b] hover:text-[#00d4aa] transition-colors"
                >
                  View on OKLink
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
