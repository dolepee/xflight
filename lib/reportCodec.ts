import { gunzipSync, gzipSync } from "zlib";
import type { XFlightReport } from "./reportStore";

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalize((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function encodeReportToken(report: XFlightReport): string {
  const payload = Buffer.from(stableStringify(report), "utf8");
  return gzipSync(payload).toString("base64url");
}

export function decodeReportToken(token: string): XFlightReport | null {
  try {
    const payload = gunzipSync(Buffer.from(token, "base64url")).toString("utf8");
    return JSON.parse(payload) as XFlightReport;
  } catch {
    return null;
  }
}

export function buildProofUrl(baseUrl: string, report: XFlightReport): string {
  const url = new URL(`/proof/${report.id}`, baseUrl);
  url.searchParams.set("token", encodeReportToken(report));
  return url.toString();
}
