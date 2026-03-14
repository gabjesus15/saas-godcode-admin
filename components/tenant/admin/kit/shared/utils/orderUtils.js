/** Etiquetas para método de pago específico (coincide con keys del carrito/SaaS). */
export const PAYMENT_METHOD_LABELS = {
	efectivo: 'Efectivo',
	tarjeta: 'Tarjeta',
	pago_movil: 'Pago Móvil',
	zelle: 'Zelle',
	transferencia_bancaria: 'Transferencia',
	stripe: 'Tarjeta (Online)',
	mercadopago: 'MercadoPago',
	paypal: 'PayPal',
	online: 'Transf.',
	tienda: 'En local'
};

/** Métodos que se consideran "pago online" para desglose y filtros. */
const ONLINE_SPECIFIC_METHODS = new Set(['pago_movil', 'zelle', 'transferencia_bancaria', 'stripe', 'mercadopago', 'paypal']);

/**
 * Devuelve la etiqueta a mostrar para el método de pago (usa payment_method_specific si existe).
 * @param {{ payment_type?: string; payment_method_specific?: string | null }} order
 * @returns {string}
 */
export function getPaymentLabel(order) {
	if (!order) return '—';
	const specific = order.payment_method_specific;
	if (specific && PAYMENT_METHOD_LABELS[specific]) return PAYMENT_METHOD_LABELS[specific];
	const type = order.payment_type || '';
	if (type === 'online') return 'Transf.';
	if (type === 'tarjeta') return 'Tarjeta';
	if (type === 'tienda') return 'Efectivo';
	return type || '—';
}

/**
 * Indica si el pedido es pago online (transferencia, Zelle, etc.) para filtros y desglose.
 * @param {{ payment_type?: string; payment_method_specific?: string | null }} order
 * @returns {boolean}
 */
export function isOnlineOrder(order) {
	if (!order) return false;
	if (order.payment_type === 'online' || order.payment_type === 'transferencia') return true;
	return Boolean(order.payment_method_specific && ONLINE_SPECIFIC_METHODS.has(order.payment_method_specific));
}

/**
 * Slug de método de pago para CSS y desglose: 'cash' | 'card' | 'transfer'.
 * @param {{ payment_type?: string; payment_method_specific?: string | null }} order
 * @returns {'cash' | 'card' | 'transfer'}
 */
export function getPaymentSlug(order) {
	if (!order) return 'cash';
	if (order.payment_type === 'tarjeta' || order.payment_type === 'card') return 'card';
	if (isOnlineOrder(order)) return 'transfer';
	return 'cash';
}

/**
 * Saneamiento de pedidos desde la BD (items JSONB, total, client_*, status, etc.)
 * Usado en Admin y en hooks que parsean órdenes.
 */
export function sanitizeOrder(rawOrder) {
	if (!rawOrder) return null;

	let cleanItems = [];
	if (rawOrder.items) {
		if (Array.isArray(rawOrder.items)) {
			cleanItems = rawOrder.items;
		} else if (typeof rawOrder.items === 'string') {
			try {
				const parsed = JSON.parse(rawOrder.items);
				cleanItems = Array.isArray(parsed) ? parsed : [];
			} catch {
				cleanItems = [];
			}
		}
	}

	return {
		...rawOrder,
		items: cleanItems,
		total: Number(rawOrder.total) || 0,
		client_name: rawOrder.client_name || 'Cliente Desconocido',
		client_rut: rawOrder.client_rut || 'Sin RUT',
		client_phone: rawOrder.client_phone || '',
		status: rawOrder.status || 'pending',
		created_at: rawOrder.created_at || new Date().toISOString(),
		payment_type: rawOrder.payment_type || 'unknown',
		payment_method_specific: rawOrder.payment_method_specific ?? null
	};
}
