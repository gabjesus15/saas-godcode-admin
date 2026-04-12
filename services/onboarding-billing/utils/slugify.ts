export type SlugifyOptions = {
	maxLength?: number;
	emptyFallback?: string;
};

export function slugify(value: string, options?: SlugifyOptions): string {
	let s = value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");

	if (options?.maxLength != null) {
		s = s.slice(0, options.maxLength);
	}
	if (!s && options?.emptyFallback != null) {
		return options.emptyFallback;
	}
	return s;
}
