# i18n Enterprise Workflow (free stack)

This project uses an enterprise-grade but free localization workflow based on:

- next-intl for runtime localization.
- Local validation scripts to avoid locale drift.
- Local autofill script to keep locale schemas aligned.

## Commands

- npm run i18n:validate
  - Validates all locale files against messages/es.json.
  - Fails on missing keys, extra keys, and type mismatches.

- npm run i18n:fill-missing
  - Fills missing keys in locale files using messages/es.json.

## Recommended CI policy

1. Run npm run i18n:validate on every pull request.
2. Block merge if locale validation fails.

## Optional free collaboration tools

If you later need translator collaboration, use free/open alternatives:

- Weblate (self-hosted)
- Tolgee OSS (self-hosted)
