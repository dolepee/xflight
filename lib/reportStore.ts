import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { decodeReportToken, stableStringify } from "./reportCodec";

const DATA_DIR = process.env.XFLIGHT_REPORTS_DIR || join(process.cwd(), "data", "reports");

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface XFlightReport {
  id: string;
  reportHash: string;
  projectUrl: string;
  score: number;
  verdict: string;
  claims: Record<string, unknown>;
  verificationResults: unknown[];
  flightScoreBreakdown: unknown[];
  explanation: string;
  txHash?: string;
  blockNumber?: number;
  timestamp: string;
  verifier: string;
}

export function generateReportId(): string {
  return uuidv4();
}

export function generateReportHash(report: Omit<XFlightReport, "reportHash">): string {
  const data = stableStringify({
    id: report.id,
    projectUrl: report.projectUrl,
    score: report.score,
    verdict: report.verdict,
    claims: report.claims,
    verificationResults: report.verificationResults,
    flightScoreBreakdown: report.flightScoreBreakdown,
    explanation: report.explanation,
    txHash: report.txHash ?? null,
    blockNumber: report.blockNumber ?? null,
    timestamp: report.timestamp,
    verifier: report.verifier,
  });
  return "0x" + createHash("sha256").update(data).digest("hex");
}

export function isReportValid(report: XFlightReport): boolean {
  const { reportHash, ...rest } = report;
  return generateReportHash(rest) === reportHash;
}

export function saveReport(report: XFlightReport): void {
  ensureDir();
  const filePath = join(DATA_DIR, `${report.id}.json`);
  try {
    writeFileSync(filePath, JSON.stringify(report, null, 2));
  } catch {
    // Proof URLs can still recover from the signed token when storage is ephemeral.
  }
}

export function hydrateReportFromToken(token: string | null, id?: string): XFlightReport | null {
  if (!token) return null;
  const report = decodeReportToken(token);
  if (!report) return null;
  if (id && report.id !== id) return null;
  return isReportValid(report) ? report : null;
}

export function getReport(id: string, token?: string | null): XFlightReport | null {
  ensureDir();
  const filePath = join(DATA_DIR, `${id}.json`);
  if (existsSync(filePath)) {
    try {
      const report = JSON.parse(readFileSync(filePath, "utf-8")) as XFlightReport;
      if (isReportValid(report)) {
        return report;
      }
    } catch {
      // Fall through to token-based recovery.
    }
  }
  return hydrateReportFromToken(token ?? null, id);
}

export function getAllReports(): XFlightReport[] {
  ensureDir();
  try {
    const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    return files
      .map((f) => {
        try {
          const report = JSON.parse(readFileSync(join(DATA_DIR, f), "utf-8")) as XFlightReport;
          return isReportValid(report) ? report : null;
        } catch {
          return null;
        }
      })
      .filter((r): r is XFlightReport => r !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}
