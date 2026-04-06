import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getCustomerAccountContext } from "../../../../lib/customer-account-context";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

type PlanRow = {
  id: string;
  name: string;
  price: number | null;
  max_branches: number | null;
  max_users: number | null;
  is_active: boolean | null;
};

type CompanyRow = {
  id: string;
  name: string;
  country: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  subscription_ends_at: string | null;
};

type MethodSnapshot = {
  id: string;
  slug: string;
  name: string;
  countries: string[] | null;
  auto_verify: boolean;
};

type PlanImpact = {
  id: string;
  level: "warn" | "block";
  title: string;
  detail: string;
};

const COUNTRY_NORMALIZE: Record<string, string> = {
  Chile: "CL",
  Venezuela: "VE",
  CL: "CL",
  VE: "VE",
};

function normalizeCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  const c = country.trim();
  return COUNTRY_NORMALIZE[c] ?? c;
}

async function resolvePaymentMethodsForCountry(country: string | null) {
  const normalizedCountry = normalizeCountry(country);
  const { data: methods } = await supabaseAdmin
    .from("plan_payment_methods")
    .select("id,slug,name,countries,auto_verify")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const rows = ((methods ?? []) as MethodSnapshot[]).filter((method) => {
    if (!normalizedCountry) return true;
    if (!Array.isArray(method.countries) || method.countries.length === 0) return true;
    return method.countries.includes(normalizedCountry) || method.countries.includes(country ?? "");
  });

  const rowsWithConfig = await Promise.all(
    rows.map(async (method) => {
      const { data: configRows } = await supabaseAdmin
        .from("plan_payment_method_config")
        .select("key,value")
        .eq("method_id", method.id);

      const config: Record<string, string> = {};
      for (const row of configRows ?? []) {
        if (row.key) config[row.key] = row.value ?? "";
      }

      return {
        ...method,
        config,
      };
    })
  );

  return rowsWithConfig;
}

