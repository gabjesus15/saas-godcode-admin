# i18n Free Workflow (next-intl + local scripts)

This project uses a 100% free localization workflow:

- Runtime i18n with next-intl.
- Locale consistency checks with local scripts.
- Missing-key autofill from source locale.

## Commands

- npm run i18n:validate
  - Validates all locale files against messages/es.json.
  - Fails on missing keys, extra keys, or type mismatches.

- npm run i18n:fill-missing
  - Fills missing keys in all locale files using messages/es.json as source.
  - Useful before opening PRs.

## Recommended team process

1. Add/modify copy in messages/es.json first.
2. Run npm run i18n:fill-missing.
3. Translate updated keys manually in each locale file.
4. Run npm run i18n:validate.
5. Commit changes.

## Recommended CI policy

Run npm run i18n:validate on every pull request so no locale drift reaches main.

## Optional free platforms

If you later need collaborative translators, use free/open options such as:

- Weblate (self-hosted)
- Tolgee OSS (self-hosted)

This keeps the workflow free and under your control.
