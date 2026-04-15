-- Move tenant admin permissions to company-level theme_config.panelAccess,
-- then remove deprecated per-user allowed_tabs storage.

WITH derived_panel_access AS (
  SELECT
    c.id,
    COALESCE(
      jsonb_agg(DISTINCT to_jsonb(tab.tab_id)) FILTER (
        WHERE tab.tab_id IS NOT NULL AND btrim(tab.tab_id) <> ''
      ),
      '[]'::jsonb
    ) AS panel_access
  FROM public.companies c
  LEFT JOIN LATERAL jsonb_each(
    CASE
      WHEN jsonb_typeof(c.theme_config -> 'roleNavPermissions') = 'object'
        THEN c.theme_config -> 'roleNavPermissions'
      ELSE '{}'::jsonb
    END
  ) role_permissions(key, value) ON TRUE
  LEFT JOIN LATERAL jsonb_array_elements_text(
    CASE
      WHEN jsonb_typeof(role_permissions.value) = 'array'
        THEN role_permissions.value
      ELSE '[]'::jsonb
    END
  ) tab(tab_id) ON TRUE
  WHERE c.theme_config IS NOT NULL
    AND (c.theme_config ? 'roleNavPermissions')
    AND NOT (c.theme_config ? 'panelAccess')
  GROUP BY c.id
)
UPDATE public.companies c
SET theme_config = jsonb_set(
  COALESCE(c.theme_config, '{}'::jsonb),
  '{panelAccess}',
  d.panel_access,
  TRUE
)
FROM derived_panel_access d
WHERE c.id = d.id;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS allowed_tabs;
