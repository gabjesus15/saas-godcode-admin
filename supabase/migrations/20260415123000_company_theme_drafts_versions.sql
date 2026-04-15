create table if not exists public.company_theme_drafts (
  company_id uuid primary key references public.companies(id) on delete cascade,
  theme_config jsonb not null default '{}'::jsonb,
  updated_by_email text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_theme_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  theme_config jsonb not null default '{}'::jsonb,
  created_by_email text null,
  created_at timestamptz not null default now()
);

create index if not exists company_theme_versions_company_created_idx
  on public.company_theme_versions (company_id, created_at desc);

alter table public.company_theme_drafts enable row level security;
alter table public.company_theme_versions enable row level security;

comment on table public.company_theme_drafts is
  'Borrador editable de branding por empresa. No impacta producción hasta publicar.';

comment on table public.company_theme_versions is
  'Histórico de versiones publicadas de theme_config por empresa.';
