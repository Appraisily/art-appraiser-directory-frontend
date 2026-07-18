# Art Appraisers Directory Audit Remediation Task List

**Prepared:** 2026-07-18  
**Audit target:** live release `20260715094034` and `/srv/repos/frontends/art-appraiser-directory-frontend`  
**Primary outcome:** make the directory's visible inventory, navigation, trust claims, static artifacts, and indexing policy internally consistent and reproducible.  
**Status legend:** `[ ]` open, `[x]` complete, `[!]` decision or approval required.

## Baseline and Constraints

- The live nginx release predates the repo's current migration.
- The current repo has approximately 326 uncommitted files (`+4,824/-23,738`) and three untracked files required by the build chain.
- `npm run lint` and `npm run build` pass only in that dirty tree. A clean checkout cannot currently run the gates.
- `public_site/` is the canonical published artifact. Do not restore a Vite/SPA regeneration step as the normal production workflow.
- Do not mass-edit profile or city HTML through repo scripts. Individual `public_site/appraiser/**` and `public_site/location/**` content changes require direct, reviewed edits.
- This task list does not authorize a build, deployment, GSC mutation, or destructive cleanup.
- Preserve the fixed GSC recovery cohort. The July 15 recovery plan says no production content or URL changes before the Day-7 read on **2026-07-22**. Coordinate any release with `/srv/manager/plans/art-appraisers-directory-gsc-recovery-task-list-2026-07-15.md`.
- Preserve unrelated dirty work. Do not pull, reset, or discard files on this VPS.

## Required Decisions

### DEC-01 — Provider publication policy (P0)

- [x] Choose one policy and record the decision:
  - **Recommended:** enforce the existing reviewed-provider manifest in all visible and machine-readable surfaces.
  - Alternative: retire the suppression policy and intentionally republish the wider inventory after a separate trust review.
- [x] Do not retain the current hybrid state in which robots metadata suppresses providers while hydrated pages render them.
- [x] Record the approved source of truth, expected provider/city counts, and which surfaces it controls.

**Decision recorded 2026-07-18:** enforce the reviewed-provider manifest. The
current expected published inventory is 5 verified providers and 5 reviewed
cities; the manifest controls HTML visibility, hydration, hubs, feeds,
structured lists, and sitemap membership. Counts must remain derived from the
manifest rather than hardcoded.

**Decision gate:** no provider-inventory implementation or release until this is explicit.

### DEC-02 — Public ratings and reviews policy (P0)

- [x] Choose one site-wide policy for ratings and reviews.
- [x] Until authentic, publishable review evidence and methodology exist, use the conservative policy:
  - remove numeric ratings and review counts from cards and structured data;
  - remove the “Verified Reviews” claim;
  - state plainly that ratings are not published, where that disclosure is useful.
- [x] If ratings will remain, document provenance, verification, moderation, freshness, and profile-level publication rules before restoring them.

**Decision recorded 2026-07-18:** numeric ratings and review counts will not be
published. They may return only after a separately reviewed provenance and
moderation policy exists.

**Decision gate:** no ratings copy/schema release until cards, profiles, homepage claims, and JSON-LD agree.

### DEC-03 — Visual identity scope (P2)

- [x] Decide whether the design work is a focused credibility refresh or a full art-directory redesign.
- [x] Preserve the appraisal funnel, pricing, and paid landing-page behavior unless separately approved.

**Decision recorded 2026-07-18:** use a focused credibility refresh with a
light editorial, quietly authoritative art-directory identity. Preserve the
existing appraisal funnel, pricing, and paid landing-page behavior.

## P0 — Stop Shipping Contradictory or Broken Directory State

### ART-000 — Preserve audit and release evidence

- [x] Copy the rendered audit screenshots from `/tmp/art-shots/` into a dated, durable evidence directory before `/tmp` is cleared.
- [x] Record the live release ID, active release path, relevant source commit, sitemap URL count, publication-manifest counts, and rollback reference.
- [x] Save representative delivered HTML and asset hashes for:
  - [x] homepage;
  - [x] one reviewed/indexable city;
  - [x] one suppressed/noindex city such as Atlanta;
  - [x] one reviewed profile;
  - [x] one suppressed profile.

Evidence: `/srv/manager/reports/art-appraisers-directory-audit-20260718/`.

