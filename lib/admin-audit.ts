import { supabaseAdmin } from "./supabase-admin";
import type { Json } from "../types/supabase-database";

export async function logAdminAudit(params: {
	actorEmail: string;
	actorRole?: string | null;
	action: string;
	resourceType?: string | null;
	resourceId?: string | null;
	metadata?: Record<string, unknown> | null;
}): Promise<void> {
	try {
		const meta = {
			...(params.metadata ?? {}),
			...(params.actorRole ? { actor_role: params.actorRole } : {}),
		} as Json;
		const { error } = await supabaseAdmin.from("admin_audit_logs").insert({
			actor_email: params.actorEmail.trim().toLowerCase(),
			actor_id: null,
			company_id: null,
			action: params.action,
			target_type: (params.resourceType ?? "super_admin_api").slice(0, 120),
			target_id: params.resourceId ?? null,
			metadata: meta,
		});
		if (error) {
			console.warn("[admin_audit] insert:", error.message);
		}
	} catch (e) {
		console.warn("[admin_audit]", e);
	}
}
