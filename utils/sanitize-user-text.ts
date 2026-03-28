import DOMPurify from "dompurify";

const purifyPlainText = (s: string) =>
	DOMPurify.sanitize(s, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

/**
 * Texto de usuario para persistir (nombre, nota, descripciones): trim + sin HTML.
 * Solo usar en cliente (importa dompurify).
 */
export function sanitizeUserText(text: string | null | undefined): string {
	if (text == null) return "";
	const trimmed = String(text).trim();
	if (!trimmed) return "";
	return purifyPlainText(trimmed);
}

/**
 * Igual que sanitizeUserText pero sin trim (p. ej. nota mientras se escribe).
 */
export function sanitizeUserTextNoTrim(text: string | null | undefined): string {
	if (text == null || text === "") return "";
	return purifyPlainText(String(text));
}
