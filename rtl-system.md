# RTL & Internationalization Foundation

## Architecture Decisions

- **Core library:** `i18next` + `react-i18next` for scalable namespace-based localization.
- **Single source of truth:** `frontend/src/i18n/translations.js` defines supported languages, default language, direction metadata, and initial resources.
- **Default locale:** Arabic (`ar`) is the default language for first-time visitors.
- **Persistence:** Language choice is stored in `localStorage` using key `lms.language`.
- **Startup restore:** `frontend/src/i18n/index.js` restores persisted language during app bootstrap (`frontend/src/main.jsx` imports `./i18n` before rendering).
- **Global document sync:** On every language change, `<html>` attributes are updated:
  - `ar` -> `lang="ar"` and `dir="rtl"`
  - `en` -> `lang="en"` and `dir="ltr"`
- **Non-breaking rollout:** Current business logic remains unchanged. The i18n layer is additive and safe for gradual migration.

## RTL Conventions (Tailwind + CSS)

- Prefer logical utilities over physical left/right:
  - `ms-*` / `me-*` instead of `ml-*` / `mr-*`
  - `ps-*` / `pe-*` instead of `pl-*` / `pr-*`
  - `start-*` / `end-*` instead of `left-*` / `right-*`
  - `text-start` / `text-end` instead of `text-left` / `text-right`
- Keep layout direction controlled globally via `html[dir]`; avoid per-component hardcoded direction unless required.
- Use `.rtl-flip` utility for icons that indicate direction (arrows, chevrons) so they mirror automatically in RTL.
- Avoid absolute positioning with `left/right` in new UI unless it is direction-agnostic by design.

## Typography Strategy

- Arabic-first typography is enabled through CSS variables:
  - Default (English): `Inter`
  - Arabic (`html[lang="ar"]`): `Cairo`, with `IBM Plex Sans Arabic` fallback
- Tailwind `font-sans` now reads from `--font-family-sans`, allowing automatic language-based font switching without touching components.

## Migration Guidelines for Future Components

- Add translatable strings through i18n keys; avoid hardcoded text in new components.
- Keep translation keys grouped by domain (for example `nav`, `auth`, `course`, `admin`) to scale cleanly.
- When updating existing components:
  1. Replace user-facing literals with `t("...")`.
  2. Convert physical spacing/position classes to logical ones.
  3. Validate in both `ar` and `en` with dark/light themes.
- For mixed-language content (for example course names in English inside Arabic UI), allow natural text flow and avoid forcing per-node `dir` unless needed.

## Common Pitfalls to Avoid

- Do not use `left/right` classes for new directional UI controls.
- Do not assume icons always point the same way in both directions.
- Do not hardcode fonts in components; rely on `font-sans` + global variables.
- Do not store language in multiple places; use i18n state + `lms.language`.
- Do not translate API values or role identifiers directly; map display labels in UI translation keys.

