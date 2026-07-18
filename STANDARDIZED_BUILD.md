# Static Validation and Client Maintenance

`public_site/` is the canonical deployable artifact. `npm run build` validates it; it does
not regenerate profile or city HTML.

## Supported commands

```bash
npm ci
npm run lint
npm run typecheck
npm run check:remediation-contract
npm run build
npm run serve:static
```

The browser client reads only `public_site/appraisers.json` and
`public_site/locations.json`. It must not import the wider corpus in
`src/data/standardized/`.

Profile and city HTML changes are direct, reviewed edits. Production promotion uses the
standard VPS deploy helper for `art-appraisers-directory`; repo-local publish and deploy
commands intentionally fail.

The authoritative workflow and publication contract are documented in
`docs/operational-guardrails.md`.
