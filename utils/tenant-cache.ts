import { cache } from "react";
import { createSupabasePublicServerClient } from "./supabase/server";

export const getCachedCompany = cache(async (subdomain: string) => {
	const supabase = createSupabasePublicServerClient();
	const { data: company } = await supabase
		.from("companies")
		.select("id,name,public_slug,subscription_status,theme_config,updated_at")
		.eq("public_slug", subdomain)
		.maybeSingle();

	return company;
});
