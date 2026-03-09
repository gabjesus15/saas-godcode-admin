import type { Metadata } from "next";
import { createSupabasePublicServerClient } from "../../../utils/supabase/server";
import { StoreUnavailable } from "../../../components/tenant/store-unavailable";
import { MenuClient } from "../../../components/tenant/menu-client";

// ==========================================
// 1. INTERFACES DE PROPS Y OUTPUT CLIENTE
// ==========================================

interface TenantMenuPageProps {
  params: Promise<{ subdomain: string }>;
  searchParams?: Promise<{ branch?: string; debug?: string }>;
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
	const resolvedParams = await params;

	return {
		manifest: `/${resolvedParams.subdomain}/menu/manifest.webmanifest`,
		appleWebApp: {
			capable: true,
			statusBarStyle: "default",
			title: "Menu",
		},
	};
}

interface MenuProduct {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
  price: number;
  has_discount: boolean;
  discount_price: number | null;
  is_special: boolean;
}

// ==========================================
// 2. INTERFACES CRUDAS (Para tipar el RPC)
// ==========================================

interface RawRPCCategory {
  id: string;
  name: string;
  order: number | null;
}

interface RawRPCProduct {
  id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
}

interface RawRPCPrice {
  product_id: string;
  price: number | string | null; // SQL a veces devuelve los Numeric/Decimal como strings
  has_discount: boolean;
  discount_price: number | string | null;
}

interface RawRPCStatus {
  product_id: string;
  is_active: boolean;
  is_special: boolean;
  category_id?: string | null; // Categoría opcionalmente sobrescrita por la sucursal
}

interface MenuDataResponse {
  categories?: RawRPCCategory[];
  products?: RawRPCProduct[];
  product_prices?: RawRPCPrice[];
  product_branch?: RawRPCStatus[];
}

// ==========================================
// 3. COMPONENTE SERVIDOR PRINCIPAL
// ==========================================

