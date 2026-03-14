/**
 * Única fuente de verdad para las pestañas del panel admin del tenant.
 * Usado por:
 * - Panel de roles del SAAS (Permisos de panel por rol) para mostrar y guardar permisos.
 * - AdminProvider del tenant para validar y aplicar permisos por rol.
 *
 * Al agregar una nueva pestaña al admin del tenant:
 * 1. Añadirla aquí en TENANT_ADMIN_TAB_OPTIONS y en los defaults que correspondan.
 * 2. Añadirla en el sidebar del tenant (AdminSidebar) y en el contenido (Admin.jsx).
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
