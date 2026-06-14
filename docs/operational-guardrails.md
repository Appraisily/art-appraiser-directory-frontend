# Art Appraiser Directory Frontend

This repo is static-first.

## Canonical Workflow

- `public_site/` is the canonical published artifact.
- Production serves the HTML in `public_site/` through the release directory.
- Edit HTML in `public_site/` directly for normal page changes.
- Keep source facts in `data/` when they are still useful, but do not require a frontend rebuild to publish content.

## Commands

- Validate the static artifact without mutating profile/location HTML: `npm run build`
- Validate the static artifact: `npm run check:static`
- Serve the static artifact locally: `npm run serve:static`
- Publish envelope/homepage/assets only: `npm run publish:patch`
- Patch homepage/nav/footer/static assets without replacing content routes: `npm run publish:patch`

## Guardrails

- Do not reintroduce Vite/SPA build steps into the normal production workflow.
- Do not treat `dist/` as the source of truth.
- Do not add instructions that tell future agents to regenerate the site before every edit.
- Prefer direct edits to `public_site/` for content and SEO changes.
- Do not use npm commands or scripts to mass-edit `public_site/appraiser/**` or `public_site/location/**`.
- Individual profile and city page content may only change through direct, reviewed HTML edits.
- Use `publish:patch` for visual/envelope/static-only deploys; full generated publish is disabled.
- If bulk refresh is needed, update only the affected HTML pages rather than rebuilding an app shell.
