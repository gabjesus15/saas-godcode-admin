import { NextResponse } from "next/server";

import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { SAAS_READ_ROLES, validateAdminRolesOnServer } from "../../../../../utils/admin/server-auth";

type Status = "new" | "contacted" | "closed";

async function countRows(table: "landing_leads" | "landing_contacts", status?: Status): Promise<number> {
  let query = supabaseAdmin.from(table).select("id", { head: true, count: "exact" });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function dateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export async function GET() {
  const access = await validateAdminRolesOnServer([...SAAS_READ_ROLES]);
  if (!access.ok) {
    return NextResponse.json({ error: access.error ?? "No autorizado" }, { status: access.status });
  }

  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 29);
    const fromIso = fromDate.toISOString();

    const [
      leadsTotal,
      contactsTotal,
      leadsNew,
      leadsContacted,
      leadsClosed,
      contactsNew,
      contactsContacted,
      contactsClosed,
      recentLeads,
      recentContacts,
    ] = await Promise.all([
      countRows("landing_leads"),
      countRows("landing_contacts"),
      countRows("landing_leads", "new"),
      countRows("landing_leads", "contacted"),
      countRows("landing_leads", "closed"),
      countRows("landing_contacts", "new"),
      countRows("landing_contacts", "contacted"),
      countRows("landing_contacts", "closed"),
      supabaseAdmin.from("landing_leads").select("created_at").gte("created_at", fromIso).order("created_at", { ascending: true }),
      supabaseAdmin.from("landing_contacts").select("created_at").gte("created_at", fromIso).order("created_at", { ascending: true }),
    ]);

    if (recentLeads.error) throw new Error(recentLeads.error.message);
    if (recentContacts.error) throw new Error(recentContacts.error.message);

    const dailyMap = new Map<string, { leads: number; contacts: number }>();
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(fromDate);
      d.setDate(fromDate.getDate() + i);
      dailyMap.set(d.toISOString().slice(0, 10), { leads: 0, contacts: 0 });
    }

    for (const row of recentLeads.data ?? []) {
      const key = dateKey(row.created_at);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.leads += 1;
    }
    for (const row of recentContacts.data ?? []) {
      const key = dateKey(row.created_at);
      const bucket = dailyMap.get(key);
      if (bucket) bucket.contacts += 1;
    }

    const series = [...dailyMap.entries()].map(([date, values]) => ({
      date,
      leads: values.leads,
      contacts: values.contacts,
    }));

    return NextResponse.json({
      metrics: {
        leadsTotal,
        contactsTotal,
        inboxTotal: leadsTotal + contactsTotal,
        leadsByStatus: { new: leadsNew, contacted: leadsContacted, closed: leadsClosed },
        contactsByStatus: { new: contactsNew, contacted: contactsContacted, closed: contactsClosed },
      },
      series,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo cargar métricas de landing" },
      { status: 500 },
    );
  }
}
