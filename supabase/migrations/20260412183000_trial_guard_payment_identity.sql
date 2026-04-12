alter table public.payments_history
  add column if not exists payer_email_normalized text;

alter table public.payments_history
  add column if not exists card_fingerprint_hash text;

create index if not exists idx_payments_history_payer_email_normalized
  on public.payments_history (payer_email_normalized);

create index if not exists idx_payments_history_card_fingerprint_hash
  on public.payments_history (card_fingerprint_hash)
  where card_fingerprint_hash is not null;
