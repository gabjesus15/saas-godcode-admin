create table if not exists public.super_admin_notification_state (
  key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.super_admin_notification_state enable row level security;

comment on table public.super_admin_notification_state is 'Estado para automatizaciones internas super-admin (p. ej. watermark de alertas Telegram). Sin políticas públicas; solo service_role.';
