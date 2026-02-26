"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { logAdminAction } from "../../utils/audit";
import { requireAdminRole, roleSets } from "../../utils/admin";

interface CompanyStatusToggleProps {
  companyId: string;
  currentStatus: "active" | "suspended" | string | null;
}

export function CompanyStatusToggle({
  companyId,
  currentStatus,
}: CompanyStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const nextStatus = currentStatus === "active" ? "suspended" : "active";

  const handleToggle = async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("companies")
        .update({ subscription_status: nextStatus })
        .eq("id", companyId);

      if (updateError) {
        throw updateError;
      }

      await logAdminAction({
        action: "company.status.update",
        targetType: "company",
        targetId: companyId,
        metadata: { to: nextStatus },
      });

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        size="sm"
        variant={nextStatus === "active" ? "default" : "outline"}
        loading={loading}
        onClick={handleToggle}
      >
        {nextStatus === "active" ? "Activar" : "Suspender"}
      </Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
