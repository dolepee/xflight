# XFlight Demo Script

Target length: 90-120 seconds
Target audience: Build X judges and builders

## Setup

1. Run `npm run deploy` if the contract or wallet is not ready.
2. Run `npm run dev`.
3. Open `http://localhost:3000`.
4. Confirm `.env.local` has the attester key and contract address.
5. If you need an offline demo, set `ALLOW_SAMPLE_POSTS=true` before starting the app.

## Demo flow

### 1. Problem

Voiceover:
"Build X claims are easy to post and hard to verify. Wallets, tx counts, contracts, tool usage, and even PnL are often presented without evidence."

Action:
Show the homepage and then move into `/verify`.

### 2. Verification run

Voiceover:
"XFlight turns one noisy claim source into a deterministic verification report."

Action:
Paste one of:
- a real Moltbook post URL
- a wallet address
- a transaction hash
- freeform project text

Click `Verify`.

### 3. Explain the result

Voiceover:
"The app extracts concrete claims, checks them against X Layer and OnchainOS, and scores only what is actually evidenced."

Action:
Show:
- score and verdict
- verification rows
- extracted claims
- score breakdown
- report hash

### 4. Proof card

Voiceover:
"Every run gets a shareable proof card. The proof URL carries a tokenized report payload, so it can still be recovered even if local storage is ephemeral."

Action:
Open the proof card.

### 5. Onchain attestation

Voiceover:
"An authorized agentic wallet can attest the report on X Layer."

Action:
Show:
- attestation status
- explorer link
- contract address

### 6. Close

Voiceover:
"Agents should not just act. They should leave a flight recorder. XFlight is the accountability layer for autonomous agents on X Layer."

## Important notes

- Production mode does not silently fall back to sample Moltbook data.
- Offline sample posts are opt-in only with `ALLOW_SAMPLE_POSTS=true`.
- If attestation is unavailable, the verification flow still works, but the report remains unattested.