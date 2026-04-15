# XFlight Demo Script

**Target length:** 90-120 seconds
**Target audience:** Hackathon judges, builders

## Pre-recording Setup

1. Open terminal in `/home/qdee/xflight`
2. Ensure wallet is funded: `npm run deploy` (if funded)
3. Start dev server: `npm run dev`
4. Open browser at `http://localhost:3000`
5. Ensure contract is deployed and `XFLIGHT_CONTRACT_ADDRESS` is set in `.env.local`

---

## Recording Script

### Scene 1: The Problem (0:00 - 0:15)

> **VOICEOVER / ON-SCREEN TEXT:**
> 
> "The BuildX field is noisy. Every post claims:
> - I traded successfully
> - I profited $12,000
> - I used OnchainOS
> - I deployed a contract
> 
> But how do you verify any of it?"

**Action:** Show Moltbook BuildX feed (if available) or screenshot of noisy posts.

---

### Scene 2: XFlight Dashboard (0:15 - 0:25)

**Action:** Pan across the XFlight dashboard at `http://localhost:3000`

> "XFlight is the proof layer for autonomous X Layer agents."

**Action:** Click through Dashboard → Verify → Preflight → xflight-skill tabs quickly.

---

### Scene 3: Verify Flow (0:25 - 0:50)

**Action:** Go to `/verify` tab.

> "Let's verify a BuildX post. Paste the URL..."
> 
> "Paste: `https://www.moltbook.com/posts/sample-001`"
> 
> Click **Verify**

**Action:** Show the results appearing:
- Score: 96/100 (Strongly Verified)
- Claims extracted: wallet, txs, PnL, GitHub, contract
- Breakdown bars showing each scoring category
- Report Hash
- Proof Card link

> "XFlight extracts every claim — wallet address, transaction count, claimed PnL, GitHub repo, deployed contract — and scores them."

---

### Scene 4: Proof Card (0:50 - 1:00)

**Action:** Click "View full proof card →" to go to `/proof/[id]`

> "Here's the shareable proof card. Every claim is laid out with verification status."

**Action:** Scroll through the proof card showing score, verdict, breakdown, claims.

---

### Scene 5: On-Chain Attestation (1:00 - 1:10)

**Action:** Scroll to the attestation section.

> "And here's the real power: the report hash is written to X Layer via XFlightRecorder."
> 
> "This attestation is permanent and verifiable by anyone on the explorer."

**Action:** Show the OKLink explorer link if attestation succeeded.

---

### Scene 6: Preflight (1:10 - 1:25)

**Action:** Go to `/preflight` tab.

> "Agents can also run preflight checks before executing — planning routes, checking slippage, and committing plan hashes on-chain."

**Action:** Enter "Swap 0.1 OKB to USDC on X Layer" and a wallet address, click Run Preflight.

**Action:** Show the plan hash generated, then click "Commit Plan Hash to X Layer".

---

### Scene 7: xflight-skill (1:25 - 1:40)

**Action:** Go to `/skill` tab.

> "And for agents that want to verify each other, there's the xflight-skill — callable from any OpenClaw agent."

**Action:** Show the skill commands and code example.

> "xflight.verify_moltbook_post, xflight.verify_tx, xflight.attest_report — all available as simple API calls."

---

### Scene 8: Closing (1:40 - 1:50)

**Action:** Return to dashboard.

> "Agents should not just act. They should leave a flight recorder."
> 
> "XFlight — proof court for X Layer."
> 
> "Check the README for deployment instructions. The contract is live."

**Action:** Show the contract address on-screen if deployed, or show `npm run deploy` command.

---

## Post-Recording

1. Export as MP4 (H.264, 1080p preferred)
2. Upload to YouTube or equivalent
3. Post link with hashtags:
   - `#XLayerHackathon`
   - `#XLayer`
   - `#OnchainOS`
   - `#BuildX`

## Demo Without On-Chain Attestation

If the contract isn't deployed yet, the demo still works. In Scene 5, show:

> "On-chain attestation shows 'pending' — the contract is ready to deploy. Once funded, the report hash will be written permanently to X Layer."

The full UI, claim extraction, scoring, and proof card all work without on-chain deployment.

---

## Fallback: Using Sample Data

If Moltbook API is unreachable, the app falls back to cached sample posts. The demo works identically — claims are still extracted and scored. Just paste the sample post URL shown in the UI.
