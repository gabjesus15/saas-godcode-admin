alter table public.analytics_events
  add column if not exists country_code text;

create index if not exists analytics_events_country_code_created_at_idx
  on public.analytics_events (country_code, created_at desc);