async function buildPlanChangePreview(params: {
  companyId: string;
  targetPlanId: string;
  months: number;
}) {
  const [{ data: company }, { data: plans }, { count: activeBranches }, { count: activeUsers }, { data: entitlements }] = await Promise.all([
    supabaseAdmin
      .from("companies")
      .select("id,name,country,plan_id,subscription_status,subscription_ends_at")
      .eq("id", params.companyId)
      .maybeSingle(),
    supabaseAdmin
      .from("plans")
      .select("id,name,price,max_branches,max_users,is_active")
      .eq("is_active", true),
    supabaseAdmin
      .from("branches")
      .select("id", { count: "exact", head: true })
      .eq("company_id", params.companyId)
      .eq("is_active", true),
    supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("company_id", params.companyId)
      .eq("is_active", true),
    supabaseAdmin
      .from("company_branch_extra_entitlements")
      .select("quantity,status,expires_at")
      .eq("company_id", params.companyId),
  ]);

  const companyRow = company as CompanyRow | null;
  if (!companyRow?.id) return { error: "Empresa no encontrada" as const };

  const plansRows = (plans ?? []) as PlanRow[];
  const currentPlan = plansRows.find((row) => row.id === companyRow.plan_id) ?? null;
  const targetPlan = plansRows.find((row) => row.id === params.targetPlanId) ?? null;

  if (!targetPlan) return { error: "Plan no disponible" as const };
  if (currentPlan?.id === targetPlan.id) {
    return { error: "Ya estas en ese plan" as const };
  }

  const nowIso = new Date().toISOString();
  const activeEntitlements = ((entitlements ?? []) as Array<{ quantity: number | null; status: string | null; expires_at: string | null }>)
    .filter((row) => row.status === "active")
    .filter((row) => !row.expires_at || row.expires_at > nowIso)
    .reduce((acc, row) => acc + Math.max(0, Number(row.quantity ?? 0) || 0), 0);

  const branchesCount = Number(activeBranches ?? 0);
  const usersCount = Number(activeUsers ?? 0);

  const targetBaseBranches = targetPlan.max_branches;
  const targetEffectiveBranches = targetBaseBranches == null ? null : targetBaseBranches + activeEntitlements;

  const impacts: PlanImpact[] = [];

  if (targetEffectiveBranches != null && branchesCount > targetEffectiveBranches) {
    impacts.push({
      id: "branches-over-limit",
      level: "block",
      title: "Exceso de sucursales para el nuevo plan",
      detail: `Tienes ${branchesCount} sucursales activas y el nuevo limite efectivo seria ${targetEffectiveBranches}. Debes reducir ${branchesCount - targetEffectiveBranches} sucursal(es) antes de cambiar.`,
    });
  }

  if (targetPlan.max_users != null && usersCount > targetPlan.max_users) {
    impacts.push({
      id: "users-over-limit",
      level: "block",
      title: "Exceso de usuarios para el nuevo plan",
      detail: `Tienes ${usersCount} usuario(s) activo(s) y el nuevo plan permite ${targetPlan.max_users}. Debes ajustar usuarios antes de cambiar.`,
    });
  }

  const currentPrice = Number(currentPlan?.price ?? 0) || 0;
  const targetPrice = Number(targetPlan.price ?? 0) || 0;
  const monthlyDiff = Number((targetPrice - currentPrice).toFixed(2));
  const amountDue = monthlyDiff > 0 ? Number((monthlyDiff * Math.max(1, params.months)).toFixed(2)) : 0;

  if (monthlyDiff < 0) {
    impacts.push({
      id: "downgrade-no-refund",
      level: "warn",
      title: "Cambio a plan menor",
      detail: "El cambio se aplica sin reembolso del periodo ya pagado. Se reflejara en tu siguiente ciclo.",
    });
  }

  if (monthlyDiff > 0) {
    impacts.push({
      id: "upgrade-payment-required",
      level: "warn",
      title: "Requiere pago para aplicar ahora",
      detail: `Debes pagar ${amountDue} USD para aplicar el nuevo plan de inmediato.`,
    });
  }

  impacts.push({
    id: "feature-difference-check",
    level: "warn",
    title: "Revisa funciones incluidas",
    detail: "Al cambiar de plan, algunas capacidades pueden variar segun los limites del nuevo plan.",
  });

  const paymentMethods = await resolvePaymentMethodsForCountry(companyRow.country);

  return {
    company: companyRow,
    currentPlan,
    targetPlan,
    counts: {
      activeBranches: branchesCount,
      activeUsers: usersCount,
      activeExtraBranchEntitlements: activeEntitlements,
      targetEffectiveBranches,
    },
    pricing: {
      currentPrice,
      targetPrice,
      monthlyDiff,
      months: Math.max(1, params.months),
      amountDue,
      requiresPayment: amountDue > 0,
    },
    impacts,
    paymentMethods,
  };
}

