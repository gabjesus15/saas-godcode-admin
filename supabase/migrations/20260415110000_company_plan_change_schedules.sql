create table if not exists public.company_plan_change_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requested_by_email text null,
  current_plan_id uuid null references public.plans(id) on delete set null,
  target_plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'scheduled' check (status in ('scheduled', 'applied', 'cancelled', 'failed')),
  reason text null,
  effective_at timestamptz not null,
  requested_at timestamptz not null default now(),
  applied_at timestamptz null,
  apply_error text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_plan_change_schedules_company_status_idx
  on public.company_plan_change_schedules (company_id, status);

create index if not exists company_plan_change_schedules_effective_status_idx
  on public.company_plan_change_schedules (effective_at, status);

create unique index if not exists company_plan_change_schedules_one_active_per_company_idx
  on public.company_plan_change_schedules (company_id)
  where status = 'scheduled';

alter table public.company_plan_change_schedules enable row level security;

comment on table public.company_plan_change_schedules is
  'Cambios de plan programados por tenant para aplicarse al cierre del ciclo actual.';
