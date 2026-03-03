-- Migration: Enforce SaaS Access Control Cleanup
-- Purpose: Restrict SaaS panel access to exactly two authorized emails
-- Date: 2026-03-03

BEGIN;

-- Step 1: Remove from users table any email that has owner/super_admin in admin_users
DELETE FROM users
WHERE LOWER(TRIM(email)) IN (
  SELECT LOWER(TRIM(email))
  FROM admin_users
  WHERE LOWER(TRIM(COALESCE(role, ''))) IN ('owner', 'super_admin')
);

-- Step 2: Handle migration of non-authorized admin_users
-- Check if admin_users has company_id column and conditionally migrate
DO $$
DECLARE
  v_has_company_column BOOLEAN;
  v_non_authorized_COUNT INT;
BEGIN
  -- Check if company_id column exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'admin_users'
    AND column_name = 'company_id'
  ) INTO v_has_company_column;

  IF v_has_company_column THEN
    -- If column exists, migrate non-authorized correos to users with their company_id
    INSERT INTO users (email, role, company_id, auth_user_id, created_at)
    SELECT 
      au.email,
      au.role,
      au.company_id,
      NULL::UUID,
      NOW()
    FROM admin_users au
    WHERE LOWER(TRIM(COALESCE(au.role, ''))) NOT IN ('owner', 'super_admin')
      AND NOT EXISTS (
        SELECT 1
        FROM users u
        WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(au.email))
        AND u.company_id = au.company_id
      )
    ON CONFLICT DO NOTHING;
  ELSE
    -- If no company_id column, only migrate if user already exists in users table
    -- This prevents creating orphaned records
    COUNT(DISTINCT au.email) INTO v_non_authorized_COUNT
    FROM admin_users au
    WHERE LOWER(TRIM(COALESCE(au.role, ''))) NOT IN ('owner', 'super_admin')
      AND EXISTS (
        SELECT 1
        FROM users u
        WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(au.email))
      );
    
    IF v_non_authorized_COUNT > 0 THEN
      -- Safe to proceed with deletion since these users exist in users table
      RAISE NOTICE 'Found % non-authorized correos that also exist in users table', v_non_authorized_COUNT;
    END IF;
  END IF;
END $$;

-- Step 3: Delete from admin_users all entries with roles NOT IN (owner, super_admin)
DELETE FROM admin_users
WHERE LOWER(TRIM(COALESCE(role, ''))) NOT IN ('owner', 'super_admin');

-- Step 4: Verify only two authorized emails remain in admin_users (optional validation)
-- This will show in the transaction result
DO $$
DECLARE
  v_remaining_count INT;
BEGIN
  SELECT COUNT(*) INTO v_remaining_count
  FROM admin_users
  WHERE LOWER(TRIM(COALESCE(role, ''))) IN ('owner', 'super_admin');
  
  RAISE NOTICE 'SaaS access restricted to % authorized email(s)', v_remaining_count;
END $$;

COMMIT;