**Acceptance:** the audit can be reproduced without relying on mutable `/tmp` files or the active container.

### ART-001 — Restore a reproducible repository baseline

- [ ] Inventory all pre-existing dirty and untracked files; identify the three untracked build-chain dependencies by name and owner.
- [ ] Separate the in-progress migration from unrelated changes without resetting or deleting user work.
- [ ] Decide which migration files are canonical, which are generated, and which are obsolete.
- [ ] Make a branch/commit or equivalent frozen candidate in which a fresh checkout can install dependencies and run every required validation gate.
- [ ] Correct misleading script/docs behavior only after the canonical static-first workflow is confirmed.
- [ ] Add a CI or local reproducibility check that fails if required build/validation files are untracked or missing.

**Acceptance:** a clean checkout at the chosen revision runs `npm ci`, lint, typecheck, and static validation without borrowing files from the dirty VPS tree.

### ART-002 — Enforce the provider quality gate in rendered content

**Depends on:** DEC-01, ART-001.

- [ ] Make the provider publication manifest the single source of truth for all published inventory.
- [ ] Remove the bundled-data hydration fallback that reintroduces suppressed providers.
- [ ] Ensure suppressed providers are absent from:
  - initial static HTML;
  - hydrated DOM and client-side data;
  - shipped appraiser JSON/JavaScript payloads where practical;
  - city counts and cards;
  - appraiser and city hubs;
  - structured-data item lists;
  - XML sitemap and LLM/JSON feeds.
- [ ] Add parity checks between the provider manifest, static HTML, hydrated client inventory, feeds, and sitemap.
- [ ] Add a regression fixture for a suppressed city such as Atlanta and a reviewed/indexable city.
- [ ] Fail validation if a suppressed provider becomes visible after hydration.

**Acceptance:** the manifest's approved counts—not hardcoded audit numbers—match every public and machine-readable surface before and after hydration; suppressed pages cannot show suppressed cards.

### ART-003 — Eliminate directory-navigation 404s and canonicalize cities

- [ ] Build the Locations menu from routes that actually exist and are eligible for navigation, not all raw `cities.json` entries.
- [ ] Reconcile the city registry, generated route inventory, `public_site/location/`, homepage regions, search, sitemap, and internal links.
- [ ] Merge or explicitly alias the duplicate Washington records; choose one canonical slug and one coordinate record.
- [ ] Remove or implement every currently dangling city route, including redirect-map destinations such as Toledo and Little Rock.
- [ ] Add a link-contract check covering every header, footer, homepage, search, and city/profile breadcrumb destination.
- [ ] Keep nginx's fail-closed `try_files ... =404` behavior unless a separate architecture decision changes the static-first contract.

**Acceptance:** every directory-owned navigation link resolves directly to an intentional 200 page or documented redirect; Washington appears once; no menu item depends on SPA fallback.

### ART-004 — Replace broken and placeholder images with intentional fallbacks

- [ ] Treat empty URLs, known placeholder filenames, retired providers, and load failures as missing images.
- [ ] Use the existing `InitialsAvatar` or one shared equivalent for missing appraiser photos.
- [ ] Apply the same behavior to city grids, homepage Featured Art Appraisers, and any profile portrait.
- [ ] Replace or remove the broken featured image and review whether each featured business/photo pairing is credible.
- [ ] Delete the unused competing fallback component only after all callers use the chosen implementation.
- [ ] Add static URL checks and rendered `onerror` tests for empty, placeholder, 404, and valid images.

**Acceptance:** representative desktop/mobile pages show no broken-image icon or gray placeholder wall; every missing image has an accessible, deterministic fallback.

### ART-005 — Remove leaked tracking data from public provider records

- [ ] Identify the provider record containing `?y_source=1_MTYw...`.
- [ ] Store and publish the canonical source URL without internal tracking parameters.
- [ ] Search all provider data, static HTML, feeds, and shipped assets for `y_source`, click IDs, and known internal tracking parameters.
- [ ] Add URL sanitization/validation at the provider-data boundary.

**Acceptance:** the public artifact contains no internal source tracking token, while the intended external source link still works.

## P1 — Repair Functional, Schema, and Trust Defects

### ART-006 — Fix feedback and city-search interactions

