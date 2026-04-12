create table if not exists public.landing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'landing',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_leads_email_check check (position('@' in email) > 1)
);

create unique index if not exists landing_leads_email_unique_idx on public.landing_leads (lower(email));
create index if not exists landing_leads_created_at_idx on public.landing_leads (created_at desc);
create index if not exists landing_leads_status_idx on public.landing_leads (status);

create table if not exists public.landing_contacts (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  source text not null default 'landing',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_contacts_message_len_check check (char_length(message) >= 10)
);

create index if not exists landing_contacts_created_at_idx on public.landing_contacts (created_at desc);
create index if not exists landing_contacts_status_idx on public.landing_contacts (status);
create index if not exists landing_contacts_email_idx on public.landing_contacts (lower(email));

alter table public.landing_leads enable row level security;
alter table public.landing_contacts enable row level security;

comment on table public.landing_leads is 'Leads capturados desde landing (newsletter/espera).';
comment on table public.landing_contacts is 'Consultas capturadas desde formulario de contacto de la landing.';
