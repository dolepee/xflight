import { NextRequest, NextResponse } from "next/server";
import { getReport, saveReport } from "@/lib/reportStore";
import { attestReport } from "@/lib/attestation";
import { XLAYER_EXPLORER } from "@/lib/chains";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId } = body as { reportId: string };

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    const report = getReport(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.txHash) {
      return NextResponse.json({
        success: true,
        txHash: report.txHash,
        blockNumber: report.blockNumber,
        explorerUrl: `${XLAYER_EXPLORER}/tx/${report.txHash}`,
        note: "Already attested",
      });
    }

    const contractAddress = process.env.XFLIGHT_CONTRACT_ADDRESS;
    const privateKey = process.env.ATTESTER_PRIVATE_KEY;

    if (!contractAddress || !privateKey || contractAddress.length !== 42) {
      return NextResponse.json({ error: "Contract not deployed. Run: npm run deploy" }, { status: 503 });
    }

    const result = await attestReport(reportId, report.reportHash, report.projectUrl, report.score, contractAddress, privateKey);

    if (result.success) {
      report.txHash = result.txHash;
      report.blockNumber = result.blockNumber;
      saveReport(report);

      return NextResponse.json({
        success: true,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        explorerUrl: `${XLAYER_EXPLORER}/tx/${result.txHash}`,
      });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
