import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../lib/supabase-admin";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json().catch(() => ({}))) as {
			token?: string;
			payment_reference?: string;
			reference_file_url?: string;
		};
		const token = typeof body.token === "string" ? body.token.trim() : "";
		const paymentReference = typeof body.payment_reference === "string" ? body.payment_reference.trim() : "";
		const referenceFileUrl = typeof body.reference_file_url === "string" ? body.reference_file_url.trim() : "";

		if (!token || !paymentReference || !referenceFileUrl) {
			return NextResponse.json(
				{ error: "Faltan token, payment_reference o reference_file_url" },
				{ status: 400 }
			);
		}

		const { data: app } = await supabaseAdmin
			.from("onboarding_applications")
			.select("id,company_id")
			.eq("verification_token", token)
			.maybeSingle();

		if (!app?.company_id) {
			return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
		}

		const { data: payment, error: fetchError } = await supabaseAdmin
			.from("payments_history")
			.select("id,company_id,status")
			.eq("payment_reference", paymentReference)
			.eq("company_id", app.company_id)
			.maybeSingle();

		if (fetchError || !payment) {
			return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
		}
		if (payment.status !== "pending_validation") {
			return NextResponse.json(
				{ error: "Este pago ya fue procesado o no admite referencia" },
				{ status: 400 }
			);
		}

		const { error: updateError } = await supabaseAdmin
			.from("payments_history")
			.update({ reference_file_url: referenceFileUrl })
			.eq("id", payment.id);

		if (updateError) {
			return NextResponse.json({ error: "Error al guardar la referencia" }, { status: 500 });
		}

		return NextResponse.json({ ok: true, message: "Comprobante registrado. Te avisaremos cuando sea validado." });
	} catch (err) {
		console.error("upload-payment-reference error:", err);
		return NextResponse.json({ error: "Error interno" }, { status: 500 });
	}
}