- [ ] Change `ContentFeedback` state so a vote can reveal and submit the optional comment form instead of replacing it.
- [ ] Define explicit states for idle, voted/comment-open, submitting, success, and failure.
- [ ] Make city search derive destinations from the canonical route registry.
- [ ] Remove dead redirect-map targets or add their canonical routes.
- [ ] Complete coordinates for eligible cities or disclose/fallback when location-based matching is incomplete.
- [ ] Show a useful message when geolocation is unavailable, denied, or cannot find a covered city.
- [ ] Add keyboard, mobile, and telemetry tests for both interactions.

**Acceptance:** feedback comments are reachable and submittable; city search never recommends a guaranteed 404; geolocation does not silently search only a partial dataset.

### ART-007 — Correct profile schema, empty states, and slug generation

- [ ] Omit `aggregateRating` when no publishable rating/review evidence exists; never emit zero-value rating objects.
- [ ] Omit or rewrite FAQ contact answers when phone/email values are absent.
- [ ] Hide empty Business Hours and Certifications sections.
- [ ] Use one canonical slug utility for routes, breadcrumbs, links, and canonicals; add a St. Louis regression test.
- [ ] Audit all profile JSON-LD for empty strings, zero ratings, invalid URLs, and claims absent from visible content.
- [ ] Validate representative JSON-LD with an automated schema contract and Google's rich-result tooling where applicable.

**Acceptance:** no profile displays an empty information box, malformed contact sentence, zero-rating schema, or inconsistent breadcrumb URL.

### ART-008 — Restore global navigation and footer on profile pages

- [ ] Put all profile pages under the shared site shell without changing canonical profile content.
- [ ] Keep the primary CTA, top-level navigation, brand identity, and footer consistent with home/city pages.
- [ ] Verify sticky/mobile behavior does not obscure profile content.
- [ ] Add a route-shell contract test for homepage, city, profile, hub, and 404 page types.

**Acceptance:** all profile pages provide the same essential navigation and CTA access as the rest of the directory on desktop and mobile.

### ART-009 — Generate homepage regions from canonical city data

- [ ] Replace the hardcoded state-to-region lists in `App.tsx` with a complete, testable mapping or data-driven grouping.
- [ ] Include every eligible city/state, including currently omitted MD, LA, AL, IA, ND, HI, and DC records.
- [ ] Define a visible fallback group for any future unmapped region instead of silently dropping it.
- [ ] Reuse the canonical city slug and route-availability contract from ART-003.

**Acceptance:** every navigable city appears exactly once in the homepage region experience, and adding an unmapped city fails a test or lands in an explicit fallback.

### ART-010 — Align public trust claims with evidence

**Depends on:** DEC-02.

- [ ] Reconcile homepage “Verified Reviews,” city-card ratings/review counts, profile disclosures, and rating schema.
- [ ] Replace “certified art appraisers” wherever certification is not verified for every represented provider.
- [ ] Create a methodology/trust page explaining:
  - how providers are sourced;
  - what “reviewed,” “verified,” or “under review” means;
  - how credentials and locations are checked;
  - how corrections are handled;
  - whether and how reviews are published.
- [ ] Add a clear “Get listed / Correct a listing” path with ownership and moderation expectations.
- [ ] Remove or rewrite the yellow templated-copy warning so internal quality-control language is not presented as unfinished public UI.

**Acceptance:** every public trust claim has a documented basis; ratings policy is consistent across copy, UI, and schema; users have a clear correction/listing path.

### ART-011 — Improve homepage and decision-router credibility

- [ ] Replace generic or mismatched featured-provider imagery and synthetic-sounding presentation with reviewed provider facts or remove the section.
- [ ] Add only evidence-backed hero proof points; do not invent counts, credentials, ratings, or review claims.
- [ ] Give decision-router buttons action-oriented labels that do not repeat their card headings.
- [ ] Verify the CTA destination and attribution behavior for every decision path.
- [ ] Test the revised hierarchy and interactions on desktop and mobile.

**Acceptance:** the homepage explains the directory's value and trust model without unsupported claims, stock-photo mismatches, or duplicate-action labels.

## P2 — Design and Content Quality

### ART-012 — Establish an art-specific visual system

**Depends on:** DEC-03.