export async function GET(req: NextRequest) {
  const ctx = await getCustomerAccountContext();
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const targetPlanId = String(req.nextUrl.searchParams.get("targetPlanId") ?? "").trim();
  const months = Math.max(1, Math.min(24, Number(req.nextUrl.searchParams.get("months") ?? 1) || 1));
  if (!targetPlanId) return NextResponse.json({ error: "Falta targetPlanId" }, { status: 400 });

  const preview = await buildPlanChangePreview({
    companyId: ctx.companyId,
    targetPlanId,
    months,
  });

  if ("error" in preview) {
    return NextResponse.json({ error: preview.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, preview });
}

export async function POST(req: NextRequest) {
  const ctx = await getCustomerAccountContext();
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    targetPlanId?: string;
    months?: number;
    methodSlug?: string;
    acceptedImpactIds?: string[];
  };

  const targetPlanId = String(body.targetPlanId ?? "").trim();
  const months = Math.max(1, Math.min(24, Number(body.months ?? 1) || 1));
  const methodSlug = String(body.methodSlug ?? "").trim();
  const acceptedImpactIds = Array.isArray(body.acceptedImpactIds)
    ? body.acceptedImpactIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!targetPlanId) {
    return NextResponse.json({ error: "Falta targetPlanId" }, { status: 400 });
  }

  const preview = await buildPlanChangePreview({
    companyId: ctx.companyId,
    targetPlanId,
    months,
  });

  if ("error" in preview) {
    return NextResponse.json({ error: preview.error }, { status: 400 });
  }

  const blockingImpacts = preview.impacts.filter((impact) => impact.level === "block");
  if (blockingImpacts.length > 0) {
    return NextResponse.json(
      {
        error: "No puedes aplicar este cambio todavia.",
        impacts: preview.impacts,
      },
      { status: 400 }
    );
  }

  const warningIds = preview.impacts.filter((impact) => impact.level === "warn").map((impact) => impact.id);
  const allWarningsAccepted = warningIds.every((id) => acceptedImpactIds.includes(id));
  if (!allWarningsAccepted) {
    return NextResponse.json(
      {
        error: "Debes confirmar los avisos antes de continuar.",
        impacts: preview.impacts,
      },
      { status: 400 }
    );
  }

  if (!preview.pricing.requiresPayment) {
    await supabaseAdmin
      .from("companies")
      .update({
        plan_id: preview.targetPlan.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ctx.companyId);

    await supabaseAdmin.from("saas_tickets").insert({
      company_id: ctx.companyId,
      created_by_email: ctx.email,
      source: "tenant",
      subject: `Cambio de plan aplicado · ${preview.currentPlan?.name ?? "Actual"} -> ${preview.targetPlan.name}`,
      description: [
        `Plan anterior: ${preview.currentPlan?.name ?? "Sin plan"}`,
        `Plan nuevo: ${preview.targetPlan.name}`,
        "Aplicacion inmediata sin cobro adicional.",
      ].join("\n"),
      category: "billing",
      priority: "medium",
      status: "resolved",
      last_message_at: new Date().toISOString(),
      resolved_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      appliedNow: true,
      message: "Plan actualizado correctamente.",
      preview,
    });
  }

  if (!methodSlug) {
    return NextResponse.json({ error: "Selecciona un metodo de pago" }, { status: 400 });
  }

  const selectedMethod = preview.paymentMethods.find((method) => method.slug === methodSlug);
  if (!selectedMethod) {
    return NextResponse.json({ error: "Metodo de pago no disponible" }, { status: 400 });
  }

  const paymentReference = `PLANCHG-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const nowIso = new Date().toISOString();

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments_history")
    .insert({
      company_id: ctx.companyId,
      plan_id: preview.targetPlan.id,
      amount_paid: preview.pricing.amountDue,
      months_paid: preview.pricing.months,
      payment_method: selectedMethod.name,
      payment_method_slug: selectedMethod.slug,
      payment_reference: paymentReference,
      status: selectedMethod.auto_verify ? "paid" : "pending_validation",
      payment_date: selectedMethod.auto_verify ? nowIso : null,
    })
    .select("id,amount_paid,months_paid,payment_reference,status,payment_method,payment_method_slug,payment_date,reference_file_url")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: paymentError?.message ?? "No se pudo crear el pago" }, { status: 500 });
  }

  if (selectedMethod.auto_verify) {
    await supabaseAdmin
      .from("companies")
      .update({
        plan_id: preview.targetPlan.id,
        subscription_status: "active",
        updated_at: nowIso,
      })
      .eq("id", ctx.companyId);
  }

  await supabaseAdmin.from("saas_tickets").insert({
    company_id: ctx.companyId,
    created_by_email: ctx.email,
    source: "tenant",
    subject: `Cambio de plan ${selectedMethod.auto_verify ? "aplicado" : "pendiente"} · ${paymentReference}`,
    description: [
      `Plan anterior: ${preview.currentPlan?.name ?? "Sin plan"}`,
      `Plan nuevo: ${preview.targetPlan.name}`,
      `Monto: ${preview.pricing.amountDue} USD`,
      `Metodo: ${selectedMethod.name}`,
      `Referencia: ${paymentReference}`,
      selectedMethod.auto_verify ? "Resultado: cambio aplicado automaticamente." : "Resultado: pendiente de validacion manual.",
    ].join("\n"),
    category: "billing",
    priority: "high",
    status: selectedMethod.auto_verify ? "resolved" : "open",
    last_message_at: nowIso,
    resolved_at: selectedMethod.auto_verify ? nowIso : null,
  });

  return NextResponse.json({
    ok: true,
    appliedNow: selectedMethod.auto_verify,
    payment,
    preview,
    message: selectedMethod.auto_verify
      ? "Pago procesado y plan actualizado."
      : "Pago creado. El cambio de plan se aplicara cuando validemos tu pago.",
  });
}
