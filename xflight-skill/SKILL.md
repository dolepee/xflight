# xflight-skill

Reusable proof verification skill for autonomous agents on X Layer. Part of the XFlight BlackBox project.

## Overview

xflight-skill exposes the XFlight verification engine as agent-callable commands. Any OpenClaw or OnchainOS agent can use it to verify Moltbook BuildX posts, transaction hashes, and wallet addresses — then generate a Flight Score and attest the result on X Layer.

## Commands

### xflight.verify_moltbook_post

**Purpose:** Verify a Moltbook BuildX post — extract claims, score evidence, generate Flight Score.

**Input:**
```json
{
  "url": "https://www.moltbook.com/posts/abc123"
}
```

**Output:**
```json
{
  "reportId": "uuid",
  "reportHash": "0x...",
  "score": 72,
  "verdict": "mostly_verified",
  "explanation": "Core claims have some supporting evidence...",
  "claims": {
    "agentName": "DeFiAgent",
    "walletAddress": "0x1234...",
    "transactionCount": 150,
    "claimedPnl": 12400,
    "onchainosUsed": true,
    "githubUrl": "https://github.com/..."
  },
  "breakdown": [...],
  "attestation": {
    "success": true,
    "txHash": "0x..."
  },
  "proofUrl": "https://your-app.com/proof/uuid"
}
```

### xflight.verify_tx

**Purpose:** Verify a transaction hash on X Layer.

**Input:**
```json
{
  "txHash": "0xabc123...",
  "chain": "xlayer"
}
```

**Output:**
```json
{
  "txHash": "0xabc123...",
  "chain": "X Layer",
  "status": "confirmed",
  "sender": "0x...",
  "blockNumber": 12345678,
  "verdict": "PASS | WARNING | FAILED"
}
```

### xflight.verify_wallet

**Purpose:** Verify a wallet address on X Layer.

**Input:**
```json
{
  "address": "0x..."
}
```

**Output:**
```json
{
  "address": "0x...",
  "exists": true,
  "txCount": 42,
  "contracts": ["0x..."],
  "verdict": "VERIFIED | PARTIAL | UNVERIFIED"
}
```

### xflight.generate_proof_card

**Purpose:** Generate a shareable proof card from a report.

**Input:**
```json
{
  "reportId": "uuid"
}
```

**Output:**
```json
{
  "proofUrl": "https://your-app.com/proof/uuid",
  "reportHash": "0x...",
  "score": 72,
  "verdict": "mostly_verified"
}
```

### xflight.attest_report

**Purpose:** Write a report hash to XFlightRecorder on X Layer.

**Input:**
```json
{
  "reportId": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "txHash": "0x...",
  "blockNumber": 12345678,
  "explorerUrl": "https://www.oklink.com/xlayer/tx/0x..."
}
```

## Flight Score

Transparent 0–100 score for agent claim quality:

| Score | Verdict |
|-------|---------|
| 85–100 | Strongly Verified |
| 70–84 | Mostly Verified |
| 50–69 | Partially Verified |
| 25–49 | Weak Proof |
| 0–24 | Unverified |

**Scoring dimensions:**
- X Layer Proof (30 pts): wallet, txs, contracts on-chain
- Claim Consistency (20 pts): stated txs, chain, action match
- OnchainOS/Uniswap Evidence (15 pts): skill usage visible
- Execution Continuity (15 pts): multiple timestamped actions
- Proof Completeness (10 pts): GitHub, demo, links present
- Risk Hygiene (10 pts): no obvious fake PnL or suspicious claims

## Installation

```bash
npm install xflight-skill
```

## Configuration

```typescript
import { xflight } from 'xflight-skill';

xflight.configure({
  apiUrl: 'https://your-xflight-app.com',
  contractAddress: process.env.XFLIGHT_CONTRACT_ADDRESS,
  privateKey: process.env.ATTESTER_PRIVATE_KEY,
  rpcUrl: process.env.XLAYER_RPC_URL,
});
```

## Architecture

The skill calls the XFlight web API. All heavy logic (Moltbook fetching, claim extraction, scoring, on-chain attestation) lives in the backend. The skill is a thin wrapper providing the OpenClaw/OnchainOS command interface.

## Contract

`XFlightRecorder` deployed on X Layer (Chain ID 196):
- `recordReport(bytes32 reportId, bytes32 reportHash, string projectUrl, uint8 score)`
- Emits `ReportRecorded` event

## Positioning

- **For agents:** Prove your actions. Leave a flight recorder.
- **For judges:** Verify agent claims. Score the proof quality.
- **For the ecosystem:** Standardize agent auditability on X Layer.
