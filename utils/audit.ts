import { createSupabaseBrowserClient } from "./supabase/client";

interface AuditPayload {
  action: string;
  targetType: string;
  targetId?: string | null;
  companyId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction(payload: AuditPayload) {
  try {
    const supabase = createSupabaseBrowserClient("super-admin");
    const { data: userData } = await supabase.auth.getUser();

    await supabase.from("admin_audit_logs").insert({
      actor_id: userData.user?.id ?? null,
      actor_email: userData.user?.email ?? null,
      company_id: payload.companyId ?? null,
      action: payload.action,
      target_type: payload.targetType,
      target_id: payload.targetId ?? null,
      metadata: payload.metadata ?? {},
    });
  } catch {
    // Comentario: el logging no debe bloquear la accion principal.
  }
}