- [ ] Define a compact visual direction suitable for a fine-art professional directory: typography, color, image treatment, spacing, cards, and trust cues.
- [ ] Replace the generic blue SaaS starter treatment without reducing accessibility or contrast.
- [ ] Unify the favicon, logo, and wordmark into one brand system.
- [ ] Remove the duplicate logo lockup and prevent the mobile wordmark from wrapping into a three-line header.
- [ ] Align `theme-color` with the approved primary color.
- [ ] Apply the system consistently to home, city, profile, hub, search, and empty states.

**Acceptance:** the directory has one recognizable art-focused identity and passes responsive/contrast checks at supported breakpoints.

### ART-013 — Complete footer and metadata presentation cleanup

- [ ] Remove the duplicate Terms of Service link.
- [ ] Replace the hardcoded US-centroid geo position with accurate page-specific data or omit it.
- [ ] Verify title, description, canonical, Open Graph, favicon, and theme metadata across page types.
- [ ] Preserve the currently solid per-page title/description/canonical/OG behavior.

**Acceptance:** footer links are unique and valid; metadata is accurate, intentional, and free of fake location signals.

## P2 — Code, Asset, and Documentation Hygiene

### ART-014 — Add a real TypeScript gate and remove obsolete code

**Depends on:** ART-001.

- [ ] Add `typecheck` and wire `tsc --noEmit` into the required validation sequence.
- [ ] Resolve all 38 current TypeScript errors without weakening compiler settings or adding blanket suppressions.
- [ ] Confirm routing before removing the dead legacy layer:
  - `src/pages/AppraiserPage.tsx`;
  - `src/pages/LocationPage.tsx`;
  - `src/utils/staticData.ts`;
  - obsolete `src/data/locations/` files;
  - unused `src/components/ui/FallbackImage.tsx`.
- [ ] Remove dependencies only after import/runtime checks confirm they are unused: `axios`, `express`, and `chalk`.
- [ ] Extend lint coverage to maintained `scripts/*.mjs` files.
- [ ] Remove the unused Tailwind typography configuration or install/configure the plugin only if the product actually uses it.

**Acceptance:** lint, typecheck, and static validation pass with no dead routed layer and no unsupported lint/compiler exceptions.

### ART-015 — Fix or retire broken scripts and stale documentation

- [ ] Repair or remove the corrupted `scripts/check-images.js` containing literal newline escapes.
- [ ] Update `STANDARDIZED_BUILD.md` to describe only supported commands and the canonical static-first workflow.
- [ ] Update `DATA_STANDARDIZATION.md` from stale hardcoded counts to generated/current inventory references.
- [ ] Correct `CLAUDE.md` so `npm run build` is described as validation-only.
- [ ] Reconcile the generic root `TODO.md` with this audited backlog; archive or replace stale tasks rather than maintaining two competing sources.
- [ ] Document the manifest, route registry, provider publication contract, image fallback contract, and release validation gates.

**Acceptance:** every documented command exists and behaves as described; future maintainers have one authoritative remediation backlog.

### ART-016 — Remove repository and release-asset debris safely

- [ ] Classify before deleting:
  - `proof-of-concept/`;
  - `.bolt/`;
  - `temp.html`, `location.html`, and `temp_output.txt`;
  - root report JSON files;
  - 23 `appraisers.json.backup-*` files;
  - duplicate `Dockerfile` / `Dockerfile.deploy`.
- [ ] Preserve anything still required by the active migration or static validation.
- [ ] Add generated reports, backups, and local scratch artifacts to `.gitignore` where appropriate.
- [ ] Change promotion/retention logic so stale `index-*.js` bundles and duplicated city chunks do not accumulate in release assets.
- [ ] Verify both `/assets/` and `/directory/assets/` URL contracts before removing duplicates.
- [ ] Keep rollback-safe immutable releases; clean candidate output, not historical releases still covered by retention policy.

**Acceptance:** the tracked repo contains no confirmed junk, candidate releases contain only referenced assets, and every retained asset is reachable or intentionally rollback-only.

## Work Order and Dependencies

