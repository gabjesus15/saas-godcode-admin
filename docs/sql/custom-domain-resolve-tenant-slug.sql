-- Referencia: migraciones MCP `companies_custom_domain_expires_at_and_resolve_rpc` y
-- `resolve_custom_domain_use_subscription_ends_at`. Úsalo solo en entornos nuevos.

alter table public.companies
	add column if not exists custom_domain_expires_at timestamptz null;

create or replace function public.resolve_public_slug_by_custom_domain(p_host text)
returns text
language sql
stable
security definer
set search_path = public
as $$
	select c.public_slug::text
	from public.companies c
	where
		c.public_slug is not null
		and c.custom_domain is not null
		and trim(c.custom_domain) <> ''
		and lower(regexp_replace(trim(c.custom_domain), '^www\.', ''))
			= lower(regexp_replace(trim(p_host), '^www\.', ''))
		and lower(coalesce(c.subscription_status, '')) not in ('suspended', 'cancelled')
		and (
			c.subscription_ends_at is null
			or c.subscription_ends_at > now()
		)
	limit 1;
$$;

grant execute on function public.resolve_public_slug_by_custom_domain(text) to anon;
grant execute on function public.resolve_public_slug_by_custom_domain(text) to authenticated;
