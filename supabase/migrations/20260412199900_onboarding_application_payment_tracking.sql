alter table public.onboarding_applications
  add column if not exists payment_reference text,
  add column if not exists payment_status text,
  add column if not exists payment_reference_url text,
  add column if not exists payment_months integer,
  add column if not exists payment_amount numeric;

create index if not exists onboarding_applications_payment_reference_idx
  on public.onboarding_applications (payment_reference);