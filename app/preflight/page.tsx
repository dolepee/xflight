"use client";

import { useState } from "react";
import { keccak256, toBytes } from "viem";

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
      // Real wallet verification via API
      const walletRes = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.trim() }),
      });
      const walletData = await walletRes.json();
      if (!walletRes.ok) throw new Error(walletData.error || "Wallet check failed");

      // Deterministic plan hash from action + wallet + timestamp
      const planInput = `${action}|${wallet}|${Date.now()}`;
      const planHash = keccak256(toBytes(planInput));

      // Build risk flags based on real wallet data
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
        route: "OKB → WOKB → USDC (Uniswap V3 path, simulated)",
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Preflight Check</h1>
        <p className="text-gray-400">
          Check agent wallet status on X Layer before execution. Wallet
          verification is live. Route quotes are simulated for demo (no
          DEX integration in this build).
        </p>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">
          Preflight Plan
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Agent Action</label>
            <input
              type="text"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Swap 0.1 OKB to USDC on X Layer"
              className="font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Wallet Address</label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="font-mono text-sm"
            />
          </div>
          <button
            className="btn-primary"
            onClick={runPreflight}
            disabled={loading || !action.trim() || !wallet.trim()}
          >
            {loading ? "Checking..." : "Run Preflight"}
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
          {/* Wallet verification (real) */}
          <div className={`card border-l-4 ${result.walletCheck.hasActivity ? "border-l-emerald-500" : result.walletCheck.exists ? "border-l-yellow-500" : "border-l-red-500"}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${result.walletCheck.hasActivity ? "badge-success" : result.walletCheck.exists ? "badge-warning" : "badge-danger"}`}>
                Wallet {result.walletCheck.verdict}
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Live on chain check</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Address</span>
                <span className="font-mono text-xs">{result.walletCheck.address}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Balance</span>
                <span className="font-mono text-xs">{result.walletCheck.balance} OKB</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Transaction Count</span>
                <span className="font-mono text-xs">{result.walletCheck.txCount}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Is Contract</span>
                <span className="font-mono text-xs">{result.walletCheck.isContract ? "Yes" : "No (EOA)"}</span>
              </div>
            </div>
            {result.riskFlags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-gray-500 uppercase">Risk Flags</span>
                <ul className="mt-1 space-y-0.5">
                  {result.riskFlags.map((flag, i) => (
                    <li key={i} className="text-xs text-yellow-400">⚠ {flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Route plan (simulated) */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge badge-neutral">Route Plan</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Simulated</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {[
                { label: "Action", value: result.action },
                { label: "Route", value: result.route },
                { label: "Expected Output", value: result.expectedOutput },
                { label: "Slippage", value: result.slippage },
                { label: "Gas Estimate", value: result.gasEstimate },
                { label: "Plan Hash", value: result.planHash, mono: true },
              ].map((row) => (
                <div key={row.label} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">{row.label}</span>
                  <span className={`text-xs ${row.mono ? "font-mono break-all" : ""}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Postflight: attach tx */}
          <div className="card">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">
              Attach Execution Transaction
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              After executing the action, paste the X Layer transaction hash to verify it.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={attachedTx}
                onChange={(e) => setAttachedTx(e.target.value)}
                placeholder="0x... (X Layer transaction hash)"
                className="flex-1 font-mono text-sm"
                onKeyDown={(e) => e.key === "Enter" && verifyAttachedTx()}
              />
              <button
                className="btn-primary"
                onClick={verifyAttachedTx}
                disabled={loading || !attachedTx.trim()}
              >
                Postflight Verify
              </button>
            </div>
          </div>

          {postResult && (
            <div className={`card border-l-4 ${
              postResult.verdict === "PASS" ? "border-l-emerald-500" :
              postResult.verdict === "WARNING" ? "border-l-yellow-500" :
              "border-l-red-500"
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${
                  postResult.verdict === "PASS" ? "badge-success" :
                  postResult.verdict === "WARNING" ? "badge-warning" :
                  "badge-danger"
                }`}>
                  {postResult.verdict}
                </span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Live on chain check</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{postResult.explanation}</p>
              {postResult.exists && (
                <a
                  href={`https://www.oklink.com/xlayer/tx/${postResult.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  View on OKLink ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
