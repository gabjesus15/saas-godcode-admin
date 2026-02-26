"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { logAdminAction } from "../../utils/audit";
import { requireAdminRole, roleSets } from "../../utils/admin";

interface BranchRowProps {
  branch: {
    id: string;
    name: string | null;
    slug: string | null;
    address: string | null;
    phone: string | null;
    is_active: boolean | null;
  };
}

export function BranchRow({ branch }: BranchRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: branch.name ?? "",
    slug: branch.slug ?? "",
    address: branch.address ?? "",
    phone: branch.phone ?? "",
  });
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);

  const deleteToken = branch.slug || branch.name || "confirmar";

  const handleToggleStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("branches")
        .update({ is_active: !branch.is_active })
        .eq("id", branch.id);

      if (updateError) {
        throw updateError;
      }

      await logAdminAction({
        action: "branch.status.update",
        targetType: "branch",
        targetId: branch.id,
        metadata: { to: !branch.is_active },
      });

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar la sucursal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await requireAdminRole(roleSets.billing);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("branches")
        .update({
          name: form.name,
          slug: form.slug,
          address: form.address,
          phone: form.phone,
        })
        .eq("id", branch.id);

      if (updateError) {
        throw updateError;
      }

      await logAdminAction({
        action: "branch.update",
        targetType: "branch",
        targetId: branch.id,
        metadata: { name: form.name, slug: form.slug },
      });

      setEditing(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar la sucursal.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const permission = await requireAdminRole(roleSets.destructive);
      if (!permission.ok) {
        throw new Error(permission.error);
      }

      if (branch.is_active) {
        throw new Error("Primero suspende la sucursal antes de eliminarla.");
      }

      if (!confirmChecked) {
        throw new Error("Confirma que deseas eliminar la sucursal.");
      }

      if (confirmText.trim().toLowerCase() !== deleteToken.toLowerCase()) {
        throw new Error("El texto de confirmacion no coincide.");
      }

      if (!password) {
        throw new Error("Ingresa tu contrasena para continuar.");
      }

      const supabase = createSupabaseBrowserClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user?.email) {
        throw new Error("No se pudo validar el usuario actual.");
      }

      // Comentario: reautenticamos antes de ejecutar una accion destructiva.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password,
      });

      if (authError) {
        throw new Error("Contrasena incorrecta.");
      }

      const { error: deleteError } = await supabase
        .from("branches")
        .delete()
        .eq("id", branch.id);

      if (deleteError) {
        throw deleteError;
      }

      await logAdminAction({
        action: "branch.delete",
        targetType: "branch",
        targetId: branch.id,
        metadata: { name: branch.name, slug: branch.slug },
      });

      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar la sucursal.";
      setDeleteError(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {branch.name ?? "Sucursal"}
          </p>
          <p className="text-xs text-zinc-500">Slug: {branch.slug ?? "--"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={branch.is_active ? "success" : "warning"}>
            {branch.is_active ? "Activa" : "Inactiva"}
          </Badge>
          <Button size="sm" variant="outline" onClick={handleToggleStatus} loading={loading}>
            {branch.is_active ? "Suspender" : "Activar"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing((prev) => !prev)}>
            {editing ? "Cancelar" : "Editar"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDelete((prev) => !prev)}
          >
            {showDelete ? "Cerrar" : "Eliminar"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Nombre"
          />
          <Input
            value={form.slug}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, slug: event.target.value }))
            }
            placeholder="Slug"
          />
          <Input
            value={form.address}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, address: event.target.value }))
            }
            placeholder="Direccion"
          />
          <Input
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
            placeholder="Telefono"
          />
          <div className="md:col-span-4 flex justify-end">
            <Button size="sm" onClick={handleSave} loading={loading}>
              Guardar
            </Button>
          </div>
        </div>
      ) : null}

      {showDelete ? (
        <div className="grid gap-3 rounded-2xl border border-red-200 bg-red-50/60 p-4">
          <div>
            <p className="text-sm font-semibold text-red-700">Eliminar sucursal</p>
            <p className="text-xs text-red-600">
              Para continuar, escribe "{deleteToken}" y confirma con tu contrasena.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="Confirmacion"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contrasena"
            />
            <div className="flex items-center gap-2 text-xs font-medium text-red-700">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(event) => setConfirmChecked(event.target.checked)}
              />
              Entiendo que esta accion es permanente.
            </div>
          </div>

          {deleteError ? (
            <div className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-red-700">
              {deleteError}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="destructive"
              loading={deleting}
              onClick={handleDelete}
            >
              Eliminar definitivamente
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
