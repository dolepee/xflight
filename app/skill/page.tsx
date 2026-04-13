import Link from "next/link";
import { Terminal, Package, ArrowRight } from "lucide-react";

const commands = [
  {
    cmd: "xflight.verify_moltbook_post",
    args: "{ url: string }",
    desc: "Verify a Moltbook BuildX post: extract claims, score evidence, generate Flight Score.",
  },
  {
    cmd: "xflight.verify_tx",
    args: "{ txHash: string, chain?: string }",
    desc: "Verify a transaction hash on X Layer: sender, token transfers, route match.",
  },
  {
    cmd: "xflight.verify_wallet",
    args: "{ address: string }",
    desc: "Verify a wallet on X Layer: existence, tx history, contract deployments.",
  },
  {
    cmd: "xflight.generate_proof_card",
    args: "{ reportId: string }",
    desc: "Generate a shareable proof card from a verification report.",
  },
  {
    cmd: "xflight.attest_report",
    args: "{ reportId: string }",
    desc: "Write a report hash to XFlightRecorder on X Layer.",
  },
];

const scoreBands = [
  { range: "85-100", label: "Strongly Verified", color: "#00d4aa" },
  { range: "70-84", label: "Mostly Verified", color: "#4ade80" },
  { range: "50-69", label: "Partially Verified", color: "#f5a623" },
  { range: "25-49", label: "Weak Proof", color: "#f97316" },
  { range: "0-24", label: "Unverified", color: "#ef4444" },
];

export default function SkillPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Package size={18} className="text-[#00d4aa]" />
          <span className="text-[11px] font-mono text-[#52526b] tracking-widest">
            SKILL · OPENCLAW / ONCHAINOS
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">xflight-skill</h1>
        <p className="text-[13px] text-[#a1a1b5] mt-2 leading-relaxed">
          Reusable proof verification skill for autonomous agents on X Layer.
          Verify Moltbook posts, tx hashes, and wallets. Generate proof cards and
          attest reports on-chain.
        </p>
      </div>

      {/* Installation */}
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6 mb-4">
        <h2 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
          Installation
        </h2>
        <div className="bg-[#06080d] rounded border border-[#151a25] p-4">
          <pre className="text-[13px] font-mono text-[#a1a1b5] overflow-x-auto">
{`npm install xflight-skill`}
          </pre>
        </div>
      </div>

      {/* Commands */}
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6 mb-4">
        <h2 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
          Available Commands
        </h2>
        <div className="space-y-1">
          {commands.map((tool) => (
            <div
              key={tool.cmd}
              className="p-4 rounded bg-[#06080d] border border-[#151a25] hover:border-[rgba(0,212,170,0.2)] transition-colors"
            >
              <div className="flex items-start gap-2">
                <Terminal size={14} className="text-[#00d4aa] mt-0.5 shrink-0" />
                <div>
                  <code className="text-[13px] text-[#00d4aa] font-mono font-medium">{tool.cmd}</code>
                  <p className="text-[11px] font-mono text-[#52526b] mt-0.5">{tool.args}</p>
                  <p className="text-[12px] text-[#a1a1b5] mt-1.5">{tool.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage */}
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6 mb-4">
        <h2 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
          Usage Example
        </h2>
        <div className="bg-[#06080d] rounded border border-[#151a25] p-4">
          <pre className="text-[13px] font-mono text-[#a1a1b5] overflow-x-auto leading-relaxed">
{`import { xflight } from 'xflight-skill';

xflight.configure({
  apiUrl: "https://xflight.vercel.app",
  rpcUrl: "https://rpc.xlayer.tech",
});

// Verify a Moltbook post
const result = await xflight.verify_moltbook_post({
  url: "https://www.moltbook.com/posts/abc123"
});

console.log(result.score);       // 0-100
console.log(result.verdict);     // strongly_verified | ...
console.log(result.proofUrl);    // Shareable proof card URL

// Attest on X Layer
await xflight.attest_report({
  reportId: result.reportId
});`}
          </pre>
        </div>
      </div>

      {/* Score reference */}
      <div className="bg-[#0d1117] border border-[#1e2130] rounded-md p-6 mb-8">
        <h2 className="text-[11px] font-mono text-[#52526b] tracking-widest uppercase mb-4">
          Flight Score Reference
        </h2>
        <div className="space-y-2">
          {scoreBands.map((b) => (
            <div
              key={b.range}
              className="flex items-center gap-4 p-2 rounded"
              style={{ background: `${b.color}08` }}
            >
              <span className="font-mono text-[11px] w-14 text-right" style={{ color: b.color }}>
                {b.range}
              </span>
              <div className="w-2 h-2 rounded-sm" style={{ background: b.color }} />
              <span className="text-[12px] text-[#a1a1b5]">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/verify">
          <button className="btn-primary flex items-center gap-2">
            Try in Web App
            <ArrowRight size={14} />
          </button>
        </Link>
        <a
          href="https://github.com/dolepee/xflight/tree/master/xflight-skill"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}
