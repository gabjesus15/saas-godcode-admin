import { createSupabaseServerClient } from "../../../utils/supabase/server";
import { PlansAdminClient } from "./PlansAdminClient";

const getUsdToClp = async () => {
	try {
		const res = await fetch("https://open.er-api.com/v6/latest/USD", {
			next: { revalidate: 43200 },
		});
		if (!res.ok) return null;
		const data = await res.json();
		const rate = Number(data?.rates?.CLP ?? 0);
		return rate > 0 ? rate : null;
	} catch {
		return null;
	}
};

export default async function PlansPage() {
	try {
		const supabase = await createSupabaseServerClient();
		const [rate, plansResult] = await Promise.all([
			getUsdToClp(),
			supabase
				.from("plans")
				.select("id,name,price,max_branches,is_public,features")
				.order("price", { ascending: true }),
		]);
		const { data, error } = plansResult;

		if (error) {
			throw error;
		}

		return (
			<PlansAdminClient plans={data ?? []} rate={rate} />
		);
	} catch {
		return (
			<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
				No se pudo cargar el listado de planes.
			</div>
		);
	}
}
