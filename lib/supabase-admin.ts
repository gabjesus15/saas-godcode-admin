import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { validateEnv } from "./env";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
	if (!_client) {
		validateEnv();
		_client = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!,
			{
				auth: {
					autoRefreshToken: false,
					persistSession: false,
				},
			}
		);
	}
	return _client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
	get(_target, prop, receiver) {
		return Reflect.get(getClient(), prop, receiver);
	},
});
