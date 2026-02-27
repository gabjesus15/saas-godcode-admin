# Tenant Template

This folder holds a copy of the current tenant-facing UI so it can be adapted as the white-label template.

Contents
- app/[subdomain]/layout.tsx: tenant wrapper, metadata, CSS vars
- app/[subdomain]/page.tsx: tenant landing page
- components/tenant/store-unavailable.tsx: neutral fallback page

Theme hooks
- CSS variable: --tenant-primary is used as the primary brand color
- Logo URL: company.theme_config.logoUrl
- Initials fallback: derived from company name

Notes
- This is a copy of the live tenant files. Update the live files first, then re-copy if you want to refresh this template.
