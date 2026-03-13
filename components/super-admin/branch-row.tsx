"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSupabaseBrowserClient } from "../../utils/supabase/client";
import { requireAdminRole, roleSets } from "../../utils/admin";
import { logAdminAction } from "../../utils/audit";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Modal } from "../ui/modal";
import { Checkbox } from "../ui/checkbox";

// Types
export type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  instagram: string;
  schedule: string;
  country: string;
  currency: string;
  payment_methods: string[];
    pago_movil?: {
        banco?: string;
        telefono?: string;
        identificacion?: string;
    } | null;
    zelle?: {
        email?: string;
        name?: string;
    } | null;
    transferencia_bancaria?: {
        banco?: string;
        nro_cuenta?: string;
        tipo_cuenta?: string;
        identificacion?: string; // rut, ci, dni
        titular?: string;
        email?: string;
    } | null;
    stripe?: { [key: string]: string } | null;
    mercadopago?: { [key: string]: string } | null;
    paypal?: { [key: string]: string } | null;
    is_active: boolean;
    company_id: string;
    [key: string]: unknown;
};

// Schema de validación Zod - Define las reglas y tipos automáticamente
const branchFormSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    slug: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().min(1, "El teléfono es requerido"),
    instagram: z.string().optional(),
    schedule: z.string().optional(),
    country: z.string().min(1, "El país es requerido"),
    currency: z.string().min(1, "La moneda es requerida"),
    payment_methods: z.array(z.string()),
    // Objetos dinámicos: z.any() permite flexibilidad para los campos cambiantes por país
    pago_movil: z.any(),
    zelle: z.any(),
    transferencia_bancaria: z.any(),
    stripe: z.any(),
    mercadopago: z.any(),
    paypal: z.any(),
});

// TypeScript infiere el tipo desde el esquema Zod
type BranchFormValues = z.infer<typeof branchFormSchema>;

interface BranchRowProps {
  branch: Branch;
}

const ALL_PAYMENT_METHODS = [
  "efectivo",
  "tarjeta",
  "pago_movil",
  "zelle",
  "transferencia_bancaria",
  "stripe",
  "mercadopago",
  "paypal",
];

const COUNTRY_OPTIONS = [
    { value: "CL", label: "Chile" },
    { value: "VE", label: "Venezuela" },
    { value: "US", label: "Estados Unidos" },
    { value: "MX", label: "México" },
    { value: "CO", label: "Colombia" },
    { value: "AR", label: "Argentina" },
    { value: "PE", label: "Perú" },
    { value: "EC", label: "Ecuador" },
    { value: "ES", label: "España" },
    { value: "OTRO", label: "Otro" },
];

const CURRENCY_OPTIONS = [
    { value: "CLP", label: "Peso Chileno (CLP)" },
    { value: "VES", label: "Bolívar (VES)" },
    { value: "USD", label: "Dólar (USD)" },
    { value: "MXN", label: "Peso Mexicano (MXN)" },
    { value: "COP", label: "Peso Colombiano (COP)" },
    { value: "ARS", label: "Peso Argentino (ARS)" },
    { value: "PEN", label: "Sol Peruano (PEN)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "OTRO", label: "Otro" },
];

// Lógica dinámica para los campos según país
const getPaymentMethodFields = (method: string, country: string): { key: string; label: string }[] | null => {
    // Métodos físicos sin formulario
    if (["efectivo", "tarjeta"].includes(method)) return null;

    // Métodos digitales y transferencias
    switch (method) {
        case "pago_movil":
            // Típicamente Venezuela
            return [
                { key: "banco", label: "Banco" },
                { key: "telefono", label: "Teléfono" },
                { key: "identificacion", label: country === "VE" ? "Cédula" : "Identificación" }
            ];
        case "zelle":
            return [
                { key: "email", label: "Correo Electrónico" },
                { key: "name", label: "Nombre Titular" }
            ];
        case "transferencia_bancaria":
            const idLabel = country === "CL" ? "RUT" : (country === "VE" ? "Cédula/RIF" : "Documento ID");
            const fields = [
                { key: "banco", label: "Banco" },
                { key: "tipo_cuenta", label: "Tipo de Cuenta" },
                { key: "nro_cuenta", label: "Nro. Cuenta" },
                { key: "identificacion", label: idLabel },
                { key: "titular", label: "Nombre Titular" },
                { key: "email", label: "Correo Confirmación" }
            ];
            return fields;
        case "stripe":
            return [
                { key: "publishable_key", label: "Publishable Key (PK)" },
                { key: "secret_key", label: "Secret Key (SK)" }
            ];
        case "mercadopago":
            return [
                { key: "public_key", label: "Public Key" },
                { key: "access_token", label: "Access Token" }
            ];
        case "paypal":
            return [
                { key: "client_id", label: "Client ID" },
                { key: "client_secret", label: "Client Secret" }
            ];
        default:
            return [];
    }
};

// Main Component
export function BranchRow({ branch }: BranchRowProps) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return <BranchEditForm branch={branch} onCancel={() => setIsEditing(false)} />;
    }

    return <BranchView branch={branch} onEdit={() => setIsEditing(true)} />;
}

