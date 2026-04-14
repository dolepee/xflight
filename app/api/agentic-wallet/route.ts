import { NextResponse } from "next/server";
import { getAgenticWalletStatus } from "@/lib/agenticWallet";
import { describeOnchainOSUsage } from "@/lib/onchainos";

export const runtime = "nodejs";

/**
 * GET /api/agentic-wallet
 *
 * Returns the public status of the XFlight Agentic Wallet on X Layer.
 * This is the autonomous signer that attests every verification report
 * to XFlightRecorder — no human hand, no custodial middleman.
 */
export async function GET() {
  const status = await getAgenticWalletStatus();
  if (!status) {
    return NextResponse.json(
      { error: "Agentic wallet not configured (ATTESTER_PRIVATE_KEY missing)" },
      { status: 503 }
    );
  }

  const onchainos = describeOnchainOSUsage();

  return NextResponse.json({
    ...status,
    onchainos,
    contract: process.env.XFLIGHT_CONTRACT_ADDRESS || null,
    description:
      "XFlight's Agentic Wallet autonomously signs verification reports on X Layer. " +
      "Every attestation written to XFlightRecorder originates from this address.",
  });
}
