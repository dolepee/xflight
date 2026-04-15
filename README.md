# XFlight BlackBox

XFlight is a verification layer for autonomous agents on X Layer.

It takes a Build X claim source such as a Moltbook post, wallet address, transaction hash, or freeform project text, extracts concrete claims, verifies them against live X Layer and OKX OnchainOS data, produces a deterministic Flight Score, and attests the report onchain through an authorized agentic wallet.

Live app: https://xflight.vercel.app

## Why this exists

Build X submissions make claims about:
- wallet ownership
- transaction count
- contract deployment
- OnchainOS usage
- PnL and execution history

Most of those claims are easy to post and hard to verify quickly. XFlight turns them into a repeatable verification flow with an evidence trail, a score breakdown, and an onchain attestation.

## OKX Build X fit

XFlight is designed for the OKX Build X Hackathon and satisfies the core X Layer expectations:

| Requirement | How XFlight satisfies it |
|---|---|
| Agentic Wallet | `ATTESTER_PRIVATE_KEY` controls the autonomous attester wallet exposed at `GET /api/agentic-wallet`. |
| OnchainOS / Uniswap skills | `lib/onchainos.ts` integrates OKX DEX Aggregator and Wallet Portfolio APIs; `/api/quote` falls back to Uniswap V3 quote discovery when needed. |
| X Layer deployment | `XFlightRecorder` is deployed on X Layer and stores plan, execution, and report attestations. |

## Core flow

1. Input a Moltbook URL, wallet address, transaction hash, or freeform text.
2. Extract structured claims such as wallet, tx count, contract, links, and claimed tool usage.
3. Verify those claims against X Layer RPC and OnchainOS responses.
4. Score the evidence with a deterministic 0-100 Flight Score.
5. Build a proof card.
6. Optionally attest the report on X Layer through the authorized attester wallet.

## Trust model

The main trust guarantees are:
- only authorized attesters can write to `XFlightRecorder`
- report hashes are validated before stored reports are served
- proof links include a tokenized report payload so they remain recoverable even if local storage is ephemeral
- sample Moltbook posts are opt-in only via `ALLOW_SAMPLE_POSTS=true`; production verification hard-fails on fetch failure
- the score is deterministic; AI is used for extraction and explanation, not scoring

## Contract

`contracts/XFlightRecorder.sol`

Functions:
- `commitPlan(bytes32 actionId, bytes32 planHash, string metadataURI)`
- `recordExecution(bytes32 actionId, bytes32 txHash, bytes32 observedHash)`
- `attestReport(bytes32 reportId, bytes32 reportHash, uint8 verdict, uint16 flightScore, string reportURI)`

Important:
- writes are restricted to authorized attesters
- owner can rotate or revoke attesters

## App surface

API routes:
- `/api/verify` - extract claims, verify, score, build proof, optionally attest
- `/api/attest` - attest an existing report
- `/api/proof/[id]` - fetch a stored or tokenized proof report
- `/api/wallet` - wallet verification on X Layer
- `/api/tx` - transaction verification on X Layer
- `/api/quote` - OKX quote first, Uniswap fallback second
- `/api/portfolio` - OnchainOS wallet portfolio
- `/api/agentic-wallet` - public attester wallet status

Pages:
- `/verify` - verification UI
- `/proof/[id]` - shareable proof card
- `/preflight` - preflight / postflight explorer
- `/skill` - skill documentation

## Flight Score

Flight Score is deterministic and capped at 100.

Buckets:
- X Layer Proof (30)
- Claim Consistency (20)
- OnchainOS / Uniswap Evidence (15)
- Execution Continuity (15)
- Proof Completeness (10)
- Risk Hygiene (10)

Verdicts:
- 85-100: `strongly_verified`
- 70-84: `mostly_verified`
- 50-69: `partially_verified`
- 25-49: `weak_proof`
- 0-24: `unverified`

Scoring is intentionally conservative after the audit hardening pass. Keyword mentions alone should not score highly.

## Quick start

```bash
git clone https://github.com/dolepee/xflight.git
cd xflight
npm install
cp .env.example .env.local
npm run deploy
npm run dev
```

Useful env vars:
- `ATTESTER_PRIVATE_KEY`
- `XFLIGHT_CONTRACT_ADDRESS`
- `XLAYER_RPC_URL`
- `DGRID_API_KEY`
- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_PASSPHRASE`
- `ALLOW_SAMPLE_POSTS=true` only for offline demos

## Local verification

```bash
npm test
npm run build
npm run lint
```

## Skill package

The repo also includes `xflight-skill`, a thin agent wrapper over the web API.

Main commands:
- `xflight.verify_moltbook_post`
- `xflight.verify_tx`
- `xflight.verify_wallet`
- `xflight.generate_proof_card`
- `xflight.attest_report`


## Repository

- App: https://xflight.vercel.app
- Repo: https://github.com/dolepee/xflight

## License

MIT