// View Component
function BranchView({ branch, onEdit }: { branch: Branch, onEdit: () => void }) {
        // ...existing code...
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [deletePassword, setDeletePassword] = useState("");
    const supabase = createSupabaseBrowserClient("super-admin");
    const router = useRouter();


    const handleDeleteConfirm = async () => {
        const auth = await requireAdminRole(roleSets.destructive);
        if (!auth.ok) return setGlobalError(auth.error);

        if (!deletePassword) {
            setFormErrors(prev => ({ ...prev, delete_password: "Password is required." }));
            return;
        }

        setIsLoading(true);
        setGlobalError(null);

        const { error: deleteError } = await supabase.from("branches").delete().eq("id", branch.id);

        if (deleteError) {
            setGlobalError(`Error eliminando: ${deleteError.message}`);
        } else {
            await logAdminAction({ action: "delete_branch", targetType: "branch", targetId: branch.id, companyId: branch.company_id, metadata: { details: `Branch ${branch.name} deleted by ${auth.email}` } });
            setIsDeleting(false);
            router.refresh();
        }
        setIsLoading(false);
    }

    return (
        <>
            <div className="grid grid-cols-6 gap-4 items-start p-4 border dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="col-span-2">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{branch.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{branch.slug}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{branch.address}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">{branch.phone}</p>
                </div>
                <div>
                    <Badge variant={branch.is_active ? "success" : "destructive"}>
                        {branch.is_active ? "Activa" : "Suspendida"}
                    </Badge>
                </div>
                <div className="flex justify-end gap-2">
                    <Button onClick={onEdit} size="sm" variant="outline">Editar</Button>
                    <Button onClick={() => setIsDeleting(true)} size="sm" variant="destructive">Eliminar</Button>
                </div>
                <div className="col-span-6 mt-4">
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Métodos de Pago Activos</h4>
                    <div className="flex flex-wrap gap-2">
                        {branch.payment_methods && branch.payment_methods.length > 0 ? (
                            [...new Set(branch.payment_methods)].map((method) => (
                                <Badge key={method} variant="neutral">{method.replace(/_/g, " ")}</Badge>
                            ))
                        ) : (
                            <span className="text-zinc-400 dark:text-zinc-500 text-sm">Ninguno</span>
                        )}
                    </div>
                </div>
            </div>
            <Modal isOpen={isDeleting} onClose={() => setIsDeleting(false)} title="Confirmar Eliminación">
                <div className="space-y-4">
                    <p className="text-zinc-700 dark:text-zinc-300">Para confirmar, por favor ingrese su contraseña.</p>
                    <Input
                        type="password"
                        value={deletePassword}
                        onChange={e => { setDeletePassword(e.target.value); setFormErrors(prev => ({ ...prev, delete_password: "" })) }}
                        placeholder="Contraseña"
                        aria-label="Password for delete confirmation"
                    />
                    {formErrors.delete_password && <p className="text-red-500 text-xs">{formErrors.delete_password}</p>}
                    {globalError && <p className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-950 dark:text-red-200 rounded-lg">{globalError}</p>}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsDeleting(false)} disabled={isLoading}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isLoading}>{isLoading ? "Eliminando..." : "Eliminar Sucursal"}</Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

// Edit Component
function BranchEditForm({ branch, onCancel }: { branch: Branch, onCancel: () => void }) {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient("super-admin");

    const [globalError, setGlobalError] = useState<string | null>(null);
    
    // 1. Preparar valores iniciales
    const defaultValues: Partial<BranchFormValues> = {
            name: branch.name || "",
            slug: branch.slug || "",
            address: branch.address || "",
            phone: branch.phone || "",
            instagram: branch.instagram || "",
            schedule: branch.schedule || "",
            country: branch.country || "",
            currency: branch.currency || "",
            payment_methods: Array.isArray(branch.payment_methods) ? [...branch.payment_methods] : [],
    };

    // Parsear JSON strings a objetos si es necesario
    ALL_PAYMENT_METHODS.forEach(method => {
        let value = branch[method];
        if (typeof value === "string") {
            try {
                value = JSON.parse(value);
            } catch {
                value = {};
            }
        }
        // @ts-expect-error - Indexación dinámica segura en este contexto
        defaultValues[method] = value ? { ...value } : {};
    });

    // 2. Hook de React Hook Form
    const form = useForm<BranchFormValues>({
        resolver: zodResolver(branchFormSchema),
        defaultValues
    });

    const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = form;

    // 3. Observar cambios para lógica dinámica (sin re-renders de todo el componente)
    const currentCountry = useWatch({ control, name: "country" });
    const currentPaymentMethods = useWatch({ control, name: "payment_methods" });
    const currentCurrency = useWatch({ control, name: "currency" });

    // Recalcular campos dinámicos solo cuando es necesario
    const paymentFieldsConfig = useMemo(() => {
        const config: Record<string, { key: string; label: string }[] | null> = {};
        (currentPaymentMethods || []).forEach(method => {
            config[method] = getPaymentMethodFields(method, currentCountry);
        });
        return config;
    }, [currentPaymentMethods, currentCountry]);

    const handlePaymentMethodToggle = (method: string) => {
        const current = currentPaymentMethods || [];
        const newMethods = current.includes(method)
            ? current.filter(m => m !== method)
            : [...current, method];
        setValue("payment_methods", newMethods, { shouldDirty: true });
    }

    // Envío del formulario
    const onSubmit = async (data: BranchFormValues) => {
        const auth = await requireAdminRole(roleSets.billing);
        if (!auth.ok) return setGlobalError(auth.error);

        setGlobalError(null);

        const cleanForm = { ...data };
        
        const { error: updateError } = await supabase.from("branches").update(cleanForm).eq("id", branch.id);

        if (updateError) {
            setGlobalError(`Error actualizando: ${updateError.message}`);
        } else {
            await logAdminAction({ action: "update_branch", targetType: "branch", targetId: branch.id, companyId: branch.company_id, metadata: { details: `Branch ${branch.name} updated by ${auth.email}` } });
            onCancel();
            router.refresh();
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 my-4 border-2 border-blue-200 dark:border-zinc-800 rounded-lg bg-blue-50 dark:bg-zinc-900">
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Renderizado de campos estáticos */}
                    {["name", "slug", "address", "phone", "instagram", "schedule", "country", "currency"].map(key => (
                        <div key={key}>
                            <label htmlFor={key} className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">{key.replace(/_/g, " ")}</label>
                            
                            {key === "country" ? (
                                <select
                                    id={key}
                                    {...register("country")}
                                    onChange={(e) => {
                                        // Manejo manual de onChange para lógica extra (moneda), RHF mantiene el control
                                        register("country").onChange(e);
                                        // Auto-selección de moneda (Mejora de UX)
                                        const val = e.target.value;
                                        if (val === "CL" && currentCurrency === branch.currency) setValue("currency", "CLP");
                                        if (val === "VE" && currentCurrency === branch.currency) setValue("currency", "VES");
                                        if (val === "US" && currentCurrency === branch.currency) setValue("currency", "USD");
                                    }}
                                    className="mt-1 flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Selecciona país</option>
                                    {COUNTRY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : key === "currency" ? (
                                <select
                                    id={key}
                                    {...register("currency")}
                                    className="mt-1 flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Selecciona moneda</option>
                                    {CURRENCY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <Input 
                                    id={key} 
                                    {...register(key as keyof BranchFormValues)}
                                    className="mt-1" 
                                />
                            )}
                            
                            {errors[key as keyof BranchFormValues] && (
                                <p className="text-red-500 text-xs mt-1">{errors[key as keyof BranchFormValues]?.message as string}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div>
                    <h3 className="text-lg font-semibold border-b dark:border-zinc-700 pb-2 mb-3 text-zinc-800 dark:text-zinc-200">Métodos de Pago</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ALL_PAYMENT_METHODS.map(method => (
                            <div key={method} className="flex items-center gap-2">
                                <Checkbox id={`edit-${method}`} checked={(currentPaymentMethods || []).includes(method)} onCheckedChange={() => handlePaymentMethodToggle(method)} />
                                <label htmlFor={`edit-${method}`} className="capitalize font-medium text-zinc-800 dark:text-zinc-200">{method.replace(/_/g, " ")}</label>
                            </div>
                        ))}
                    </div>
                </div>

                {(currentPaymentMethods || []).length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold border-b dark:border-zinc-700 pb-2 mb-3 text-zinc-800 dark:text-zinc-200">Detalles de Pago</h3>
                        {(currentPaymentMethods || []).map(method => {
                            // Obtener campos dinámicamente según el país actual del formulario
                            const fields = paymentFieldsConfig[method];

                            if (!fields) return null;
                            return (
                                <div key={method} className="p-3 my-2 border dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800">
                                    <h4 className="font-semibold capitalize text-zinc-700 dark:text-zinc-300">{method.replace(/_/g, " ")}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        {fields.map(field => (
                                            <div key={field.key}>
                                                <label htmlFor={`${method}-${field.key}`} className="text-sm text-zinc-600 dark:text-zinc-300">{field.label}</label>
                                                <Input 
                                                      id={`${method}-${field.key}`}
                                                    {...register(
                                                        `${method}.${field.key}` as
                                                        | `pago_movil.${string}`
                                                        | `zelle.${string}`
                                                        | `transferencia_bancaria.${string}`
                                                        | `stripe.${string}`
                                                        | `mercadopago.${string}`
                                                        | `paypal.${string}`
                                                    )}
                                                      className="mt-1"
                                                      placeholder={field.label}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {globalError && <div className="p-3 text-sm text-red-800 bg-red-100 dark:bg-red-950 dark:text-red-200 rounded-lg">{globalError}</div>}

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-700">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : "Guardar Cambios"}</Button>
                </div>
            </div>
        </form>
    );
}
