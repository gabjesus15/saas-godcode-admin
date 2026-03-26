import { NextResponse } from "next/server";

const DEFAULT_BCV_RATE = 36.5;

export async function GET() {
	const rate = Number(process.env.BCV_RATE ?? process.env.NEXT_PUBLIC_BCV_RATE ?? DEFAULT_BCV_RATE);
	return NextResponse.json({ rate: Number.isFinite(rate) ? rate : DEFAULT_BCV_RATE });
}
