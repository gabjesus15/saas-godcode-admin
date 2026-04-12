create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_name text not null default 'page_view',
  page_type text not null default 'unknown' check (page_type in ('landing','tenant','saas','unknown')),
  path text not null,
  host text,
  referrer text,
  title text,
  visitor_id text,
  session_id text,
  tenant_slug text,
  company_id uuid references public.companies(id) on delete set null,
  country_code text,
  user_agent text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events (created_at desc);

create index if not exists analytics_events_page_type_created_at_idx
  on public.analytics_events (page_type, created_at desc);

create index if not exists analytics_events_company_created_at_idx
  on public.analytics_events (company_id, created_at desc);

create index if not exists analytics_events_country_code_created_at_idx
  on public.analytics_events (country_code, created_at desc);

create index if not exists analytics_events_visitor_created_at_idx
  on public.analytics_events (visitor_id, created_at desc);

alter table public.analytics_events enable row level security;
