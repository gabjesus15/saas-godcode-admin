import { NextResponse } from "next/server";

export async function GET() {
	const clientId = process.env.PAYPAL_CLIENT_ID ?? "";
	const environment = process.env.PAYPAL_ENVIRONMENT === "production" ? "production" : "sandbox";

	if (!clientId) {
		return NextResponse.json({ error: "PayPal no configurado" }, { status: 503 });
	}

	return NextResponse.json({ clientId, environment });
}
