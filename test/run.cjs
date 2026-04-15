process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: "commonjs", moduleResolution: "node" });
require("ts-node/register/transpile-only");
const assert = require("node:assert/strict");
const { extractClaims } = require("../lib/claims.ts");
const { calculateFlightScore } = require("../lib/flightScorer.ts");
const { encodeReportToken } = require("../lib/reportCodec.ts");
const { generateReportHash, hydrateReportFromToken } = require("../lib/reportStore.ts");

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function makeReport() {
  const base = {
    id: "report-1",
    projectUrl: "https://example.com/project",
    score: 72,
    verdict: "mostly_verified",
    claims: { walletAddress: "0x1234567890123456789012345678901234567890" },
    verificationResults: [{ claim: "Wallet on X Layer", status: "verified", detail: "ok" }],
    flightScoreBreakdown: [{ category: "X Layer Proof", points: 10, max: 30, reason: "ok" }],
    explanation: "Looks good",
    timestamp: new Date("2026-04-14T00:00:00.000Z").toISOString(),
    verifier: "XFlight BlackBox v0.2",
  };

  return { ...base, reportHash: generateReportHash(base) };
}

(async () => {
  await run("generic swap wording does not imply Uniswap or X Layer", async () => {
    const claims = await extractClaims("Built a swap bot with 3 transactions and no chain specified.");
    assert.equal(claims.uniswapUsed, false);
    assert.equal(claims.deploymentChain, null);
    assert.equal(claims.transactionCount, 3);
  });

  await run("explicit OnchainOS and X Layer mentions are preserved", async () => {
    const claims = await extractClaims("OnchainOS agent running on X Layer with Uniswap routing.");
    assert.equal(claims.onchainosUsed, true);
    assert.equal(claims.uniswapUsed, true);
    assert.equal(claims.deploymentChain, "X Layer");
  });

  await run("flight score does not over-reward unverified marketing claims", () => {
    const claims = {
      walletAddress: "0x1234567890123456789012345678901234567890",
      transactionCount: 250,
      onchainosUsed: true,
      uniswapUsed: true,
      deploymentChain: null,
    };
    const score = calculateFlightScore(claims, []);
    assert.ok(["unverified", "weak_proof"].includes(score.verdict));
    assert.ok(score.score < 50);
  });

  await run("verified tx evidence drives execution continuity", () => {
    const claims = { walletAddress: "0x1234567890123456789012345678901234567890" };
    const score = calculateFlightScore(claims, [
      {
        claim: "Wallet on X Layer",
        status: "verified",
        detail: "Wallet exists with 12 transactions",
        evidence: { txCount: 12 },
      },
    ]);
    const continuity = score.breakdown.find((item) => item.category === "Execution Continuity");
    assert.equal(continuity && continuity.points, 15);
  });

  await run("report token round-trips to the same report", () => {
    const report = makeReport();
    const token = encodeReportToken(report);
    const hydrated = hydrateReportFromToken(token, report.id);
    assert.deepEqual(hydrated, report);
  });

  await run("tampered report token is rejected", () => {
    const report = makeReport();
    const tampered = { ...report, score: 99 };
    const token = encodeReportToken(tampered);
    assert.equal(hydrateReportFromToken(token, report.id), null);
  });

  console.log("All tests passed");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
