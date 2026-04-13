"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
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

/* ── Animated Counter ── */
function AnimatedCounter({ target, color }: { target: number; color: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setCount(start);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-mono font-bold" style={{ color }}>
      {count}
    </span>
  );
}

/* ── Score Ring SVG ── */
function ScoreRing({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const ref = useRef<SVGCircleElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <svg width={size} height={size} className="score-ring">
      <circle className="score-ring-track" cx={size / 2} cy={size / 2} r={radius} />
      <circle
        ref={ref}
        className="score-ring-fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={inView ? offset : circumference}
      />
    </svg>
  );
}

/* ── Section Reveal ── */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ── */
const steps = [
  { num: "01", label: "Paste URL", icon: LinkIcon, desc: "Submit a Moltbook post, tx hash, or wallet" },
  { num: "02", label: "Extract Claims", icon: Brain, desc: "AI parses agent name, wallet, txs, PnL" },
  { num: "03", label: "Score Evidence", icon: BarChart3, desc: "Deterministic 0-100 Flight Score" },
  { num: "04", label: "Attest On-Chain", icon: Blocks, desc: "Report hash written to X Layer" },
  { num: "05", label: "Share Proof", icon: Share2, desc: "Public, verifiable proof card" },
];

const scoreBands = [
  { range: "85 - 100", label: "Strongly Verified", color: "#00d4aa", bar: 100, sample: 92 },
  { range: "70 - 84", label: "Mostly Verified", color: "#4ade80", bar: 80, sample: 76 },
  { range: "50 - 69", label: "Partially Verified", color: "#f5a623", bar: 60, sample: 58 },
  { range: "25 - 49", label: "Weak Proof", color: "#f97316", bar: 40, sample: 35 },
  { range: "0 - 24", label: "Unverified", color: "#ef4444", bar: 20, sample: 12 },
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
        <Reveal>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-[#52525b] bg-clip-text text-transparent pb-2">
            Agent Proof Court
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 text-[#a1a1aa] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Paste a Moltbook BuildX post, tx hash, or wallet address. XFlight
            extracts claims, verifies on-chain evidence, scores proof quality,
            and attests the report on X Layer.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
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
                className="flex-1 bg-transparent border-none px-3 py-3.5 text-sm font-mono placeholder:text-[#52525b] focus:ring-0 focus:outline-none"
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
        </Reveal>
      </section>

      <div className="glow-line" />

      {/* Feature Grid */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.1}>
              <Link href={f.href} className="group block h-full">
                <div className="card-glow h-full flex flex-col gap-4 p-6">
                  <div className="w-9 h-9 rounded bg-[rgba(0,212,170,0.08)] flex items-center justify-center text-[#00d4aa] group-hover:bg-[rgba(0,212,170,0.15)] transition-colors">
                    <f.icon size={18} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                  <p className="text-[13px] text-[#a1a1aa] leading-relaxed flex-1">
                    {f.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#52525b] group-hover:text-[#00d4aa] transition-colors">
                    {f.cta}
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works — animated stepper */}
      <section className="py-16">
        <Reveal>
          <h2 className="text-xs font-mono text-[#52525b] tracking-widest uppercase mb-10 text-center">
            How It Works
          </h2>
        </Reveal>
        <div className="relative">
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-px border-t border-dashed border-[#262626]" />

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={i * 0.12}>
                <div className="flex flex-col items-center text-center relative">
                  <motion.div
                    className="w-12 h-12 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-[#52525b] relative z-10"
                    whileInView={{
                      borderColor: "#00d4aa",
                      color: "#00d4aa",
                      boxShadow: "0 0 12px rgba(0,212,170,0.25)",
                    }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.5, duration: 0.4 }}
                  >
                    <s.icon size={18} strokeWidth={1.5} />
                  </motion.div>
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Flight Score Dashboard */}
      <section className="py-16">
        <Reveal>
          <div className="bg-[#141414] border border-[#262626] rounded-md p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[15px] font-semibold text-white">Flight Score Dashboard</h2>
                <p className="text-[12px] text-[#52525b] mt-1">Deterministic 0-100 verification rating</p>
              </div>
              <span className="text-[10px] font-mono text-[#52525b] tracking-widest uppercase">
                Risk Assessment
              </span>
            </div>

            {/* Score rings preview */}
            <div className="flex flex-wrap justify-center gap-8 mb-10">
              {scoreBands.map((band) => (
                <div key={band.range} className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <ScoreRing score={band.sample} color={band.color} size={64} />
                    <span className="absolute text-[13px] font-mono font-bold" style={{ color: band.color }}>
                      <AnimatedCounter target={band.sample} color={band.color} />
                    </span>
                  </div>
                  <span className="text-[10px] text-[#52525b] font-mono">{band.range}</span>
                  <span className="text-[10px] font-medium" style={{ color: band.color }}>
                    {band.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Tier bars */}
            <div className="space-y-3">
              {scoreBands.map((band, i) => (
                <Reveal key={band.range} delay={i * 0.08}>
                  <div
                    className="flex items-center gap-4 p-3 rounded"
                    style={{ background: `${band.color}08` }}
                  >
                    <span
                      className="font-mono text-xs w-16 text-right font-medium"
                      style={{ color: band.color }}
                    >
                      {band.range}
                    </span>
                    <div className="flex-1 flex items-center gap-3">
                      <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: band.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${band.bar}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
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
                </Reveal>
              ))}
            </div>

            {/* Scoring categories */}
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
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 0.05}>
                    <div className="flex items-start gap-3 p-3 rounded bg-[#0a0a0a] border border-[#1a1a1a]">
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
