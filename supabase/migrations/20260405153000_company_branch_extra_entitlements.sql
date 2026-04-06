create table if not exists public.company_branch_extra_entitlements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid not null unique references public.payments_history(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  months_purchased integer not null default 1 check (months_purchased > 0),
  first_cycle_factor numeric(10,6) not null default 1,
  effective_months numeric(10,6) not null default 1,
  unit_price numeric(10,2) not null default 20,
  amount_paid numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled')),
  starts_at timestamptz null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_branch_extra_entitlements_company_status_idx
  on public.company_branch_extra_entitlements (company_id, status);

create index if not exists company_branch_extra_entitlements_expires_idx
  on public.company_branch_extra_entitlements (expires_at);

alter table public.company_branch_extra_entitlements enable row level security;

comment on table public.company_branch_extra_entitlements is
  'Entitlements estructurados de sucursales extra compradas por empresa (co-terminadas con el plan cuando aplica).';
