-- SaaS panel staff: RLS helpers + policies (plan super-admin)
--
-- Requisitos:
-- - Tablas con políticas tenant existentes: estas políticas se SUMAN (OR) con las ya definidas.
-- - Si alguna tabla no tiene RLS habilitado, estas políticas no surten efecto hasta activar RLS
--   de forma coordinada con el resto del modelo.
--
-- Roles en public.admin_users.role (minúsculas): super_admin, support
-- - Lectura (SELECT): super_admin + support
-- - Escritura (INSERT/UPDATE/DELETE): solo super_admin

-- Helpers: lectura de email de sesión acotada (SECURITY DEFINER evita depender de RLS sobre admin_users / auth)
CREATE OR REPLACE FUNCTION public.saas_staff_session_email_norm()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
	SELECT lower(trim(btrim(coalesce(u.email::text, ''))))
	FROM auth.users u
	WHERE u.id = auth.uid()
	LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin_reader()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
	SELECT coalesce(
		auth.uid() IS NOT NULL
		AND exists (
			SELECT 1
			FROM public.admin_users au
			WHERE public.saas_staff_session_email_norm() <> ''
				AND lower(trim(btrim(coalesce(au.email::text, '')))) = public.saas_staff_session_email_norm()
				AND lower(trim(btrim(coalesce(au.role::text, '')))) = ANY (ARRAY['super_admin'::text, 'support'::text])
		),
		false
	);
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin_mutator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
	SELECT coalesce(
		auth.uid() IS NOT NULL
		AND exists (
			SELECT 1
			FROM public.admin_users au
			WHERE public.saas_staff_session_email_norm() <> ''
				AND lower(trim(btrim(coalesce(au.email::text, '')))) = public.saas_staff_session_email_norm()
				AND lower(trim(btrim(coalesce(au.role::text, '')))) = 'super_admin'
		),
		false
	);
$$;

REVOKE ALL ON FUNCTION public.saas_staff_session_email_norm() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_saas_admin_reader() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_saas_admin_mutator() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.saas_staff_session_email_norm() TO authenticated;
GRANT EXECUTE ON FUNCTION public.saas_staff_session_email_norm() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_saas_admin_reader() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_admin_reader() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_saas_admin_mutator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_saas_admin_mutator() TO service_role;

-- ---------------------------------------------------------------------------
-- admin_users: el layout super-admin lee la fila propia con la sesión del usuario
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "saas_staff_admin_users_self_select" ON public.admin_users;
CREATE POLICY "saas_staff_admin_users_self_select"
	ON public.admin_users
	FOR SELECT
	TO authenticated
	USING (
		public.saas_staff_session_email_norm() <> ''
		AND lower(trim(btrim(coalesce(admin_users.email::text, '')))) = public.saas_staff_session_email_norm()
	);

-- ---------------------------------------------------------------------------
-- Tablas tenant usadas desde el panel SaaS (SSR + cliente con cookie super-admin)
-- ---------------------------------------------------------------------------
-- companies
DROP POLICY IF EXISTS "saas_staff_companies_select" ON public.companies;
CREATE POLICY "saas_staff_companies_select"
	ON public.companies FOR SELECT TO authenticated
	USING (public.is_saas_admin_reader());

DROP POLICY IF EXISTS "saas_super_admin_companies_insert" ON public.companies;
CREATE POLICY "saas_super_admin_companies_insert"
	ON public.companies FOR INSERT TO authenticated
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_companies_update" ON public.companies;
CREATE POLICY "saas_super_admin_companies_update"
	ON public.companies FOR UPDATE TO authenticated
	USING (public.is_saas_admin_mutator())
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_companies_delete" ON public.companies;
CREATE POLICY "saas_super_admin_companies_delete"
	ON public.companies FOR DELETE TO authenticated
	USING (public.is_saas_admin_mutator());

