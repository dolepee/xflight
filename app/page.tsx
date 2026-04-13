"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Terminal,
  Package,
  Search,
  ArrowRight,
  Link as LinkIcon,
  Brain,
  BarChart3,
  Blocks,
  Share2,
} from "lucide-react";

const steps = [
  { num: "01", label: "Paste URL", icon: LinkIcon, desc: "Submit a Moltbook post, tx hash, or wallet" },
  { num: "02", label: "Extract Claims", icon: Brain, desc: "AI parses agent name, wallet, txs, PnL" },
  { num: "03", label: "Score Evidence", icon: BarChart3, desc: "Deterministic 0-100 Flight Score" },
  { num: "04", label: "Attest On-Chain", icon: Blocks, desc: "Report hash written to X Layer" },
  { num: "05", label: "Share Proof", icon: Share2, desc: "Public, verifiable proof card" },
];

const scoreBands = [
  { range: "85 - 100", label: "Strongly Verified", color: "#00d4aa", bg: "rgba(0,212,170,0.08)", bar: 100 },
  { range: "70 - 84", label: "Mostly Verified", color: "#4ade80", bg: "rgba(74,222,128,0.08)", bar: 80 },
  { range: "50 - 69", label: "Partially Verified", color: "#f5a623", bg: "rgba(245,166,35,0.08)", bar: 60 },
  { range: "25 - 49", label: "Weak Proof", color: "#f97316", bg: "rgba(249,115,22,0.08)", bar: 40 },
  { range: "0 - 24", label: "Unverified", color: "#ef4444", bg: "rgba(239,68,68,0.08)", bar: 20 },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Verify Claims",
    desc: "Paste any Moltbook BuildX post. XFlight extracts claims and scores them against real on-chain evidence on X Layer.",
    href: "/verify",
    cta: "Start Verification",
  },
  {
    icon: Terminal,
    title: "Preflight Check",
    desc: "Check wallet status, balance, and activity before execution. Attach a tx hash for postflight verification.",
    href: "/preflight",
    cta: "Run Preflight",
  },
  {
    icon: Package,
    title: "xflight-skill",
    desc: "Reusable skill for OpenClaw / OnchainOS agents. Call verify, attest, and proof generation from any agent runtime.",
    href: "/skill",
    cta: "View Skill Docs",
  },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleVerify() {
    if (!query.trim()) return;
    router.push(`/verify?url=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-white to-[#71717a] bg-clip-text text-transparent pb-2">
          Agent Proof Court
        </h1>
        <p className="mt-5 text-[#a1a1aa] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Paste a Moltbook BuildX post, tx hash, or wallet address. XFlight
          extracts claims, verifies on-chain evidence, scores proof quality,
          and attests the report on X Layer.
        </p>

        {/* Terminal-style search */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="flex items-center bg-[#141414] border border-[#262626] rounded-md overflow-hidden focus-within:border-[#00d4aa] focus-within:shadow-[0_0_0_1px_rgba(0,212,170,0.2)] transition-all">
            <div className="pl-4 text-[#52525b]">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              placeholder="Paste Moltbook URL, Tx Hash, or Wallet Address..."
              className="flex-1 bg-transparent border-none px-3 py-3.5 text-sm font-mono placeholder:text-[#52525b] focus:ring-0 focus:outline-none focus:shadow-none"
              style={{ boxShadow: "none" }}
            />
            <button
              onClick={handleVerify}
              disabled={!query.trim()}
              className="btn-primary rounded-none px-6 py-3.5 text-xs font-semibold tracking-wide disabled:opacity-30"
            >
              Verify
            </button>
          </div>
          <p className="mt-3 text-[11px] text-[#52525b] font-mono">
            Supports Moltbook URLs, 0x wallet addresses, and 0x transaction hashes
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="glow-line" />

      {/* Feature Grid */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link key={f.title} href={f.href} className="group">
              <div className="bg-[#141414] border border-[#262626] rounded-md p-6 h-full flex flex-col gap-4 transition-all group-hover:border-[rgba(0,212,170,0.3)]">
                <div className="w-9 h-9 rounded bg-[rgba(0,212,170,0.08)] flex items-center justify-center text-[#00d4aa]">
                  <f.icon size={18} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                <p className="text-[13px] text-[#a1a1aa] leading-relaxed flex-1">
                  {f.desc}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#52525b] group-hover:text-[#00d4aa] transition-colors">
                  {f.cta}
                  <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <h2 className="text-xs font-mono text-[#52525b] tracking-widest uppercase mb-10 text-center">
          How It Works
        </h2>
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px border-t border-dashed border-[#262626]" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center text-center relative">
                <div className="w-12 h-12 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-[#00d4aa] relative z-10">
                  <s.icon size={18} strokeWidth={1.5} />
                </div>
                <span className="mt-3 text-[10px] font-mono text-[#52525b] tracking-widest">
                  {s.num}
                </span>
                <span className="mt-1 text-[13px] font-medium text-white">
                  {s.label}
                </span>
                <span className="mt-1 text-[11px] text-[#52525b] leading-relaxed max-w-[140px]">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flight Score */}
      <section className="py-16">
        <div className="bg-[#141414] border border-[#262626] rounded-md p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[15px] font-semibold text-white">Flight Score Scale</h2>
              <p className="text-[12px] text-[#52525b] mt-1">Deterministic 0-100 verification rating</p>
            </div>
            <span className="text-[10px] font-mono text-[#52525b] tracking-widest uppercase">
              Risk Assessment
            </span>
          </div>

          <div className="space-y-3">
            {scoreBands.map((band) => (
              <div
                key={band.range}
                className="flex items-center gap-4 p-3 rounded"
                style={{ background: band.bg }}
              >
                <span
                  className="font-mono text-xs w-16 text-right font-medium"
                  style={{ color: band.color }}
                >
                  {band.range}
                </span>
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${band.bar}%`, background: band.color }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-36"
                    style={{ color: band.color }}
                  >
                    {band.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scoring breakdown */}
          <div className="mt-8 pt-6 border-t border-[#262626]">
            <h3 className="text-[11px] font-mono text-[#52525b] tracking-widest uppercase mb-4">
              Scoring Breakdown (100 pts)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { pts: 30, label: "X Layer Proof", detail: "Wallet, txs, contracts on-chain" },
                { pts: 20, label: "Claim Consistency", detail: "Stated data matches public records" },
                { pts: 15, label: "OnchainOS / Uniswap", detail: "Skill usage evidence" },
                { pts: 15, label: "Execution Continuity", detail: "Multiple timestamped actions" },
                { pts: 10, label: "Proof Completeness", detail: "GitHub, demo, links present" },
                { pts: 10, label: "Risk Hygiene", detail: "No contradictions or suspicious signals" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]"
                >
                  <span className="font-mono text-sm font-bold text-[#00d4aa] mt-px">
                    {item.pts}
                  </span>
                  <div>
                    <span className="text-[12px] font-medium text-white block">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-[#52525b]">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
