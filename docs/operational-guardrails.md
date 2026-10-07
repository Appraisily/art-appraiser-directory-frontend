# Art Appraiser Directory Frontend

This repo is static-first.

## Canonical Workflow

- `public_site/` is the canonical published artifact.
- Production serves the HTML in `public_site/` through the release directory.
- Edit HTML in `public_site/` directly for normal page changes.
- Keep source facts in `data/` when they are still useful, but do not require a frontend rebuild to publish content.
- `data/provider-publication-manifest.json` controls provider eligibility. `public_site/appraisers.json`
  and `public_site/locations.json` are the only browser-facing provider/city registries.
- Nginx serves provider-specific HTML for verified and limited listings. Other provider-shaped URLs
  receive the generic `public_site/appraiser-unavailable.html` response.
- Matching FAIR Fine-art profiles may be cited as extra `sameAs` plus a "FAIR public registry" link.
  The official website remains the source CTA. FAIR verification status is not copied onto Art.

## Commands

- Validate the static artifact without mutating profile/location HTML: `npm run build`
- Validate TypeScript: `npm run typecheck`
- Validate provider/city/tracking parity: `npm run check:remediation-contract`
- Validate interaction states and telemetry: `npm run test:interactions`
- Validate initial/settled/no-JS parity against isolated nginx: `npm run test:settled-browser`
- Refresh sitemap/indexing metadata only: `npm run seo:indexing-manifest`
- Validate both public asset prefixes and reject retained orphans: `npm run check:asset-references`
- Validate the static artifact: `npm run check:static`
- Serve the static artifact locally: `npm run serve:static`
- Promote reviewed HTML only through the standard VPS deploy helper for `art-appraisers-directory`.

## Guardrails

- The shared static telemetry bootstrap stamps owned Appraisily handoff links
  with `seo_site`, `ref_path`, and the shared `journey_id`. Generic directory
  UTMs become `art_directory`; explicit acquisition tags remain intact. Synthetic
  markers follow the handoff. External provider links and local anchors stay intact.
  Deferred page scripts that replace links are observed and the same tags are
  restored idempotently before navigation.

- Do not reintroduce Vite/SPA build steps into the normal production workflow.
- Do not treat `dist/` as the source of truth.
- Do not add instructions that tell future agents to regenerate the site before every edit.
- Prefer direct edits to `public_site/` for content and SEO changes.
- Do not use npm commands or scripts to mass-edit `public_site/appraiser/**` or `public_site/location/**`.
- Individual profile and city page content may only change through direct, reviewed HTML edits.
- When the published cohort changes, update the manifest, public feeds, nginx allowlist, sitemap,
  and parity fixtures together; the static gate must fail if these surfaces disagree.
- Known nonprovider exclusions carry a sourced `retirementDecision` in the manifest
  and an explicit historical-ledger 404 outcome. They are not provider aliases or
  replacement office listings. Field-level source evidence and unknown-field
  omissions remain distinct from old identity-review dates. The shared strict
  `--require-field-scope` audit currently reports remaining evidence debt; T05 is
  not complete merely because the ordinary parity build passes.
- Both `/assets/` and `/directory/assets/` are active URL contracts. Candidate releases may retain
  only assets reached from the reviewed routes, public feeds, or their dependency graph.
- The two reviewed supporting resources are declared in `data/directory-resource-pages.json`.
  Their authored HTML is included by metadata-only sitemap generation and classified as
  `resource` in the central route registry. `npm run test:resources` verifies provider/source/date
  parity, homepage coverage, contextual links and the privacy-safe native print action.
  Resource publication does not alter provider eligibility or regenerate city/profile HTML.
- Methodology serves its authored static HTML without mounting the older SPA shell;
  the resource-link regression rejects a module entry that would replace those links.
- The five original reviewed profiles also retain authored static HTML without a
  legacy module mount. The resource unit gate includes negative metadata/content
  parity fixtures. The isolated release candidate gate additionally runs all sitemap
  HTTP checks and representative settled browser states at desktop/390px/320px,
  with verified JavaScript-enabled and disabled modes, source dates and native links.
- Correction and unavailable-listing HTML also retain their static content without
  a legacy mount. No active document invokes the React canonical helper. The
  browser gate tests the correction/methodology noindex policies and provider
  404/410 responses separately from the strict indexable sitemap contract, including
  native contact navigation with QA/attribution intact and no form submission.
- Routine `seo:indexing-manifest` is metadata-only. Broad writing requires explicit
  `--write --allow-reviewed-content-write`; it is not a maintenance shortcut.
  Missing declared resource HTML fails closed. Only explicit `--fixture` inputs
  outside canonical `public_site/` may intentionally omit resources.
- Client-bundle maintenance must replace the candidate's old hashed entries and then pass
  `npm run check:asset-references`; recursive copy-on-top promotion is not complete until the
  orphan report is clean.
- Never clean retained immutable release directories in place. The standard deploy helper freezes
  and promotes a new candidate so the previous active release remains the rollback reference.
- Do not publish through npm, GitHub Actions, Netlify, or repo-local scripts.
- `npm run publish`, `npm run publish:patch`, and `npm run deploy` must remain hard blockers.
- If bulk refresh is needed, update only the affected HTML pages rather than rebuilding an app shell.
