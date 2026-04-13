"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck, Terminal, Package, Search, ArrowRight,
  Link as LinkIcon, Brain, BarChart3, Blocks, Share2,
} from "lucide-react";

function AnimatedCounter({ target, color }: { target: number; color: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const dur = 1500, start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / dur, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);
  return <span ref={ref} className="font-mono font-bold" style={{ color }}>{count}</span>;
}

function ScoreRing({ score, color, size = 64 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, off = c - (score / 100) * c;
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <svg width={size} height={size} className="score-ring">
      <circle className="score-ring-track" cx={size/2} cy={size/2} r={r} />
      <circle ref={ref} className="score-ring-fill" cx={size/2} cy={size/2} r={r} stroke={color} strokeDasharray={c} strokeDashoffset={inView ? off : c} />
    </svg>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}>
      {children}
    </motion.div>
  );
}

const steps = [
  { num: "01", label: "Paste URL", icon: LinkIcon },
  { num: "02", label: "Extract Claims", icon: Brain },
  { num: "03", label: "Score Evidence", icon: BarChart3 },
  { num: "04", label: "Attest On-Chain", icon: Blocks },
  { num: "05", label: "Share Proof", icon: Share2 },
];

const scoreBands = [
  { range: "85-100", label: "Strongly Verified", color: "#00d4aa", sample: 92 },
  { range: "70-84", label: "Mostly Verified", color: "#4ade80", sample: 76 },
  { range: "50-69", label: "Partially Verified", color: "#f5a623", sample: 58 },
  { range: "25-49", label: "Weak Proof", color: "#f97316", sample: 35 },
  { range: "0-24", label: "Unverified", color: "#ef4444", sample: 12 },
];

const features = [
  { icon: ShieldCheck, title: "Verify Claims", desc: "Paste any Moltbook BuildX post. XFlight extracts claims and scores them against real on-chain evidence.", href: "/verify", cta: "Start Verification" },
  { icon: Terminal, title: "Preflight Check", desc: "Check wallet status, balance, and activity before execution. Attach a tx hash for postflight verification.", href: "/preflight", cta: "Run Preflight" },
  { icon: Package, title: "xflight-skill", desc: "Reusable OpenClaw / OnchainOS skill. Call verify, attest, and proof generation from any agent runtime.", href: "/skill", cta: "View Skill Docs" },
];

