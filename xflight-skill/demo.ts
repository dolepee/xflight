#!/usr/bin/env node

import { xflight } from "./src/index.js";

xflight.configure({
  apiUrl: process.env.XFLIGHT_API_URL || "http://localhost:3000",
  rpcUrl: process.env.XLAYER_RPC_URL || "https://rpc.xlayer.tech",
});

async function demo() {
  console.log("=== XFlight Skill Demo ===\n");

  console.log("1. Verifying a Moltbook BuildX post...");
  const post = await xflight.verify_moltbook_post({
    url: "https://www.moltbook.com/posts/sample-001",
  });
  console.log(`   Score: ${post.score}/100`);
  console.log(`   Verdict: ${post.verdict}`);
  console.log(`   Proof URL: ${post.proofUrl}`);
  console.log(`   Report Hash: ${(post.reportHash as string).slice(0, 20)}...`);
  console.log(`   Claims extracted:`);
  const claims = post.claims as Record<string, unknown>;
  Object.entries(claims).forEach(([k, v]) => {
    if (v && k !== "rawText") console.log(`     - ${k}: ${v}`);
  });

  if (post.attestation) {
    const att = post.attestation as Record<string, unknown>;
    console.log(`\n2. On-chain attestation:`);
    if (att.success) {
      console.log(`   TX Hash: ${att.txHash}`);
      console.log(`   Explorer: ${att.explorerUrl}`);
    } else {
      console.log(`   Status: Pending (${att.note || "contract not deployed"})`);
    }
  }

  console.log("\n3. Verifying a wallet...");
  const wallet = await xflight.verify_wallet({
    address: "0x1234567890abcdef1234567890abcdef12345678",
  });
  console.log(`   Verdict: ${wallet.verdict}`);
  console.log(`   TX Count: ${wallet.txCount}`);

  console.log("\n4. Generating proof card...");
  try {
    const card = await xflight.generate_proof_card({ reportId: post.reportId as string });
    console.log(`   Score: ${card.score}`);
  } catch {
    console.log(`   (Report may have been cleared from store)`);
  }

  console.log("\n=== Demo complete ===");
}

demo().catch(console.error);
