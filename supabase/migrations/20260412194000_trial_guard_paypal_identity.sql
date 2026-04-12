alter table public.payments_history
  add column if not exists paypal_payer_id_hash text;

create index if not exists idx_payments_history_paypal_payer_id_hash
  on public.payments_history (paypal_payer_id_hash)
  where paypal_payer_id_hash is not null;