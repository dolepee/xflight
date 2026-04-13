# XFlight BlackBox

**Agent Proof Court for X Layer**

XFlight verifies autonomous agent claims on X Layer. Paste a Moltbook BuildX post, wallet, or tx hash; XFlight extracts claims, checks public on-chain evidence, scores proof quality, and attests the verification report on X Layer.

---

## Two Submissions

### 1. X Layer Arena: XFlight BlackBox (Web App)

Full web app at `/` — targets X Layer Arena.

### 2. Skills Arena: xflight-skill

Reusable skill package — targets Skills Arena.

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/YOUR_REPO/xflight.git
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
│   │   ├── verify/route.ts      Core verification endpoint
│   │   ├── proof/[id]/route.ts  Fetch proof by ID
│   │   └── posts/route.ts      Fetch BuildX posts
│   ├── verify/page.tsx          Verify page
│   ├── preflight/page.tsx       Preflight + postflight
│   ├── proof/[id]/page.tsx      Shareable proof card
│   └── skill/page.tsx           Skill documentation
├── lib/
│   ├── chains.ts                X Layer chain config
│   ├── moltbook.ts              Moltbook API client + scrape
│   ├── claims.ts                AI + regex claim extraction
│   ├── flightScorer.ts          Deterministic 0-100 scorer
│   ├── reportStore.ts           In-memory report store
│   └── attestation.ts           X Layer on-chain writer
├── contracts/
│   └── XFlightRecorder.sol      Minimal attestation contract
├── scripts/
│   └── deploy.ts                Deploy script
└── xflight-skill/
    ├── SKILL.md                 OpenClaw skill manifest
    └── src/index.ts             Skill API wrapper
```

---

## X Layer Deployment

| Item | Value |
|------|-------|
| Chain ID | 196 |
| RPC | https://rpc.xlayer.tech |
| Explorer | https://www.oklink.com/xlayer |
| Contract | `XFlightRecorder.sol` |
| Function | `recordReport(bytes32,bytes32,string,uint8)` |
| Event | `ReportRecorded(bytes32,bytes32,string,uint8,address,uint256)` |

Contract address will be filled after running `npm run deploy`.

---

## Demo Flow

1. Open app at `http://localhost:3000`
2. Go to **Verify** tab
3. Paste a Moltbook BuildX post URL
4. XFlight extracts claims: agent name, wallet, tx count, PnL, contracts, links
5. XFlight generates Flight Score (0-100) with full breakdown
6. XFlight writes report hash to X Layer via `XFlightRecorder`
7. Click the **proof card** link to see the shareable report

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
- X Layer Proof (30 pts): wallet, txs, contracts on-chain
- Claim Consistency (20 pts): stated txs, chain, action match
- OnchainOS/Uniswap Evidence (15 pts): skill usage visible
- Execution Continuity (15 pts): multiple timestamped actions
- Proof Completeness (10 pts): GitHub, demo, links present
- Risk Hygiene (10 pts): no obvious fake PnL or suspicious signals

---

## xflight-skill

```bash
npm install xflight-skill
```

```typescript
import { xflight } from 'xflight-skill';

// Verify a Moltbook post
const result = await xflight.verifyMoltbookPost({
  url: "https://www.moltbook.com/posts/abc123"
});
console.log(result.score, result.verdict, result.proofUrl);

// Verify a tx hash
const tx = await xflight.verifyTx({
  txHash: "0x..."
});
console.log(tx.verdict);

// Verify a wallet
const wallet = await xflight.verifyWallet({
  address: "0x..."
});

// Generate proof card
const card = await xflight.generateProofCard({
  reportId: result.reportId
});

// Attest on X Layer
await xflight.attestReport({ reportId: result.reportId });
```

---

## Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract XFlightRecorder {
    uint256 public reportCount;

    event ReportRecorded(
        bytes32 indexed reportId,
        bytes32 indexed reportHash,
        string projectUrl,
        uint8 score,
        address indexed verifier,
        uint256 timestamp
    );

    function recordReport(
        bytes32 reportId,
        bytes32 reportHash,
        string calldata projectUrl,
        uint8 score
    ) external {
        reportCount++;
        emit ReportRecorded(reportId, reportHash, projectUrl, score, msg.sender, block.timestamp);
    }
}
```

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

XFlight BlackBox — Built for the X Layer Hackathon

---

## License

MIT
