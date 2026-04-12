-- Credenciales y ajustes de integraciones por empresa (p. ej. Uber Direct OAuth por company).
-- El storefront no lee esta columna; solo el backend con service role.

alter table public.companies
  add column if not exists integration_settings jsonb not null default '{}'::jsonb;

comment on column public.companies.integration_settings is
  'JSON por empresa: uber.clientId, uber.clientSecretEncrypted (AES-GCM v1), etc.';
