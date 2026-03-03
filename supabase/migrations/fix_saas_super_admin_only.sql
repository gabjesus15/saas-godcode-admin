-- ========================================================================
-- MIGRATION: SaaS Access - Solo Super Admin
-- Fecha: 2026-03-03
-- Descripción: Restringe el acceso al panel SaaS únicamente a usuarios
--              con rol 'super_admin' en la tabla admin_users
-- ========================================================================

BEGIN;

-- ========================================================================
-- PASO 1: ACTUALIZAR CHECK CONSTRAINT EN admin_users
-- ========================================================================
-- Propósito: Asegurar que solo se puedan crear usuarios con role = 'super_admin'
-- Antes: Permitía solo 'super_admin' pero con default 'admin' (conflicto)
-- Después: Solo permite 'super_admin' y lo establece como default

-- Eliminar constraint anterior si existe
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- Crear nuevo constraint: SOLO super_admin permitido
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check 
CHECK (role = 'super_admin');

DO $$ BEGIN
  RAISE NOTICE '✓ CHECK constraint actualizado: admin_users solo acepta role = super_admin';
END $$;

-- ========================================================================
-- PASO 2: ESTABLECER DEFAULT CORRECTO
-- ========================================================================
-- Propósito: Cuando se inserte un nuevo registro sin especificar role,
--           automáticamente se asignará 'super_admin'
-- Antes: Default era 'admin' (incompatible con el CHECK constraint)
-- Después: Default es 'super_admin'

ALTER TABLE admin_users ALTER COLUMN role SET DEFAULT 'super_admin';

DO $$ BEGIN
  RAISE NOTICE '✓ Default role establecido en: super_admin';
END $$;

-- ========================================================================
-- PASO 3: ACTUALIZAR USUARIOS EXISTENTES
-- ========================================================================
-- Propósito: Normalizar todos los usuarios actuales a 'super_admin'
-- Esto asegura que los 2 correos autorizados tengan el role correcto

UPDATE admin_users 
SET role = 'super_admin' 
WHERE role != 'super_admin';

DO $$ BEGIN
  RAISE NOTICE '✓ Usuarios existentes actualizados a super_admin';
END $$;

-- ========================================================================
-- PASO 4: ARREGLAR FUNCIÓN RLS - is_admin()
-- ========================================================================
-- Propósito: Esta función es usada por políticas RLS para validar
--           si el usuario actual tiene permisos de administrador
-- Cambio: Ahora valida que en admin_users el role sea 'super_admin'
--        (antes permitía cualquier email en admin_users sin validar role)
-- Uso: Políticas RLS en tablas admin_users, users, etc.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_email text;
begin
  -- Extraer email del JWT token
  v_email := (current_setting('request.jwt.claims', true)::jsonb ->> 'email');
  
  -- Retorna TRUE si:
  -- 1. Es un usuario tenant con role 'admin' o 'ceo' en su company, O
  -- 2. Es un usuario SaaS con role 'super_admin' en admin_users
  return exists (
    select 1 from public.users
    where auth_user_id = auth.uid()
      and role in ('admin', 'ceo')
      and is_active = true
  )
  or (
    v_email is not null
    and exists (
      select 1 from public.admin_users
      where email = v_email
      and role = 'super_admin'  -- ✅ VALIDACIÓN DE ROLE AGREGADA
    )
  );
end;
$function$;

DO $$ BEGIN
  RAISE NOTICE '✓ Función is_admin() actualizada con validación de role super_admin';
END $$;

-- ========================================================================
-- PASO 5: ARREGLAR FUNCIÓN RLS - is_super_admin()
-- ========================================================================
-- Propósito: Valida si el usuario actual es un super administrador del SaaS
-- Cambio: Ahora valida explícitamente que role = 'super_admin'
--        (antes solo verificaba existencia del email en admin_users)
-- Uso: Políticas RLS que requieren permisos globales máximos

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.email = auth.jwt() ->> 'email'
    AND au.role = 'super_admin'  -- ✅ VALIDACIÓN DE ROLE AGREGADA
  );
$function$;

DO $$ BEGIN
  RAISE NOTICE '✓ Función is_super_admin() actualizada con validación de role super_admin';
END $$;

-- ========================================================================
-- PASO 6: VERIFICACIONES FINALES
-- ========================================================================
-- Propósito: Confirmar que todos los cambios se aplicaron correctamente

DO $$
DECLARE
  v_admin_count INT;
  v_constraint_def TEXT;
  v_default_role TEXT;
BEGIN
  -- Contar usuarios en admin_users
  SELECT COUNT(*) INTO v_admin_count FROM admin_users;
  
  -- Verificar constraint
  SELECT pg_get_constraintdef(oid) INTO v_constraint_def
  FROM pg_constraint 
  WHERE conrelid = 'admin_users'::regclass 
    AND contype = 'c'
    AND conname = 'admin_users_role_check';
  
  -- Verificar default
  SELECT column_default INTO v_default_role
  FROM information_schema.columns
  WHERE table_name = 'admin_users' 
    AND column_name = 'role';
  
  -- Mostrar resumen
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total usuarios SaaS: %', v_admin_count;
  RAISE NOTICE 'Constraint CHECK: %', v_constraint_def;
  RAISE NOTICE 'Default role: %', v_default_role;
  RAISE NOTICE '========================================';
  
  -- Mostrar usuarios actuales
  RAISE NOTICE 'Usuarios con acceso SaaS:';
  FOR v_constraint_def IN 
    SELECT '  - ' || email || ' (role: ' || role || ')' 
    FROM admin_users 
    ORDER BY email
  LOOP
    RAISE NOTICE '%', v_constraint_def;
  END LOOP;
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ========================================================================
-- RESUMEN DE CAMBIOS
-- ========================================================================
-- 1. ✅ admin_users acepta SOLO role = 'super_admin'
-- 2. ✅ Default role = 'super_admin'
-- 3. ✅ Usuarios existentes normalizados a 'super_admin'
-- 4. ✅ is_admin() valida role en admin_users
-- 5. ✅ is_super_admin() valida role en admin_users
-- 6. ✅ Verificaciones muestran estado final
-- ========================================================================
-- PRÓXIMOS PASOS EN EL CÓDIGO:
-- - utils/admin/server-auth.ts: Ya actualizado para validar solo 'super_admin'
-- - app/(super-admin)/layout.tsx: Ya actualizado para validar solo 'super_admin'
-- - app/api/superadmin-user/route.ts: Ya actualizado para validar solo 'super_admin'
-- ========================================================================
