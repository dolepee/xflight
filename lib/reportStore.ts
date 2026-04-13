import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data", "reports");

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
  const data = JSON.stringify({
    id: report.id,
    projectUrl: report.projectUrl,
    score: report.score,
    verdict: report.verdict,
    claims: report.claims,
    timestamp: report.timestamp,
  });
  return "0x" + createHash("sha256").update(data).digest("hex");
}

export function saveReport(report: XFlightReport): void {
  ensureDir();
  const filePath = join(DATA_DIR, `${report.id}.json`);
  writeFileSync(filePath, JSON.stringify(report, null, 2));
}

export function getReport(id: string): XFlightReport | null {
  ensureDir();
  const filePath = join(DATA_DIR, `${id}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function getAllReports(): XFlightReport[] {
  ensureDir();
  try {
    const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    return files
      .map((f) => {
        try {
          return JSON.parse(readFileSync(join(DATA_DIR, f), "utf-8")) as XFlightReport;
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
