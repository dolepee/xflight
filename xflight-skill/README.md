# xflight-skill

**Reusable proof verification skill for autonomous agents on X Layer.**

Part of the XFlight BlackBox project. This skill exposes the XFlight verification engine as agent-callable commands for OpenClaw / OnchainOS.

## Quick Start

```bash
npm install xflight-skill
```

```typescript
import { xflight } from 'xflight-skill';

// Verify a Moltbook BuildX post
const result = await xflight.verifyMoltbookPost({
  url: "https://www.moltbook.com/posts/abc123"
});

// Check the Flight Score
console.log(result.score);       // 0-100
console.log(result.verdict);     // strongly_verified | mostly_verified | ...
console.log(result.proofUrl);    // Shareable proof card URL

// Attest on X Layer
await xflight.attest_report({ reportId: result.reportId });
```

## Configuration

```typescript
xflight.configure({
  apiUrl: 'https://your-xflight-app.com',  // Your deployed XFlight instance
  rpcUrl: 'https://rpc.xlayer.tech',       // X Layer RPC
  openaiApiKey: 'sk-...',                   // Optional: enables AI claim extraction
});
```

## Commands

### xflight.verify_moltbook_post

```json
{ "url": "https://www.moltbook.com/posts/abc123" }
```

Verifies a Moltbook BuildX post. Extracts claims (wallet, txs, PnL, contracts, links), scores evidence against a 0-100 Flight Score, and generates a shareable proof card.

**Output:**
```json
{
  "reportId": "uuid",
  "reportHash": "0x...",
  "score": 72,
  "verdict": "mostly_verified",
  "claims": { ... },
  "breakdown": [ ... ],
  "attestation": { "success": true, "txHash": "0x..." },
  "proofUrl": "https://your-app.com/proof/uuid"
}
```

### xflight.verify_tx

```json
{ "txHash": "0xabc123...", "chain": "xlayer" }
```

Verifies a transaction hash on X Layer. Checks sender, block number, gas used, and status.

### xflight.verify_wallet

```json
{ "address": "0x..." }
```

Verifies a wallet address on X Layer. Checks existence, tx count, and contract deployments.

### xflight.generate_proof_card

```json
{ "reportId": "uuid" }
```

Generates a shareable proof card from a verification report.

### xflight.attest_report

```json
{ "reportId": "uuid" }
```

Writes a report hash to XFlightRecorder on X Layer. Requires configured private key.

## Flight Score Reference

| Score | Verdict |
|-------|---------|
| 85-100 | Strongly Verified |
| 70-84 | Mostly Verified |
| 50-69 | Partially Verified |
| 25-49 | Weak Proof |
| 0-24 | Unverified |

**Scoring dimensions:**
- X Layer Proof (30 pts): wallet, txs, contracts on-chain
- Claim Consistency (20 pts): stated txs, chain, action match
- OnchainOS/Uniswap Evidence (15 pts): skill usage visible
- Execution Continuity (15 pts): multiple timestamped actions
- Proof Completeness (10 pts): GitHub, demo, links present
- Risk Hygiene (10 pts): no obvious fake PnL or suspicious signals

## Architecture

The skill calls the XFlight web API. All heavy logic (Moltbook fetching, claim extraction, scoring, on-chain attestation) lives in the backend. The skill is a thin wrapper providing the OpenClaw/OnchainOS command interface.

## Contract

`XFlightRecorder` deployed on X Layer (Chain ID 196):
- Function: `recordReport(bytes32 reportId, bytes32 reportHash, string projectUrl, uint8 score)`
- Event: `ReportRecorded(bytes32 reportId, bytes32 reportHash, string projectUrl, uint8 score, address verifier, uint256 timestamp)`

## License

MIT
