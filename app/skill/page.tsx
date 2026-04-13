import Link from "next/link";

export default function SkillPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-xs text-gray-400 mb-4">
          <span className="font-mono">skill</span>
          <span>·</span>
          <span>OpenClaw / OnchainOS</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">xflight-skill</h1>
        <p className="text-gray-400">
          Reusable proof verification skill for autonomous agents on X Layer.
          Verify Moltbook posts, tx hashes, and wallets — generate proof cards and
          attest reports on-chain.
        </p>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Installation</h2>
        <pre className="bg-black/30 rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto">
          {`# Install via npm
npm install xflight-skill

# Or add to your OpenClaw skill config
# See xflight-skill/README.md`}
        </pre>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Available Commands</h2>
        <div className="space-y-4">
          {[
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
              desc: "Verify a wallet on X Layer: existence, tx history hints, contract deployments.",
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
          ].map((tool) => (
            <div key={tool.cmd} className="border-b border-white/5 pb-4 last:border-0">
              <code className="text-sm text-emerald-400 font-mono">{tool.cmd}</code>
              <p className="text-xs text-gray-500 mt-1 mb-2">{tool.args}</p>
              <p className="text-sm text-gray-400">{tool.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Usage Example</h2>
        <pre className="bg-black/30 rounded-lg p-4 text-sm font-mono text-gray-300 overflow-x-auto">
          {`import { xflight } from 'xflight-skill';

// Verify a Moltbook post
const result = await xflight.verify_moltbook_post({
  url: "https://www.moltbook.com/posts/abc123"
});

// Check the Flight Score
console.log(result.score);       // 0-100
console.log(result.verdict);     // strongly_verified | mostly_verified | ...
console.log(result.proofUrl);    // Shareable proof card URL

// Attest on X Layer
await xflight.attest_report({ reportId: result.reportId });`}
        </pre>
      </div>

      <div className="card mb-8">
        <h2 className="font-semibold mb-4">Flight Score Reference</h2>
        <div className="space-y-2 text-sm">
          {[
            { range: "85–100", label: "Strongly Verified", desc: "Multiple independent evidence sources" },
            { range: "70–84", label: "Mostly Verified", desc: "Core claims have supporting evidence" },
            { range: "50–69", label: "Partially Verified", desc: "Some claims confirmed, others unclear" },
            { range: "25–49", label: "Weak Proof", desc: "Limited evidence for claims" },
            { range: "0–24", label: "Unverified", desc: "No verifiable on-chain evidence" },
          ].map((b) => (
            <div key={b.range} className="flex items-center gap-4">
              <span className="font-mono text-xs text-gray-500 w-12">{b.range}</span>
              <span className="badge badge-neutral">{b.label}</span>
              <span className="text-gray-400">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <Link href="/verify">
          <button className="btn-primary">Try in Web App</button>
        </Link>
        <a href="/xflight-skill" className="text-sm text-gray-400 hover:text-white transition self-center">
          View skill package →
        </a>
      </div>
    </div>
  );
}
