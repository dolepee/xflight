# XFlight BlackBox

**Agent Proof Court for X Layer**

XFlight verifies autonomous agent claims on X Layer. Paste a Moltbook BuildX post, wallet, or tx hash; XFlight extracts claims, checks public on-chain evidence, scores proof quality, and attests the verification report on X Layer.

---

## Two Submissions

### 1. X Layer Arena: XFlight BlackBox (Web App)

Full web app with verification, preflight/postflight checks, proof cards, and on-chain attestation. Targets X Layer Arena.

### 2. Skills Arena: xflight-skill

Reusable OpenClaw/OnchainOS-compatible skill package that exposes the same verification engine as agent-callable commands. Targets Skills Arena.

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/dolepee/xflight.git
cd xflight
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local:
#   - Add ATTESTER_PRIVATE_KEY (generated fresh by npm run deploy)
#   - Add XFLIGHT_CONTRACT_ADDRESS (filled after deployment)
#   - Add OPENAI_API_KEY (optional, regex fallback works without it)

# 3. Generate wallet and deploy contract
npm run deploy

# 4. Run development server
npm run dev
```

---

## Architecture

```
xflight/
├── app/
│   ├── api/
│   │   ├── verify/route.ts       Moltbook post verification + scoring
│   │   ├── attest/route.ts       On-chain report attestation
│   │   ├── wallet/route.ts       Real wallet verification via RPC
│   │   ├── tx/route.ts           Real transaction verification via RPC
│   │   ├── proof/[id]/route.ts   Fetch proof report by ID
│   │   └── posts/route.ts        Fetch BuildX post feed
│   ├── verify/page.tsx           Claim verification page
│   ├── preflight/page.tsx        Preflight wallet check + postflight tx verify
│   ├── proof/[id]/page.tsx       Shareable proof card
│   └── skill/page.tsx            Skill documentation
├── lib/
│   ├── chains.ts                 X Layer chain config (ID 196)
│   ├── xlayerVerifier.ts         Real RPC verification (wallet, tx, contract)
│   ├── moltbook.ts               Moltbook API client + scrape
│   ├── claims.ts                 AI + regex claim extraction
│   ├── flightScorer.ts           Deterministic 0-100 scorer
│   ├── reportStore.ts            File-based JSON report persistence
│   └── attestation.ts            X Layer on-chain writer (commitPlan, recordExecution, attestReport)
├── contracts/
│   └── XFlightRecorder.sol       On-chain attestation contract
├── scripts/
│   └── deploy.ts                 Deploy script (auto-generates wallet if needed)
└── xflight-skill/
    ├── SKILL.md                  OpenClaw skill manifest
    ├── README.md                 Skill documentation
    └── src/index.ts              Skill API wrapper
```

---

## X Layer Deployment

| Item | Value |
|------|-------|
| Chain | X Layer Mainnet |
| Chain ID | 196 |
| RPC | https://rpc.xlayer.tech |
| Explorer | https://www.oklink.com/xlayer |
| Contract | `XFlightRecorder.sol` |

### Contract Functions

| Function | Purpose |
|----------|---------|
| `commitPlan(bytes32 actionId, bytes32 planHash, string metadataURI)` | Commit a preflight plan hash |
| `recordExecution(bytes32 actionId, bytes32 txHash, bytes32 observedHash)` | Record execution result |
| `attestReport(bytes32 reportId, bytes32 reportHash, uint8 verdict, uint16 flightScore, string reportURI)` | Attest a verification report |

Contract address is set after running `npm run deploy`.

---

## Demo Flow

### Demo A: Moltbook BuildX Claim Verifier

1. Open app at `http://localhost:3000`
2. Go to **Verify** tab
3. Paste a Moltbook BuildX post URL
4. XFlight extracts claims: agent name, wallet, tx count, PnL, contracts, links
5. XFlight verifies claims against real X Layer RPC data
6. XFlight generates Flight Score (0-100) with full breakdown
7. XFlight writes report hash to X Layer via `XFlightRecorder.attestReport()`
8. Click the **proof card** link to see the shareable report

### Demo B: Preflight/Postflight Verification

1. Go to **Preflight** tab
2. Enter an agent action and wallet address
3. XFlight checks wallet balance, activity, and contract status on X Layer (live RPC)
4. After execution, paste the tx hash for postflight verification
5. XFlight verifies the tx exists, sender matches, and status is confirmed

---

## Flight Score

Transparent 0-100 score with explainable breakdown:

| Score | Verdict |
|-------|---------|
| 85-100 | Strongly Verified |
| 70-84 | Mostly Verified |
| 50-69 | Partially Verified |
| 25-49 | Weak Proof |
| 0-24 | Unverified |

**Scoring (100 pts total):**
- X Layer Proof (30 pts): wallet, txs, contracts verified on-chain
- Claim Consistency (20 pts): stated txs, chain, action match public data
- OnchainOS/Uniswap Evidence (15 pts): skill usage visible
- Execution Continuity (15 pts): multiple timestamped actions
- Proof Completeness (10 pts): GitHub, demo, links present
- Risk Hygiene (10 pts): no fake PnL, contradictions, or suspicious signals

---

## xflight-skill

```typescript
import { xflight } from 'xflight-skill';

xflight.configure({
  apiUrl: "https://xflight.vercel.app", // or localhost:3000
  rpcUrl: "https://rpc.xlayer.tech",
});

// Verify a Moltbook post
const result = await xflight.verify_moltbook_post({
  url: "https://www.moltbook.com/posts/abc123"
});
console.log(result.score, result.verdict, result.proofUrl);

// Verify a wallet (live RPC)
const wallet = await xflight.verify_wallet({ address: "0x..." });
console.log(wallet.verdict, wallet.txCount);

// Verify a transaction (live RPC)
const tx = await xflight.verify_tx({ txHash: "0x..." });
console.log(tx.verdict);

// Generate proof card
const card = await xflight.generate_proof_card({ reportId: result.reportId });

// Attest on X Layer
await xflight.attest_report({ reportId: result.reportId });
```

### Available Commands

| Command | Description |
|---------|-------------|
| `xflight.verify_moltbook_post({ url })` | Extract claims, verify, and score a BuildX post |
| `xflight.verify_tx({ txHash })` | Verify a transaction on X Layer |
| `xflight.verify_wallet({ address })` | Check wallet existence, balance, and activity |
| `xflight.generate_proof_card({ reportId })` | Generate a shareable proof card |
| `xflight.attest_report({ reportId })` | Write report hash to XFlightRecorder on X Layer |

---

## On-Chain Verification

All verification is deterministic and uses real X Layer RPC calls:

- **Wallet check**: `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`
- **Transaction check**: `eth_getTransactionReceipt` (status, sender, block)
- **Contract check**: `eth_getCode` (bytecode presence)
- **Report attestation**: Direct write to XFlightRecorder contract

AI is only used for claim extraction from text. All scoring and verification is deterministic.

---

## Product Positioning

> "Agents should not just act. They should leave a flight recorder."

XFlight is the verification layer for the agent arena. While competitors build trading bots and strategy engines, XFlight answers the question judges and builders are asking:

- Can we verify it?
- Where is the tx?
- Does the wallet match?
- Does the chain match?
- Is the PnL independently provable?
- Is there a reusable proof trail?

---

## Team

XFlight BlackBox | Built for the X Layer Hackathon

---

## License

MIT
