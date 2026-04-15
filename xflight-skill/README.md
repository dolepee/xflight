# xflight-skill

Reusable proof-verification skill for autonomous agents on X Layer.

Part of the XFlight BlackBox project. This package exposes the XFlight verification engine as agent-callable commands for OpenClaw / OnchainOS.

## Quick Start

```bash
npm install xflight-skill
```

```typescript
import { xflight } from "xflight-skill";

const result = await xflight.verify_moltbook_post({
  url: "https://www.moltbook.com/posts/abc123",
});

console.log(result.score);
console.log(result.verdict);
console.log(result.proofUrl);

await xflight.attest_report({ reportId: String(result.reportId) });
```

## Configuration

```typescript
xflight.configure({
  apiUrl: "https://your-xflight-app.com",
  rpcUrl: "https://rpc.xlayer.tech",
  privateKey: "0x...", // optional, only needed if you call attest_report
});
```

## Commands

### xflight.verify_moltbook_post

```json
{ "url": "https://www.moltbook.com/posts/abc123" }
```

Verifies a Moltbook BuildX post, direct wallet address, transaction hash, or freeform BuildX text. Extracts claims, scores evidence against a 0-100 Flight Score, and generates a shareable proof card.

### xflight.verify_tx

```json
{ "txHash": "0xabc123...", "chain": "xlayer" }
```

Verifies a transaction hash on X Layer.

### xflight.verify_wallet

```json
{ "address": "0x..." }
```

Verifies a wallet address on X Layer.

### xflight.generate_proof_card

```json
{ "reportId": "uuid" }
```

Fetches a stored or tokenized proof card from the XFlight API.

### xflight.attest_report

```json
{ "reportId": "uuid" }
```

Writes a report hash to `XFlightRecorder` on X Layer. Requires a deployed contract and configured attester key on the XFlight backend.

## Flight Score Reference

| Score | Verdict |
|-------|---------|
| 85-100 | Strongly Verified |
| 70-84 | Mostly Verified |
| 50-69 | Partially Verified |
| 25-49 | Weak Proof |
| 0-24 | Unverified |

## Architecture

The skill calls the XFlight web API. The backend performs Moltbook fetching, claim extraction, scoring, and on-chain attestation. The skill is a thin wrapper that gives agents a stable command interface.

## Contract

`XFlightRecorder` on X Layer records three primitives:
- `commitPlan(bytes32 actionId, bytes32 planHash, string metadataURI)`
- `recordExecution(bytes32 actionId, bytes32 txHash, bytes32 observedHash)`
- `attestReport(bytes32 reportId, bytes32 reportHash, uint8 verdict, uint16 flightScore, string reportURI)`

Only authorized attesters can write to the contract.

## License

MIT
