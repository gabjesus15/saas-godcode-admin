import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** GET: listar add-ons activos para el formulario de registro (paso 2). */
export async function GET() {
	const { data, error } = await supabaseAdmin
		.from("addons")
		.select("id,slug,name,description,price_one_time,price_monthly,type,sort_order")
		.eq("is_active", true)
		.order("sort_order", { ascending: true });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
	return NextResponse.json({ data: data ?? [] });
}
