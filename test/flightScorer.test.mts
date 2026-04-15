import assert from "node:assert/strict";
import test from "node:test";
import { calculateFlightScore, type VerificationResult } from "../lib/flightScorer.ts";

test("flight score does not over-reward unverified marketing claims", () => {
  const claims = {
    walletAddress: "0x1234567890123456789012345678901234567890",
    transactionCount: 250,
    onchainosUsed: true,
    uniswapUsed: true,
    deploymentChain: null,
  };
  const results: VerificationResult[] = [];
  const score = calculateFlightScore(claims, results);

  assert.equal(score.verdict, "weak_proof");
  assert.ok(score.score < 50);
});

test("verified tx evidence drives execution continuity", () => {
  const claims = { walletAddress: "0x1234567890123456789012345678901234567890" };
  const results: VerificationResult[] = [
    {
      claim: "Wallet on X Layer",
      status: "verified",
      detail: "Wallet exists with 12 transactions",
      evidence: { txCount: 12 },
    },
  ];

  const score = calculateFlightScore(claims, results);
  const continuity = score.breakdown.find((item) => item.category === "Execution Continuity");

  assert.equal(continuity?.points, 15);
});
