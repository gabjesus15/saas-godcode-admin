"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { logAdminAction } from "../../utils/audit";
import { requireAdminRole, roleSets } from "../../utils/admin";

interface BranchesCreateFormProps {
  companyId: string;
}

const slugify = (value: string) => {
  // Comentario: normaliza el nombre para generar un slug estable.
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

export function BranchesCreateForm({ companyId }: BranchesCreateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    is_active: true,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      const supabase = createSupabaseBrowserClient("super-admin");
      const finalSlug = form.slug.trim() || slugify(form.name);

      if (!finalSlug) {
        throw new Error("Define un slug valido para la sucursal.");
      }

      const { data, error: insertError } = await supabase
        .from("branches")
        .insert({
          name: form.name,
          slug: finalSlug,
          address: form.address,
          phone: form.phone,
          is_active: form.is_active,
          company_id: companyId,
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }

      await logAdminAction({
        action: "branch.create",
        targetType: "branch",
        targetId: data?.id,
        companyId,
        metadata: { name: form.name, slug: finalSlug },
      });

      setForm({ name: "", slug: "", address: "", phone: "", is_active: true });
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo crear la sucursal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-3 md:grid-cols-5" onSubmit={handleSubmit}>
      <div className="md:col-span-2">
        <Input
          value={form.name}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder="Nombre de sucursal"
          required
        />
      </div>
      <div className="md:col-span-1">
        <Input
          value={form.slug}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, slug: event.target.value }))
          }
          placeholder="slug"
        />
      </div>
      <div className="md:col-span-1">
        <Input
          value={form.address}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, address: event.target.value }))
          }
          placeholder="Direccion"
        />
      </div>
      <div className="md:col-span-1">
        <Input
          value={form.phone}
          onChange={(event) =>
            setForm((prev) => ({ ...prev, phone: event.target.value }))
          }
          placeholder="Telefono"
        />
      </div>
      <div className="md:col-span-5 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_active: event.target.checked }))
            }
          />
          Activa
        </label>
        <Button type="submit" size="sm" loading={loading}>
          Crear sucursal
        </Button>
      </div>
      {error ? (
        <div className="md:col-span-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-300">
          {error}
        </div>
      ) : null}
    </form>
  );
}