export default async function TenantMenuPage({
  params,
  searchParams,
}: TenantMenuPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  
  const supabase = createSupabasePublicServerClient();

  // --- A. Obtener la empresa primero (Filtro base) ---
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id,name,public_slug,theme_config,subscription_status,phone,address")
    .eq("public_slug", resolvedParams.subdomain)
    .maybeSingle();

  if (companyError || !company) {
    if (resolvedSearchParams?.debug === "1") {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          No se pudo cargar la empresa para este subdominio.
          <pre className="debug-pre">
            {JSON.stringify(
              {
                subdomain: resolvedParams.subdomain,
                error: companyError?.message ?? null,
                status: companyError?.code ?? null,
              },
              null,
              2
            )}
          </pre>
        </div>
      );
    }
    return <StoreUnavailable />;
  }

  const status = company.subscription_status?.toLowerCase();
  if (status === "suspended" || status === "cancelled") {
    return <StoreUnavailable />;
  }

  // --- B. Ejecutar consultas secundarias en PARALELO para máximo rendimiento ---
	const [
		{ data: branches, error: branchesError },
		{ data: openShifts, error: openShiftsError },
		{ data: businessInfoRaw, error: businessInfoError },
	] = await Promise.all([
		supabase
			.from("branches")
			.select("id,name,address,phone,schedule,company_id")
			.eq("company_id", company.id)
			.order("name"),
		supabase
			.from("cash_shifts")
			.select("branch_id")
			.eq("company_id", company.id)
			.eq("status", "open"),
		supabase
			.from("business_info")
			.select("schedule")
			.eq("company_id", company.id)
			.maybeSingle(),
	]);

	if (branchesError || openShiftsError || businessInfoError) {
		if (resolvedSearchParams?.debug === "1") {
			return (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
					No se pudo cargar la informacion base del menu.
					<pre className="debug-pre">
						{JSON.stringify(
							{
								subdomain: resolvedParams.subdomain,
								branchesError: branchesError?.message ?? null,
								openShiftsError: openShiftsError?.message ?? null,
								businessInfoError: businessInfoError?.message ?? null,
							},
							null,
							2
						)}
					</pre>
				</div>
			);
		}
		return <StoreUnavailable />;
	}

  const openBranchIds = (openShifts ?? [])
    .map((shift) => String(shift.branch_id))
    .filter(Boolean);
  const openBranchIdSet = new Set(openBranchIds);

  // --- C. Selección segura de la sucursal ---
  const safeBranches = branches ?? [];
  if (safeBranches.length === 0) {
    return <StoreUnavailable />;
  }

  const hasOpenBranches = openBranchIds.length > 0;
  const requestedBranchId = resolvedSearchParams?.branch;
  const requestedBranch = requestedBranchId
    ? safeBranches.find((branch) => branch.id === requestedBranchId) ?? null
    : null;
  const selectedBranch =
    requestedBranch && (!hasOpenBranches || openBranchIdSet.has(String(requestedBranch.id)))
      ? requestedBranch
      : null;
  const menuBranch =
    selectedBranch ??
    (hasOpenBranches
      ? safeBranches.find((branch) => openBranchIdSet.has(String(branch.id))) ?? null
      : safeBranches[0] ?? null);

  let menuData: MenuDataResponse | null = null;

  if (menuBranch) {
    // --- D. Obtener Menú vía RPC ---
    const { data, error: menuError } = await supabase.rpc("get_public_menu", {
      p_company_slug: resolvedParams.subdomain,
      p_branch_id: menuBranch.id,
    });

    if (menuError) {
      if (resolvedSearchParams?.debug === "1") {
        return (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            No se pudo cargar el menu de la sucursal seleccionada.
            <pre className="debug-pre">
              {JSON.stringify(
                {
                  subdomain: resolvedParams.subdomain,
                  branchId: menuBranch.id,
                  error: menuError.message ?? null,
                  code: menuError.code ?? null,
                },
                null,
                2
              )}
            </pre>
          </div>
        );
      }
      return <StoreUnavailable />;
    }

    // PostgREST puede devolver un array de una fila para RETURNS TABLE
    menuData = Array.isArray(data) && data.length > 0 ? data[0] : data;
  }

  // --- E. Asignación de tipos fuertes (¡Adiós 'any'!) ---
  const categoriesRaw = (menuData?.categories ?? []) as RawRPCCategory[];
  const productsRaw = (menuData?.products ?? []) as RawRPCProduct[];
  const branchPrices = (menuData?.product_prices ?? []) as RawRPCPrice[];
  const branchStatuses = (menuData?.product_branch ?? []) as RawRPCStatus[];

  const categories = [...categoriesRaw].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)
  );

  // --- F. Mapeo ultra-seguro y validado ---
  const products: MenuProduct[] = productsRaw
    .map((product) => {
      // TypeScript ahora sabe exactamente qué propiedades tienen `price` y `status`
      const priceData = branchPrices.find(
        (price) => price.product_id === product.id
      );
      const statusData = branchStatuses.find(
        (status) => status.product_id === product.id
      );

      // Validación estricta de visibilidad
      if (!statusData || statusData.is_active !== true) {
        return null;
      }

      // Validación estricta matemática de precio
      const price = Number(priceData?.price ?? 0);
      if (!Number.isFinite(price) || price <= 0) {
        return null;
      }

      return {
        id: product.id,
        name: product.name ?? null,
        description: product.description ?? null,
        image_url: product.image_url ?? null,
        category_id: statusData.category_id ?? product.category_id ?? null,
        price,
        has_discount: Boolean(priceData?.has_discount),
        discount_price: priceData?.discount_price ? Number(priceData.discount_price) : null,
        is_special: Boolean(statusData?.is_special),
      };
    })
    // Type Guard para garantizar que TS entienda que ya no hay nulls
    .filter((p): p is MenuProduct => p !== null);

  // --- G. Casteo seguro de JSONB (Evita warnings silenciosos) ---
  const themeConfig = company.theme_config as Record<string, unknown> | null;
  const name = (themeConfig?.displayName as string) ?? company.name ?? "GodCode";
  const logoUrl = (themeConfig?.logoUrl as string) ?? null;
  
  const businessInfo = {
    name,
    phone: company.phone ?? null,
    address: company.address ?? null,
    schedule: businessInfoRaw?.schedule ?? null,
  };

  return (
    <MenuClient
      name={name}
      logoUrl={logoUrl}
      businessInfo={businessInfo}
      branches={safeBranches}
      openBranchIds={openBranchIds}
      categories={categories}
      products={products}
      selectedBranchId={selectedBranch?.id ?? null}
    />
  );
}