const scoring = [
  { pts: 30, label: "X Layer Proof", detail: "Wallet, txs, contracts on-chain" },
  { pts: 20, label: "Claim Consistency", detail: "Stated data matches public records" },
  { pts: 15, label: "OnchainOS / Uniswap", detail: "Skill usage evidence" },
  { pts: 15, label: "Execution Continuity", detail: "Multiple timestamped actions" },
  { pts: 10, label: "Proof Completeness", detail: "GitHub, demo, links present" },
  { pts: 10, label: "Risk Hygiene", detail: "No contradictions or suspicious signals" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const handleVerify = () => { if (query.trim()) router.push(`/verify?url=${encodeURIComponent(query.trim())}`); };

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-24 pb-20 text-center relative">
        {/* Hero glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, rgba(0,212,170,0.04) 50%, transparent 80%)" }} />

        <Reveal>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight relative">
            <span className="bg-gradient-to-b from-white via-[#e0e0f0] to-[#7c3aed] bg-clip-text text-transparent">Agent Proof</span>
            <br />
            <span className="bg-gradient-to-r from-[#00d4aa] to-[#3b82f6] bg-clip-text text-transparent">Court</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-[#a1a1b5] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Paste a Moltbook BuildX post, tx hash, or wallet address. XFlight
            extracts claims, verifies on-chain evidence, scores proof quality,
            and attests the report on X Layer.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="flex items-center bg-[#0d1117]/80 backdrop-blur-sm border border-[#1e2130] rounded-lg overflow-hidden focus-within:border-[#7c3aed]/50 focus-within:shadow-[0_0_30px_rgba(124,58,237,0.1)] transition-all">
              <div className="pl-4 text-[#52526b]"><Search size={16} /></div>
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="Paste Moltbook URL, Tx Hash, or Wallet Address..."
                className="flex-1 bg-transparent border-none px-3 py-4 text-sm font-mono placeholder:text-[#52526b] focus:ring-0 focus:outline-none"
                style={{ boxShadow: "none" }}
              />
              <button onClick={handleVerify} disabled={!query.trim()} className="btn-primary rounded-none rounded-r-lg px-6 py-4 text-xs font-semibold tracking-wide disabled:opacity-30">Verify</button>
            </div>
            <p className="mt-3 text-[11px] text-[#52526b] font-mono">Supports Moltbook URLs, 0x wallet addresses, and 0x transaction hashes</p>
          </div>
        </Reveal>
      </section>

      <div className="glow-line" />

      {/* Features */}
      <section className="py-20">
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <Link href={f.href} className="group block h-full">
                <div className="card-glow h-full flex flex-col gap-4 p-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.1), rgba(124,58,237,0.1))" }}>
                    <f.icon size={20} strokeWidth={1.5} className="text-[#00d4aa]" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                  <p className="text-[13px] text-[#a1a1b5] leading-relaxed flex-1">{f.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#52526b] group-hover:text-[#00d4aa] transition-colors">
                    {f.cta} <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <Reveal>
          <h2 className="text-xs font-mono text-[#52526b] tracking-widest uppercase mb-12 text-center">Verification Pipeline</h2>
        </Reveal>
        <div className="relative">
          <div className="hidden md:block absolute top-7 left-[10%] right-[10%] h-px" style={{ background: "linear-gradient(90deg, transparent, #1e2130 20%, #1e2130 80%, transparent)" }} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center relative">
                  <motion.div
                    className="w-14 h-14 rounded-xl bg-[#0d1117] border border-[#1e2130] flex items-center justify-center relative z-10"
                    whileInView={{ borderColor: "rgba(124,58,237,0.4)", boxShadow: "0 0 20px rgba(0,212,170,0.1), 0 0 40px rgba(124,58,237,0.05)" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.4, duration: 0.5 }}
                  >
                    <s.icon size={20} strokeWidth={1.5} className="text-[#00d4aa]" />
                  </motion.div>
                  <span className="mt-3 text-[10px] font-mono text-[#52526b] tracking-widest">{s.num}</span>
                  <span className="mt-1 text-[13px] font-medium text-white">{s.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* Flight Score */}
      <section className="py-20">
        <Reveal>
          <div className="rounded-xl border border-[#1e2130] overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(13,17,23,0.9) 0%, rgba(6,8,13,0.95) 100%)" }}>
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-[#a1a1b5] bg-clip-text text-transparent">Flight Score</h2>
                <span className="text-[10px] font-mono text-[#52526b] tracking-widest uppercase">Risk Assessment</span>
              </div>
              <p className="text-[12px] text-[#52526b] mb-8">Deterministic 0-100 verification rating based on real on-chain evidence</p>

              {/* Score rings */}
              <div className="flex flex-wrap justify-center gap-10 mb-10">
                {scoreBands.map((b) => (
                  <div key={b.range} className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <ScoreRing score={b.sample} color={b.color} />
                      <span className="absolute text-[13px]"><AnimatedCounter target={b.sample} color={b.color} /></span>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: b.color }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier bars */}
            <div className="px-8 pb-6 space-y-2">
              {scoreBands.map((b, i) => (
                <Reveal key={b.range} delay={i * 0.06}>
                  <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: `${b.color}06` }}>
                    <span className="font-mono text-[11px] w-14 text-right font-medium" style={{ color: b.color }}>{b.range}</span>
                    <div className="flex-1 h-1.5 bg-[#111520] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${b.color}, ${b.color}88)` }} initial={{ width: 0 }} whileInView={{ width: `${b.sample}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.1 + i * 0.08, ease: "easeOut" }} />
                    </div>
                    <span className="text-[11px] font-medium w-32 text-right" style={{ color: b.color }}>{b.label}</span>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Breakdown */}
            <div className="border-t border-[#1e2130] p-8">
              <h3 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-5">Scoring Breakdown (100 pts)</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scoring.map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.04}>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#080b10] border border-[#151a25] hover:border-[#1e2130] transition-colors">
                      <span className="font-mono text-sm font-bold bg-gradient-to-b from-[#00d4aa] to-[#3b82f6] bg-clip-text text-transparent mt-px">{s.pts}</span>
                      <div>
                        <span className="text-[12px] font-medium text-white block">{s.label}</span>
                        <span className="text-[11px] text-[#52526b]">{s.detail}</span>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
