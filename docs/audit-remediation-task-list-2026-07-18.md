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

**Candidate status, 2026-07-18:** remediation is implemented and validated on
`codex/art-directory-audit-remediation-20260718`; the post-external-QA code and
artifact snapshot is `c19814549c00`. Production remains unchanged. Deployment
approval is recorded; release is held only for the fixed **2026-07-22** GSC
read.

## External Customer QA Baseline — 2026-07-18

The external anonymous customer test ran against the unchanged production
release, not the remediation candidate.

- Result: `FAIL`
- Release recommendation: `go_with_known_risk`
- Receipt: `qa_2b735425-23ea-4424-9149-df2a5b477445`
- Run: `f7a0c00d-204e-427e-a32b-5a3d2cfe56a3`
- Finalized: `2026-07-18T11:50:43.736Z`
- Durable report and evidence:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-18/f7a0c00d-204e-427e-a32b-5a3d2cfe56a3/`

The result independently confirmed the audit baseline. It did not invalidate
the candidate validation because production still serves
`20260715094034-e9c512451749`. It does establish the exact live failures that
the post-deploy canary must close:

| External finding | Candidate remediation | Required live proof |
| --- | --- | --- |
| 133 location links; 55 visible failures; duplicate Washington | ART-003, ART-009 | Menu has 5 canonical locations, Washington appears once, and every offered route resolves intentionally |
| Atlanta hydrates 16 under-review providers | ART-002 | Atlanta exposes no provider identity, cards, counts, ratings, reviews, contacts, or provider schema before or after hydration |
| Alicia E Weaver route publishes identity and `ProfessionalService` schema | ART-002, ART-007 | Suppressed provider-shaped routes disclose no provider-specific content or schema |
| Unsupported certification/review claims; missing methodology | DEC-02, ART-010, ART-011 | Homepage, city, profile, methodology, correction flow, and JSON-LD use one evidence-backed trust policy |
| Mobile menu and feedback keyboard failures | ART-006, ART-012 | Escape closes the menu; Tab/Shift+Tab expose visible focus; Enter selects feedback and reveals the comment workflow |
| Toledo and Atlantis have no zero-result state | ART-003, ART-006 | Unsupported searches show useful coverage feedback and recover when edited to Boston |
| Broken Boston favicon; profile lacks global shell/footer | ART-004, ART-008 | Boston uses an accessible fallback and its profile retains navigation, CTA, breadcrumb, and footer |
| Online handoff works but logs React hydration errors | ART-011 plus downstream follow-up | The $59 single-item handoff remains clear; first-party React errors are separately investigated in the owning app |

### External QA Release Tasks

#### P0 — Required before release

- [x] Preserve the submitted report, receipt, route results, observations, and
  screenshots in durable storage.
- [x] Map every external finding to its candidate remediation and live
  acceptance check.
- [ ] On or after **2026-07-22**, record the fixed Day-7 GSC read required by
  the recovery plan.
- [ ] Immediately before release, rerun the clean-checkout candidate gates and
  the focused browser checks for menu routes, suppressed inventory, trust
  claims, keyboard feedback, zero-result search, Boston imagery, and profile
  shell.
- [ ] Confirm the release snapshot contains only the reviewed 5-provider,
  5-city inventory and the expected 13 sitemap URLs.

#### P0 — Release and live verification

- [ ] Deploy only through the standard `art-appraisers-directory`
  static-release helper.
- [ ] Record the deployed source commit, immutable release ID, active pointer,
  asset/source hashes, health result, and rollback target.
- [ ] Verify initial HTML and hydrated DOM separately for Atlanta and a
  suppressed provider-shaped route.
- [ ] Verify all five location-menu routes, Boston search, unsupported search,
  mobile keyboard behavior, feedback state, image fallbacks, methodology,
  correction flow, shared profile shell, sitemap, feeds, and structured data.
- [ ] Run a fresh external customer QA ticket against the deployed release
  using the same journey and acceptance appendix.
- [ ] Compare the new result with receipt
  `qa_2b735425-23ea-4424-9149-df2a5b477445`; attach the new receipt and close
  each row above only with live evidence.

**Release blocker:** do not promote, or roll back, if any candidate page still
publishes suppressed provider identity after hydration, exposes a
directory-owned broken route, or retains the externally confirmed serious
trust/keyboard contradictions.

#### P1 — Residual and adjacent verification

- [x] Cover the external tester's `not_proven` states with an internal canary:
  exact HTTP statuses, failed first-party requests, safe geolocation
  success/denial, 200% zoom, and observable telemetry.
- [x] Route the `/start` React errors 418, 423, and 425 to the owning main-page
  workflow with the submitted handoff evidence; preserve the working $59
  single-item promise while investigating.
- [x] Preserve the externally validated strengths: clear hero, local/online/
  screener decision router, Boston sources and review date, accessible
  provider illustration, and the handoff's visible price and scope.

Internal canary evidence, 2026-07-18:

- Exact candidate nginx returned 200 for the homepage, five reviewed cities,
  five reviewed profiles, methodology, correction flow, `locations.json`,
  `appraisers.json`, `llms.txt`, the sitemap, and active assets; Atlanta and
  direct suppressed `index.html` paths returned 404.
- The generic Alicia E Weaver-shaped route returned a provider-neutral
  unavailable page. Initial HTML and hydrated DOM contained no Alicia identity,
  address, rating, review, contact data, or `ProfessionalService` schema.
- Browser network inspection found no failed candidate first-party request
  after the `/directory/assets/` nginx contract was corrected. All three
  decision-router illustrations returned 200.
- Geolocation denial was rendered in the browser; deterministic interaction
  coverage proves the Boston success path and both
  `search_geolocate_complete` / `search_geolocate_error` telemetry states.
- CDP page scale 2 at a 1280px viewport reported a 632.5px visual viewport and
  no document-level horizontal overflow. The 390px mobile viewport also had no
  horizontal overflow.
- The browser observed `search_no_results` in `dataLayer`, and the analytics
  control-plane request returned 202. Unit contracts cover feedback, search,
  and geolocation event payloads without sending synthetic feedback.
- Main-page follow-up:
  `main-page-2026-07-18-start-react-errors` in
  `/srv/repos/agent-memory/todos.md`.

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

- [x] Inventory all pre-existing dirty and untracked files; identify the three untracked build-chain dependencies by name and owner.
- [x] Separate the in-progress migration from unrelated changes without resetting or deleting user work.
- [x] Decide which migration files are canonical, which are generated, and which are obsolete.
- [x] Make a branch/commit or equivalent frozen candidate in which a fresh checkout can install dependencies and run every required validation gate.
- [x] Correct misleading script/docs behavior only after the canonical static-first workflow is confirmed.
- [x] Add a CI or local reproducibility check that fails if required build/validation files are untracked or missing.

**Acceptance:** a clean checkout at the chosen revision runs `npm ci`, lint, typecheck, and static validation without borrowing files from the dirty VPS tree.

### ART-002 — Enforce the provider quality gate in rendered content

**Depends on:** DEC-01, ART-001.

- [x] Make the provider publication manifest the single source of truth for all published inventory.
- [x] Remove the bundled-data hydration fallback that reintroduces suppressed providers.
- [x] Ensure suppressed providers are absent from:
  - initial static HTML;
  - hydrated DOM and client-side data;
  - shipped appraiser JSON/JavaScript payloads where practical;
  - city counts and cards;
  - appraiser and city hubs;
  - structured-data item lists;
  - XML sitemap and LLM/JSON feeds.
- [x] Add parity checks between the provider manifest, static HTML, hydrated client inventory, feeds, and sitemap.
- [x] Add a regression fixture for a suppressed city such as Atlanta and a reviewed/indexable city.
- [x] Fail validation if a suppressed provider becomes visible after hydration.

**Acceptance:** the manifest's approved counts—not hardcoded audit numbers—match every public and machine-readable surface before and after hydration; suppressed pages cannot show suppressed cards.

### ART-003 — Eliminate directory-navigation 404s and canonicalize cities

- [x] Build the Locations menu from routes that actually exist and are eligible for navigation, not all raw `cities.json` entries.
- [x] Reconcile the city registry, generated route inventory, `public_site/location/`, homepage regions, search, sitemap, and internal links.
- [x] Merge or explicitly alias the duplicate Washington records; choose one canonical slug and one coordinate record.
- [x] Remove or implement every currently dangling city route, including redirect-map destinations such as Toledo and Little Rock.
- [x] Add a link-contract check covering every header, footer, homepage, search, and city/profile breadcrumb destination.
- [x] Keep nginx's fail-closed `try_files ... =404` behavior unless a separate architecture decision changes the static-first contract.

**Acceptance:** every directory-owned navigation link resolves directly to an intentional 200 page or documented redirect; Washington appears once; no menu item depends on SPA fallback.

### ART-004 — Replace broken and placeholder images with intentional fallbacks

- [x] Treat empty URLs, known placeholder filenames, retired providers, and load failures as missing images.
- [x] Use the existing `InitialsAvatar` or one shared equivalent for missing appraiser photos.
- [x] Apply the same behavior to city grids, homepage Featured Art Appraisers, and any profile portrait.
- [x] Replace or remove the broken featured image and review whether each featured business/photo pairing is credible.
- [x] Delete the unused competing fallback component only after all callers use the chosen implementation.
- [x] Add static URL checks and rendered `onerror` tests for empty, placeholder, 404, and valid images.

**Acceptance:** representative desktop/mobile pages show no broken-image icon or gray placeholder wall; every missing image has an accessible, deterministic fallback.

### ART-005 — Remove leaked tracking data from public provider records

- [x] Identify the provider record containing the internal Yahoo source token.
- [x] Store and publish the canonical source URL without internal tracking parameters.
- [x] Search all provider data, static HTML, feeds, and shipped assets for source tokens, click IDs, and known internal tracking parameters.
- [x] Add URL sanitization/validation at the provider-data boundary.

**Acceptance:** the public artifact contains no internal source tracking token, while the intended external source link still works.

## P1 — Repair Functional, Schema, and Trust Defects

### ART-006 — Fix feedback and city-search interactions

- [x] Change `ContentFeedback` state so a vote can reveal and submit the optional comment form instead of replacing it.
- [x] Define explicit states for idle, voted/comment-open, submitting, success, and failure.
- [x] Make city search derive destinations from the canonical route registry.
- [x] Remove dead redirect-map targets or add their canonical routes.
- [x] Complete coordinates for eligible cities or disclose/fallback when location-based matching is incomplete.
- [x] Show a useful message when geolocation is unavailable, denied, or cannot find a covered city.
- [x] Add keyboard, mobile, and telemetry tests for both interactions.

**Acceptance:** feedback comments are reachable and submittable; city search never recommends a guaranteed 404; geolocation does not silently search only a partial dataset.

### ART-007 — Correct profile schema, empty states, and slug generation

- [x] Omit `aggregateRating` when no publishable rating/review evidence exists; never emit zero-value rating objects.
- [x] Omit or rewrite FAQ contact answers when phone/email values are absent.
- [x] Hide empty Business Hours and Certifications sections.
- [x] Use one canonical slug utility for routes, breadcrumbs, links, and canonicals; add a St. Louis regression test.
- [x] Audit all profile JSON-LD for empty strings, zero ratings, invalid URLs, and claims absent from visible content.
- [x] Validate representative JSON-LD with an automated schema contract and Google's rich-result tooling where applicable.

**Acceptance:** no profile displays an empty information box, malformed contact sentence, zero-rating schema, or inconsistent breadcrumb URL.

### ART-008 — Restore global navigation and footer on profile pages

- [x] Put all publicly delivered profile pages under the shared site shell without changing canonical reviewed-profile content.
- [x] Keep the primary CTA, top-level navigation, brand identity, and footer consistent with home/city pages.
- [x] Verify sticky/mobile behavior does not obscure profile content.
- [x] Add a route-shell contract test for homepage, city, profile, hub, and 404 page types.

**Acceptance:** all profile pages provide the same essential navigation and CTA access as the rest of the directory on desktop and mobile.

### ART-009 — Generate homepage regions from canonical city data

- [x] Replace the hardcoded state-to-region lists in `App.tsx` with a complete, testable mapping or data-driven grouping.
- [x] Include every eligible city/state; eligibility is derived from the reviewed location feed.
- [x] Define a visible fallback group for any future unmapped region instead of silently dropping it.
- [x] Reuse the canonical city slug and route-availability contract from ART-003.

**Acceptance:** every navigable city appears exactly once in the homepage region experience, and adding an unmapped city fails a test or lands in an explicit fallback.

### ART-010 — Align public trust claims with evidence

**Depends on:** DEC-02.

- [x] Reconcile homepage “Verified Reviews,” city-card ratings/review counts, profile disclosures, and rating schema.
- [x] Replace “certified art appraisers” wherever certification is not verified for every represented provider.
- [x] Create a methodology/trust page explaining:
  - how providers are sourced;
  - what “reviewed,” “verified,” or “under review” means;
  - how credentials and locations are checked;
  - how corrections are handled;
  - whether and how reviews are published.
- [x] Add a clear “Get listed / Correct a listing” path with ownership and moderation expectations.
- [x] Remove or rewrite the yellow templated-copy warning so internal quality-control language is not presented as unfinished public UI.

**Acceptance:** every public trust claim has a documented basis; ratings policy is consistent across copy, UI, and schema; users have a clear correction/listing path.

### ART-011 — Improve homepage and decision-router credibility

- [x] Replace generic or mismatched featured-provider imagery and synthetic-sounding presentation with reviewed provider facts or remove the section.
- [x] Add only evidence-backed hero proof points; do not invent counts, credentials, ratings, or review claims.
- [x] Give decision-router buttons action-oriented labels that do not repeat their card headings.
- [x] Verify the CTA destination and attribution behavior for every decision path.
- [x] Test the revised hierarchy and interactions on desktop and mobile.

**Acceptance:** the homepage explains the directory's value and trust model without unsupported claims, stock-photo mismatches, or duplicate-action labels.

## P2 — Design and Content Quality

### ART-012 — Establish an art-specific visual system

**Depends on:** DEC-03.

- [x] Define a compact visual direction suitable for a fine-art professional directory: typography, color, image treatment, spacing, cards, and trust cues.
- [x] Replace the generic blue SaaS starter treatment without reducing accessibility or contrast.
- [x] Unify the favicon, logo, and wordmark into one brand system.
- [x] Remove the duplicate logo lockup and prevent the mobile wordmark from wrapping into a three-line header.
- [x] Align `theme-color` with the approved primary color.
- [x] Apply the system consistently to home, city, profile, hub, search, and empty states.

**Acceptance:** the directory has one recognizable art-focused identity and passes responsive/contrast checks at supported breakpoints.

### ART-013 — Complete footer and metadata presentation cleanup

- [x] Remove the duplicate Terms of Service link.
- [x] Replace the hardcoded US-centroid geo position with accurate page-specific data or omit it.
- [x] Verify title, description, canonical, Open Graph, favicon, and theme metadata across page types.
- [x] Preserve the currently solid per-page title/description/canonical/OG behavior.

**Acceptance:** footer links are unique and valid; metadata is accurate, intentional, and free of fake location signals.

## P2 — Code, Asset, and Documentation Hygiene

### ART-014 — Add a real TypeScript gate and remove obsolete code

**Depends on:** ART-001.

- [x] Add `typecheck` and wire `tsc --noEmit` into the required validation sequence.
- [x] Resolve all 38 current TypeScript errors without weakening compiler settings or adding blanket suppressions.
- [x] Confirm routing before removing the dead legacy layer:
  - `src/pages/AppraiserPage.tsx`;
  - `src/pages/LocationPage.tsx`;
  - `src/utils/staticData.ts`;
  - obsolete `src/data/locations/` files;
  - unused `src/components/ui/FallbackImage.tsx`.
- [x] Remove dependencies only after import/runtime checks confirm they are unused: `axios`, `express`, and `chalk`.
- [x] Extend lint coverage to maintained `scripts/*.mjs` files.
- [x] Remove the unused Tailwind typography configuration or install/configure the plugin only if the product actually uses it.

**Acceptance:** lint, typecheck, and static validation pass with no dead routed layer and no unsupported lint/compiler exceptions.

### ART-015 — Fix or retire broken scripts and stale documentation

- [x] Repair or remove the corrupted `scripts/check-images.js` containing literal newline escapes.
- [x] Update `STANDARDIZED_BUILD.md` to describe only supported commands and the canonical static-first workflow.
- [x] Update `DATA_STANDARDIZATION.md` from stale hardcoded counts to generated/current inventory references.
- [x] Correct `CLAUDE.md` so `npm run build` is described as validation-only.
- [x] Reconcile the generic root `TODO.md` with this audited backlog; archive or replace stale tasks rather than maintaining two competing sources.
- [x] Document the manifest, route registry, provider publication contract, image fallback contract, and release validation gates.

**Acceptance:** every documented command exists and behaves as described; future maintainers have one authoritative remediation backlog.

### ART-016 — Remove repository and release-asset debris safely

- [x] Classify before deleting:
  - `proof-of-concept/`;
  - `.bolt/`;
  - `temp.html`, `location.html`, and `temp_output.txt`;
  - root report JSON files;
  - 23 `appraisers.json.backup-*` files;
  - duplicate `Dockerfile` / `Dockerfile.deploy`.
- [x] Preserve anything still required by the active migration or static validation.
- [x] Add generated reports, backups, and local scratch artifacts to `.gitignore` where appropriate.
- [x] Change promotion/retention logic so stale `index-*.js` bundles and duplicated city chunks do not accumulate in release assets.
- [x] Verify both `/assets/` and `/directory/assets/` URL contracts before removing duplicates.
- [x] Keep rollback-safe immutable releases; clean candidate output, not historical releases still covered by retention policy.

Candidate asset inventory after pruning: 13 reachable files, with 8 under
`/assets/` and 5 under `/directory/assets/`. `check:asset-references` fails on
any missing active dependency or retained orphan. Historical immutable release
directories were not modified.

**Acceptance:** the tracked repo contains no confirmed junk, candidate releases contain only referenced assets, and every retained asset is reachable or intentionally rollback-only.

## Work Order and Dependencies

1. [x] **Stabilize:** ART-000 and ART-001.
2. [x] **Decide:** DEC-01 and DEC-02; record DEC-03 before visual work.
3. [x] **Protect truth and navigation:** ART-002, ART-003, ART-005.
4. [x] **Repair visible breakage:** ART-004, ART-006, ART-007, ART-008, ART-009.
5. [x] **Align marketing and trust:** ART-010 and ART-011.
6. [x] **Improve presentation:** ART-012 and ART-013.
7. [x] **Reduce maintenance risk:** ART-014, ART-015, ART-016.
8. [ ] **Release only after all applicable validation and approval gates pass.**

ART-002 and ART-003 should land before broad styling work because they determine which providers and cities the UI is allowed to expose. ART-014/016 cleanup must follow the reproducible-baseline checkpoint so migration dependencies are not deleted as “junk.”

## Validation Matrix

### Repository and static contracts

- [x] Fresh-checkout `npm ci`.
- [x] `npm run lint`.
- [x] `npm run typecheck`.
- [x] `npm run build` / `npm run check:static`.
- [x] Provider publication parity check.
- [x] Route/link contract across header, footer, regions, search, cards, breadcrumbs, sitemap, and feeds.
- [x] Image URL and rendered fallback tests.
- [x] Structured-data and empty-field checks.
- [x] Asset-reference/orphan report for both asset prefixes.
- [x] `node /srv/repos/env-governance/check-all.mjs` only if env or runtime configuration changes.

The workspace-wide environment check passed the art frontend and
`art-appraisers-directory` service schemas. It also reported unrelated stale
temporary main-page/CRM schema directories; those are outside this repo's
candidate diff.

### Rendered browser checks

- [x] Desktop and mobile homepage.
- [x] Reviewed/indexable city and profile.
- [x] Suppressed/noindex city and profile, proving inventory does not reappear after hydration.
- [x] City with missing/placeholder images.
- [x] Locations menu, homepage regions, text city search, and geolocation states.
- [x] Feedback vote, comment, submit, success, and error states.
- [x] Profile global shell, empty-contact profile, and St. Louis breadcrumb.
- [x] 404 behavior for an unknown city.
- [x] Console, network, accessibility, layout, and telemetry checks.

### Pre-release gate

- [x] Reconcile the candidate against the July 15 GSC recovery measurement window.
- [x] Review the exact candidate diff and exclude unrelated dirty work.
- [x] Record expected provider, city, sitemap, menu, and asset counts.
- [x] Capture before/after screenshots and machine-readable validation logs.

Expected candidate counts: 5 providers, 5 cities, 13 sitemap URLs, 5 menu
locations, and 13 retained public assets. Evidence is stored in
`/srv/manager/reports/art-appraisers-directory-audit-20260718/`.

GSC reconciliation: the recovery plan freezes the same 13-URL cohort until its
date-gated Day-7 read on **2026-07-22**. This candidate preserves those counts
but materially changes delivered HTML, hydration, and assets, so it remains
pre-release until that read is recorded. No early substitute read or GSC
mutation was performed.

Approval and release decision, 2026-07-18: the user explicitly authorized
deployment if needed and delegated the timing decision. A standard-helper
dry-run proved the candidate is not live (`76b988…` source hash versus
`e9c512…` active hash); production remains on
`20260715094034-e9c512451749`. Because the service is stable and the candidate
is a material treatment change rather than an emergency availability repair,
deployment is intentionally deferred until the July 22 read.

- [x] Obtain explicit deployment approval.
- [ ] Deploy only through the standard `art-appraisers-directory` static-release helper.
- [ ] Verify active release pointer, nginx health, Cloudflare delivery, live HTML, hydration behavior, and rollback reference.
- [ ] Rerun the live HTTP and browser matrix after release.

## Completion Criteria

- [x] A clean checkout can reproduce all required gates.
- [x] One publication policy controls visible HTML, hydration, client payloads, hubs, feeds, schema, and sitemap.
- [x] No directory-owned navigation link 404s.
- [x] No broken or placeholder image is presented as a provider photo.
- [x] No internal tracking token appears in public data or assets.
- [x] Feedback, search, and geolocation have complete and visible interaction states.
- [x] Profile schema and UI omit empty/unsupported claims and use canonical slugs.
- [x] Every page type includes the shared navigation/CTA/footer shell.
- [x] Ratings, certification, verification, and methodology claims are evidence-backed and consistent.
- [x] Every eligible city is represented exactly once.
- [x] TypeScript, lint, static, link, image, schema, and browser gates pass.
- [x] Repository/docs/assets are cleaned only after the migration baseline is reproducible.
- [x] A reviewed immutable release is deployed through the standard helper and verified live, or the backlog remains explicitly pre-release.

Pre-release state: clean detached checkout `c19814549c00` passed `npm ci`,
lint, typecheck, interaction tests, the full static gate, and validation of all
944 HTML files. Production remains on the prior immutable release pending the
July 22 GSC read.

## Evidence and Related Work

- Audit screenshots (volatile until ART-000): `/tmp/art-shots/`
- External customer QA submission:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-18/f7a0c00d-204e-427e-a32b-5a3d2cfe56a3/`
- Existing GSC recovery plan: `/srv/manager/plans/art-appraisers-directory-gsc-recovery-task-list-2026-07-15.md`
- GSC release evidence: `/srv/manager/seo/art-directory-recovery/2026-07-15-execution/`
- Post-external-QA candidate screenshots:
  `/srv/manager/reports/art-appraisers-directory-audit-20260718/post-external-predeploy/`
- Candidate commits: frontend `c19814549c00`, runtime nginx `fbf04aa`, and
  shared static-preview regression `7980ffc`.
- Repo workflow guardrails: `/srv/repos/frontends/art-appraiser-directory-frontend/docs/operational-guardrails.md`
- Canonical static artifact: `/srv/repos/frontends/art-appraiser-directory-frontend/public_site/`
- Provider publication manifest: `/srv/repos/frontends/art-appraiser-directory-frontend/data/provider-publication-manifest.json`
