import { NextRequest, NextResponse } from "next/server";
import { proxyToOnboardingBilling } from "../../../../lib/service-proxy";

const DEFAULT_BCV_RATE = 36.5;

export async function GET(req: NextRequest) {
	const proxied = await proxyToOnboardingBilling(req, "/api/onboarding/bcv-rate");
	if (proxied) return proxied;
	const rate = Number(process.env.BCV_RATE ?? process.env.NEXT_PUBLIC_BCV_RATE ?? DEFAULT_BCV_RATE);
	return NextResponse.json({ rate: Number.isFinite(rate) ? rate : DEFAULT_BCV_RATE });
}
