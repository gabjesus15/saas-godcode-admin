create table if not exists public.landing_media_assets (
  key text primary key,
  src text not null,
  alt text not null default '',
  label text,
  sub text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists landing_media_assets_sort_idx on public.landing_media_assets (sort_order asc, key asc);

create table if not exists public.landing_webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination_type text not null,
  url text not null,
  events text[] not null default array['lead.created','contact.created']::text[],
  is_active boolean not null default true,
  secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint landing_webhook_destination_type_check check (destination_type in ('slack','email'))
);

create index if not exists landing_webhook_subscriptions_active_idx on public.landing_webhook_subscriptions (is_active);

alter table public.landing_media_assets enable row level security;
alter table public.landing_webhook_subscriptions enable row level security;

comment on table public.landing_media_assets is 'Assets configurables de la landing (hero, features y carrusel).';
comment on table public.landing_webhook_subscriptions is 'Webhooks opcionales para eventos de landing (leads/contactos).';
