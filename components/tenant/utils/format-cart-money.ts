/** Pesos / montos del carrito tenant: siempre enteros, sin decimales en pantalla. */
export function formatCartMoney(amount: number): string {
	return Math.round(Number(amount) || 0).toLocaleString("es-CL", {
		maximumFractionDigits: 0,
		minimumFractionDigits: 0,
	});
}
