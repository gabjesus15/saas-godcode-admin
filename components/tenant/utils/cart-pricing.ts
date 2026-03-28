/** Fila típica de `product_prices` + join `products` desde Supabase. */
export type BranchProductPriceRow = {
	product_id: string;
	price: number | null;
	has_discount: boolean | null;
	discount_price: number | null;
	products?: {
		id?: string;
		name?: string | null;
		is_active?: boolean | null;
		description?: string | null;
	} | null;
};

export type MergeCartBranchPricesOptions = {
	/**
	 * true: si hay al menos una fila de precios para la sucursal, se omiten ítems del carrito sin fila (modal web).
	 * false: se conservan ítems sin fila con los datos ya guardados en el carrito (provider / persistencia).
	 */
	omitLinesWithoutPriceWhenBranchHasData: boolean;
};

/**
 * Une el carrito con precios y metadatos de producto por sucursal.
 * Filtra `is_active === false` al final.
 */
export function mergeCartWithBranchPrices<T extends { id: string; name?: string | null; description?: string | null; price?: number | null; has_discount?: boolean | null; discount_price?: number | null; is_active?: boolean | null }>(
	cart: T[],
	rows: BranchProductPriceRow[] | null | undefined,
	options: MergeCartBranchPricesOptions,
): T[] {
	const list = rows ?? [];
	const hasAnyRows = list.length > 0;
	const priceByProductId = new Map(list.map((row) => [String(row.product_id), row]));

	const merged = cart.reduce<T[]>((acc, cartItem) => {
		const priceRow = priceByProductId.get(String(cartItem.id)) ?? null;
		const meta = priceRow?.products;
		if (priceRow) {
			acc.push({
				...cartItem,
				price: priceRow.price,
				has_discount: priceRow.has_discount,
				discount_price: priceRow.discount_price,
				name: meta?.name ?? cartItem.name,
				description: meta?.description ?? cartItem.description,
				is_active: meta?.is_active ?? cartItem.is_active,
			});
			return acc;
		}
		if (!hasAnyRows || !options.omitLinesWithoutPriceWhenBranchHasData) {
			acc.push({ ...cartItem });
		}
		return acc;
	}, []);

	return merged.filter((item) => item.is_active !== false);
}
