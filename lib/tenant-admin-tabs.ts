/**
 * Única fuente de verdad para los IDs de pestañas del panel del tenant (mismo contrato en todos los clientes).
 * Usado por el panel de roles del SaaS (`company-global-form`: permisos por rol) para mostrar y guardar qué ve cada rol.
 * El panel del tenant donde se apliquen esos permisos (p. ej. app de escritorio) debe usar los mismos `id`.
 *
 * Al agregar una pestaña nueva:
 * 1. Añadirla en TENANT_ADMIN_TAB_OPTIONS y en DEFAULT_ROLE_NAV_PERMISSIONS si aplica.
 * 2. Reflejarla en el cliente del panel tenant que corresponda (sidebar / navegación).
 */

export const TENANT_ADMIN_TAB_OPTIONS = [
	{ id: "orders", label: "Cocina / Pedidos" },
	{ id: "caja", label: "Caja" },
	{ id: "analytics", label: "Reportes" },
	{ id: "categories", label: "Categorías" },
	{ id: "products", label: "Productos" },
	{ id: "inventory", label: "Inventario" },
	{ id: "clients", label: "Clientes" },
	{ id: "users", label: "Equipo" },
	{ id: "payment_methods", label: "Métodos de pago" },
] as const;

export const TENANT_ADMIN_TAB_IDS = TENANT_ADMIN_TAB_OPTIONS.map((t) => t.id);

export type TenantAdminTabId = (typeof TENANT_ADMIN_TAB_OPTIONS)[number]["id"];

const ALL_TABS = TENANT_ADMIN_TAB_IDS as unknown as string[];

export const DEFAULT_ROLE_NAV_PERMISSIONS: Record<string, string[]> = {
	owner: [...ALL_TABS],
	admin: [...ALL_TABS],
	ceo: [...ALL_TABS],
	cashier: ["orders", "caja"],
};

export function getDefaultRoleNavPermissions(): Record<string, string[]> {
	return { ...DEFAULT_ROLE_NAV_PERMISSIONS };
}