1. [ ] **Stabilize:** ART-000 and ART-001.
2. [ ] **Decide:** DEC-01 and DEC-02; record DEC-03 before visual work.
3. [ ] **Protect truth and navigation:** ART-002, ART-003, ART-005.
4. [ ] **Repair visible breakage:** ART-004, ART-006, ART-007, ART-008, ART-009.
5. [ ] **Align marketing and trust:** ART-010 and ART-011.
6. [ ] **Improve presentation:** ART-012 and ART-013.
7. [ ] **Reduce maintenance risk:** ART-014, ART-015, ART-016.
8. [ ] **Release only after all applicable validation and approval gates pass.**

ART-002 and ART-003 should land before broad styling work because they determine which providers and cities the UI is allowed to expose. ART-014/016 cleanup must follow the reproducible-baseline checkpoint so migration dependencies are not deleted as “junk.”

## Validation Matrix

### Repository and static contracts

- [ ] Fresh-checkout `npm ci`.
- [ ] `npm run lint`.
- [ ] `npm run typecheck`.
- [ ] `npm run build` / `npm run check:static`.
- [ ] Provider publication parity check.
- [ ] Route/link contract across header, footer, regions, search, cards, breadcrumbs, sitemap, and feeds.
- [ ] Image URL and rendered fallback tests.
- [ ] Structured-data and empty-field checks.
- [ ] Asset-reference/orphan report for both asset prefixes.
- [ ] `node /srv/repos/env-governance/check-all.mjs` only if env or runtime configuration changes.

### Rendered browser checks

- [ ] Desktop and mobile homepage.
- [ ] Reviewed/indexable city and profile.
- [ ] Suppressed/noindex city and profile, proving inventory does not reappear after hydration.
- [ ] City with missing/placeholder images.
- [ ] Locations menu, homepage regions, text city search, and geolocation states.
- [ ] Feedback vote, comment, submit, success, and error states.
- [ ] Profile global shell, empty-contact profile, and St. Louis breadcrumb.
- [ ] 404 behavior for an unknown city.
- [ ] Console, network, accessibility, layout, and telemetry checks.

### Pre-release gate

- [ ] Reconcile the candidate against the July 15 GSC recovery measurement window.
- [ ] Review the exact candidate diff and exclude unrelated dirty work.
- [ ] Record expected provider, city, sitemap, menu, and asset counts.
- [ ] Capture before/after screenshots and machine-readable validation logs.
- [ ] Obtain explicit deployment approval.
- [ ] Deploy only through the standard `art-appraisers-directory` static-release helper.
- [ ] Verify active release pointer, nginx health, Cloudflare delivery, live HTML, hydration behavior, and rollback reference.
- [ ] Rerun the live HTTP and browser matrix after release.

## Completion Criteria

- [ ] A clean checkout can reproduce all required gates.
- [ ] One publication policy controls visible HTML, hydration, client payloads, hubs, feeds, schema, and sitemap.
- [ ] No directory-owned navigation link 404s.
- [ ] No broken or placeholder image is presented as a provider photo.
- [ ] No internal tracking token appears in public data or assets.
- [ ] Feedback, search, and geolocation have complete and visible interaction states.
- [ ] Profile schema and UI omit empty/unsupported claims and use canonical slugs.
- [ ] Every page type includes the shared navigation/CTA/footer shell.
- [ ] Ratings, certification, verification, and methodology claims are evidence-backed and consistent.
- [ ] Every eligible city is represented exactly once.
- [ ] TypeScript, lint, static, link, image, schema, and browser gates pass.
- [ ] Repository/docs/assets are cleaned only after the migration baseline is reproducible.
- [ ] A reviewed immutable release is deployed through the standard helper and verified live, or the backlog remains explicitly pre-release.

## Evidence and Related Work

- Audit screenshots (volatile until ART-000): `/tmp/art-shots/`
- Existing GSC recovery plan: `/srv/manager/plans/art-appraisers-directory-gsc-recovery-task-list-2026-07-15.md`
- GSC release evidence: `/srv/manager/seo/art-directory-recovery/2026-07-15-execution/`
- Repo workflow guardrails: `/srv/repos/frontends/art-appraiser-directory-frontend/docs/operational-guardrails.md`
- Canonical static artifact: `/srv/repos/frontends/art-appraiser-directory-frontend/public_site/`
- Provider publication manifest: `/srv/repos/frontends/art-appraiser-directory-frontend/data/provider-publication-manifest.json`
