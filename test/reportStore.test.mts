import assert from "node:assert/strict";
import test from "node:test";
import { encodeReportToken } from "../lib/reportCodec.ts";
import { generateReportHash, hydrateReportFromToken, type XFlightReport } from "../lib/reportStore.ts";

function makeReport(): XFlightReport {
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

test("report token round-trips to the same report", () => {
  const report = makeReport();
  const token = encodeReportToken(report);
  const hydrated = hydrateReportFromToken(token, report.id);

  assert.deepEqual(hydrated, report);
});

test("tampered report token is rejected", () => {
  const report = makeReport();
  const tampered = { ...report, score: 99 };
  const token = encodeReportToken(tampered);

  assert.equal(hydrateReportFromToken(token, report.id), null);
});
