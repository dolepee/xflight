import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-6">
          <span className="text-xs font-mono">●</span>
          X Layer · Chain ID 196 · Live
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Agent Proof Court
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Paste a Moltbook BuildX post, tx hash, or wallet address.
          XFlight extracts claims, verifies on-chain evidence, scores proof
          quality, and attests the report on X Layer.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        {[
          {
            icon: "🔍",
            title: "Verify Claims",
            desc: "Paste any Moltbook BuildX post. XFlight extracts claims and scores them against on-chain evidence.",
            href: "/verify",
            cta: "Start Verification",
          },
          {
            icon: "✈",
            title: "Preflight Check",
            desc: "Plan an agent action: check routes, slippage, and risk before execution on X Layer.",
            href: "/preflight",
            cta: "Run Preflight",
          },
          {
            icon: "📦",
            title: "xflight-skill",
            desc: "Reusable skill for OpenClaw agents. Call verify, attest, and proof generation from any agent.",
            href: "/skill",
            cta: "View Skill",
          },
        ].map((card) => (
          <div key={card.title} className="card flex flex-col gap-4">
            <span className="text-3xl">{card.icon}</span>
            <h2 className="font-semibold text-lg">{card.title}</h2>
            <p className="text-sm text-gray-400 flex-1">{card.desc}</p>
            <Link href={card.href}>
              <button className="btn-primary w-full">{card.cta}</button>
            </Link>
          </div>
        ))}
      </div>

      <div className="card mb-12">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">
          How It Works
        </h3>
        <div className="grid md:grid-cols-5 gap-4 text-center">
          {[
            { step: "01", label: "Paste URL", icon: "🔗" },
            { step: "02", label: "Extract Claims", icon: "🧠" },
            { step: "03", label: "Score Evidence", icon: "📊" },
            { step: "04", label: "Attest On-Chain", icon: "⛓" },
            { step: "05", label: "Share Proof", icon: "🎫" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs text-gray-500 font-mono">{s.step}</span>
              <span className="text-sm">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-400">
          Flight Score Scale
        </h3>
        <div className="space-y-3">
          {[
            { range: "85–100", label: "Strongly Verified", color: "bg-emerald-500/20 text-emerald-400", desc: "Multiple independent evidence sources" },
            { range: "70–84", label: "Mostly Verified", color: "bg-blue-500/20 text-blue-400", desc: "Core claims have supporting evidence" },
            { range: "50–69", label: "Partially Verified", color: "bg-yellow-500/20 text-yellow-400", desc: "Some claims confirmed, others unclear" },
            { range: "25–49", label: "Weak Proof", color: "bg-orange-500/20 text-orange-400", desc: "Limited evidence for claims" },
            { range: "0–24", label: "Unverified", color: "bg-red-500/20 text-red-400", desc: "No verifiable on-chain evidence" },
          ].map((band) => (
            <div key={band.range} className="flex items-center gap-4">
              <span className="font-mono text-xs text-gray-500 w-12">{band.range}</span>
              <span className={`badge ${band.color.replace("bg-", "badge-").replace("/20", "")}`}>
                {band.label}
              </span>
              <span className="text-sm text-gray-500">{band.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
