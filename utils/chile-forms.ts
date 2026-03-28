/**
 * Formato RUT chileno mientras el usuario escribe (puntos y guión).
 */
export function formatRutOnInput(value: string): string {
	if (!value) return "";
	const cleanRut = value.replace(/[^0-9kK]/g, "").toUpperCase();

	if (cleanRut.length === 0) {
		return "";
	}

	const body = cleanRut.slice(0, -1);
	const verifier = cleanRut.slice(-1);

	if (body === "") {
		return verifier;
	}

	const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	return `${formattedBody}-${verifier}`;
}

/**
 * Valida RUT chileno (módulo 11).
 */
export function validateRutChile(rut: string): boolean {
	if (!rut) return false;
	const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
	if (clean.length < 2) return false;

	const body = clean.slice(0, -1);
	const dv = clean.slice(-1);

	if (!/^\d+$/.test(body)) return false;

	let sum = 0;
	let multiplier = 2;

	for (let i = body.length - 1; i >= 0; i--) {
		sum += parseInt(body[i], 10) * multiplier;
		multiplier = multiplier === 7 ? 2 : multiplier + 1;
	}

	const res = 11 - (sum % 11);
	const expectedDv = res === 11 ? "0" : res === 10 ? "K" : res.toString();

	return dv === expectedDv;
}

const CHILE_PHONE_PREFIX = "+56 9 ";

/**
 * Teléfono checkout cliente Chile: prefijo +56 9 y reglas de dígitos (misma lógica que el carrito web).
 */
export function validateChileCustomerPhone(raw: string): boolean {
	let phoneValue = raw.replace(/\D/g, "");
	if (raw.trim() === CHILE_PHONE_PREFIX.trim() || phoneValue === "569") {
		phoneValue = "";
	}
	return (
		(phoneValue.length === 11 && phoneValue.startsWith("569")) ||
		(phoneValue.length === 9 && phoneValue.startsWith("9")) ||
		(phoneValue.length >= 8 && phoneValue.startsWith("9"))
	);
}

/**
 * Mantiene el prefijo "+56 9 " si el valor es demasiado corto sin prefijo.
 */
export function normalizeChilePhoneInput(value: string): string {
	if (!value.startsWith(CHILE_PHONE_PREFIX)) {
		if (value.length < 6) return CHILE_PHONE_PREFIX;
	}
	return value;
}