-- branches
DROP POLICY IF EXISTS "saas_staff_branches_select" ON public.branches;
CREATE POLICY "saas_staff_branches_select"
	ON public.branches FOR SELECT TO authenticated
	USING (public.is_saas_admin_reader());

DROP POLICY IF EXISTS "saas_super_admin_branches_insert" ON public.branches;
CREATE POLICY "saas_super_admin_branches_insert"
	ON public.branches FOR INSERT TO authenticated
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_branches_update" ON public.branches;
CREATE POLICY "saas_super_admin_branches_update"
	ON public.branches FOR UPDATE TO authenticated
	USING (public.is_saas_admin_mutator())
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_branches_delete" ON public.branches;
CREATE POLICY "saas_super_admin_branches_delete"
	ON public.branches FOR DELETE TO authenticated
	USING (public.is_saas_admin_mutator());

-- users (tenant staff)
DROP POLICY IF EXISTS "saas_staff_users_select" ON public.users;
CREATE POLICY "saas_staff_users_select"
	ON public.users FOR SELECT TO authenticated
	USING (public.is_saas_admin_reader());

DROP POLICY IF EXISTS "saas_super_admin_users_insert" ON public.users;
CREATE POLICY "saas_super_admin_users_insert"
	ON public.users FOR INSERT TO authenticated
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_users_update" ON public.users;
CREATE POLICY "saas_super_admin_users_update"
	ON public.users FOR UPDATE TO authenticated
	USING (public.is_saas_admin_mutator())
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_users_delete" ON public.users;
CREATE POLICY "saas_super_admin_users_delete"
	ON public.users FOR DELETE TO authenticated
	USING (public.is_saas_admin_mutator());

-- business_info
DROP POLICY IF EXISTS "saas_staff_business_info_select" ON public.business_info;
CREATE POLICY "saas_staff_business_info_select"
	ON public.business_info FOR SELECT TO authenticated
	USING (public.is_saas_admin_reader());

DROP POLICY IF EXISTS "saas_super_admin_business_info_insert" ON public.business_info;
CREATE POLICY "saas_super_admin_business_info_insert"
	ON public.business_info FOR INSERT TO authenticated
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_business_info_update" ON public.business_info;
CREATE POLICY "saas_super_admin_business_info_update"
	ON public.business_info FOR UPDATE TO authenticated
	USING (public.is_saas_admin_mutator())
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_business_info_delete" ON public.business_info;
CREATE POLICY "saas_super_admin_business_info_delete"
	ON public.business_info FOR DELETE TO authenticated
	USING (public.is_saas_admin_mutator());

-- payments_history
DROP POLICY IF EXISTS "saas_staff_payments_history_select" ON public.payments_history;
CREATE POLICY "saas_staff_payments_history_select"
	ON public.payments_history FOR SELECT TO authenticated
	USING (public.is_saas_admin_reader());

DROP POLICY IF EXISTS "saas_super_admin_payments_history_insert" ON public.payments_history;
CREATE POLICY "saas_super_admin_payments_history_insert"
	ON public.payments_history FOR INSERT TO authenticated
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_payments_history_update" ON public.payments_history;
CREATE POLICY "saas_super_admin_payments_history_update"
	ON public.payments_history FOR UPDATE TO authenticated
	USING (public.is_saas_admin_mutator())
	WITH CHECK (public.is_saas_admin_mutator());

DROP POLICY IF EXISTS "saas_super_admin_payments_history_delete" ON public.payments_history;
CREATE POLICY "saas_super_admin_payments_history_delete"
	ON public.payments_history FOR DELETE TO authenticated
	USING (public.is_saas_admin_mutator());

-- plans (listado SSR super-admin; mutaciones siguen yendo por API service role en gran parte)
DROP POLICY IF EXISTS "saas_staff_plans_select" ON public.plans;
CREATE POLICY "saas_staff_plans_select"
	ON public.plans FOR SELECT TO authenticated
	USING (public.is_saas_admin_reader());
