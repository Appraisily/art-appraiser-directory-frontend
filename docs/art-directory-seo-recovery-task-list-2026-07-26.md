# Art Appraisers Directory SEO Recovery Task List

**Prepared:** 2026-07-26  
**Canonical plan:** this file  
**Target:** `https://art-appraisers-directory.appraisily.com/`  
**Current production release:** `20260726223104-8f2c57469025`  
**Status legend:** `[ ]` open, `[x]` implemented/complete, `[~]` implemented
but awaiting a live or elapsed-time gate, `[!]` decision or approval required

## Implementation status — 2026-07-26

All safe source, documentation, test, registry, historical-ledger, measurement
tooling, and frozen-candidate work in this plan has been implemented.

- Art candidate: 8 reviewed URLs, 5 providers, 0 city shells.
- Historical ledger: all 397 unique historical URLs assigned a tested terminal
  class.
- Articles candidate: 3,198 hash-bound remediations from the active immutable
  release; all retained Art links pass the shared registry.
- Antique and main-page source candidates pass their applicable static,
  cross-host, type, and registry gates.
- Search Console tooling is manifest- and release-bound and rejects partial
  evaluation as a negative verdict.
- The deploy helper now performs the manifest-driven route, cache, alias,
  rollback, and no-JavaScript navigation gates.

Production deployment is complete and verified across Articles, Antique, Art,
and the scoped main-page candidate. Search Console mutation still requires
separate explicit approval. Dated observation and contingent consolidation
tasks remain honestly open. Full evidence is in
`docs/art-directory-seo-recovery-implementation-receipt-2026-07-26.md`.

The new immutable observation boundary is `2026-07-26T22:55:08Z`, with Day 7,
Day 14, and Day 28 on 2026-08-02, 2026-08-09, and 2026-08-23. Its manifest is
`/srv/manager/seo/art-directory-recovery/2026-07-26-remediation-release/experiment-manifest.json`.

The requested post-implementation Claude second look is complete. It found no
release blocker. Four independently accepted low-severity rerun hardening
items are recorded in repository-root `TASKS.md`; full candidate dispositions
are in repository-root `AUDIT.md`. None invalidates the frozen candidates.

## Objective

Give Google one bounded, internally consistent, useful Art-appraiser surface to
evaluate. Recover at least one indexed URL or the first nonzero impression day,
or stop investing in the standalone subdomain and consolidate it into a
stronger Appraisily surface.

This plan does not promise indexation. It separates:

- confirmed crawl and routing defects;
- content-quality hypotheses that require human/source evidence;
- deployment and GSC mutations that require explicit approval;
- dated measurement gates;
- the consolidation decision if the subdomain remains rejected.

## Confirmed baseline

Fresh Search Console and live verification on 2026-07-26 established:

- Exact URL-prefix and `sc-domain:appraisily.com` properties are accessible.
- The trailing 90-day Art-property export has:
  - 0 rows;
  - 0 impressions;
  - 0 clicks.
- The current sitemap contains 13 URLs:
  - 9 `Crawled - currently not indexed`;
  - 4 `Discovered - currently not indexed`;
  - 0 indexed.
- Every crawled URL reports `INDEXING_ALLOWED`.
- Google selected the expected self-canonical for every crawled URL.
- The sitemap has 13 submitted, 0 indexed, 0 errors, and 0 warnings.
- The sitemap was last downloaded on 2026-07-23.
- The fixed requested cohort was last crawled on 2026-07-16, so Google has not
  evaluated the 2026-07-25 production release.
- Current visible content:
  - homepage: 63 words;
  - Appraiser hub: 67 words;
  - Location hub: 69 words;
  - profiles: 164–200 words;
  - city pages: 54–57 words, each with one provider and near-identical copy.
- Active cross-host documents contain at least 163 links to retired Art city
  routes that now return `404`:
  - 43 occurrences from 15 article files;
  - 120 occurrences from 60 Antique-directory files.
- Googlebot followed the retired `/location/atlanta/` route on 2026-07-26.
- Any arbitrary `/appraiser/<slug>/` returns `200` with a generic
  `noindex, nofollow` page and canonical to `/appraiser/`.
- All 12 configured provider-alias `301` redirects terminate on unpublished
  target slugs that return the same `200 noindex` page.
- The ten exact-match reviewed city/profile routes return no Cache-Control
  headers, while the homepage and hubs return the intended no-store set.
- The article corpus contains 4,703 links to the Art host from 3,211 files;
  4,612 point to the Art homepage.
- The Antique directory produced 2,986 impressions and 233 clicks over the
  same 90-day period. Art-appraisal queries contributed 737 impressions and
  48 clicks there.

The baseline rules out a missing GSC property, robots block, sitemap failure,
or canonical-host error as the primary cause. Google has evaluated earlier
Art-directory HTML and chosen not to index it.

## Guardrails

- [x] Do not expand the Art sitemap or publish new city/provider pages while
  the current trusted cohort remains unindexed.
- [x] Do not fabricate provider facts, local coverage, credentials,
  specialties, service areas, review evidence, or city guidance.
- [x] Do not use word count as an acceptance metric. Content must add verified
  decision value; filler is a failure.
- [x] Do not restore the historical 397- or 241-URL inventory.
- [x] Do not create a new standalone SEO site as a workaround.
- [x] Keep `public_site/` as the canonical Art-directory release artifact.
- [x] Do not mass-edit Art profile/city HTML through an unreviewed script.
- [x] Preserve unrelated work in all dirty/shared repositories.
- [x] Do not deploy, submit/resubmit a sitemap, request indexing, or publish
  redirects without explicit approval.
- [x] Use the standard static-release helper for the Art and Antique
  directories and the manifest-bound immutable article flow for article
  changes.
- [x] Preserve the July measurement history. If a release occurs before a
  scheduled read, record the contamination and start a new observation
  boundary rather than claiming a clean result.

## Consultation disposition

Claude Code reviewed a sanitized snapshot using read-only `Read`, `Glob`, and
`Grep` access. Codex independently verified every candidate.

Accepted into this plan:

| Finding | Disposition | Workstream |
| --- | --- | --- |
| Arbitrary provider slugs return `200 noindex` | Accepted, high | SEO-001 |
| Reviewed routes lack cache directives | Accepted, medium | SEO-005 |
| Twelve aliases terminate on soft-unavailable targets | Accepted, medium | SEO-002 |
| QA brief still permits suppressed-provider `200` | Accepted, low | SEO-001 |
| Mobile static shell hides primary navigation | Accepted, low | SEO-009 |
| Fixed `/tmp` audit report path is collision-prone | Accepted, low | SEO-016 |

Exploratory Claude candidates not promoted:

- “Open to the Public” is not a malformed scraped name. The prior source audit
  confirmed it is a real Los Angeles firm at `opentothepublic.art`.
- Slash canonicalization does not drop query strings in production; Traefik
  returns `308` and preserves them. Broken legacy provider aliases are covered
  separately by SEO-002.
- The current external logo asset returns `200`; moving it to a stable
  production namespace is not part of the indexation-critical path.
- Security-header ownership is an operational hardening question, not evidence
  for the zero-indexation diagnosis.

Pre-implementation consultation artifacts:

- `docs/audits/2026-07-26-preimplementation/AUDIT.md`
- `docs/audits/2026-07-26-preimplementation/TASKS.md`

Three parallel Codex specialist reviews then challenged this plan against the
live implementation:

- technical crawl, Nginx, static-release, rollback, and smoke contracts;
- Articles/Antique/main-page cross-host link generation and release mechanics;
- content utility, historical URL handling, GSC measurement, and consolidation.

Their accepted additions are incorporated below. The highest-risk correction
is measurement: the existing checkpoint runner is fixed to the July 15 cohort
and can currently call the directory evaluated after only one post-release
crawl. It must not be used to judge a new release until SEO-013A is complete.

## Execution order

| Wave | Required work | Can run in parallel |
| --- | --- | --- |
| 0 — preserve | SEO-000 | SEO-009, SEO-016 |
| 1 — crawl truth | SEO-001, SEO-002A, SEO-002, SEO-003A, SEO-003, SEO-005 | Evidence gathering for DEC-SEO-01 and DEC-SEO-02 |
| 2 — architecture | DEC-SEO-01, DEC-SEO-02 | SEO-004 generator design |
| 3 — build | SEO-006, SEO-006A, SEO-007, SEO-008, SEO-010 | Cross-host candidates from SEO-003/SEO-004 |
| 4 — freeze | SEO-001A, SEO-011, SEO-011A, SEO-011B | Per-surface candidate validation |
| 5 — release | SEO-012 | None across a shared promotion boundary |
| 6 — observe | SEO-013A, then SEO-013, SEO-014/SEO-014A | Read-only historic July checkpoint may proceed |
| 7 — decide | SEO-015, then DEC-SEO-03 if triggered | None |
| 8 — consolidate if approved | SEO-017, SEO-018, SEO-019 | Only explicitly independent validation |

## Phase 0 — Preserve the experiment and inventories

### [x] SEO-000 Freeze a reproducible pre-change baseline

Work:

- Archive the 2026-07-26 GSC URL Inspection, Search Analytics, sitemap state,
  Googlebot evidence, and current active release pointer.
- Produce machine-readable inventories for:
  - all 13 current sitemap URLs;
  - the 9 crawled and 4 discovered states;
  - all provider wildcard and alias route outcomes;
  - every source document linking to the Art host;
  - every Art-host target and its live status;
  - current visible-content fingerprints for the five city pages.
- Preserve separate counts for links from articles, Antique, main-page, and
  the Art directory itself.
- Use each active immutable production release—not a dirty staging directory—
  as the comparison baseline, recording its path and content hash.

Acceptance:

- A future run can reproduce the `163` broken-link lower bound and identify
  every source/target pair.
- The inventory records the release ID and UTC collection time.
- Raw URL/device/query rows are not misrepresented as unique users.
- No production or GSC state changes during capture.

Evidence roots:

- `/srv/manager/seo/2026-07-26/art-directory-diagnosis/`
- `/srv/manager/seo/art-directory-recovery/2026-07-26-day7-late/`

Depends on: none.

## Phase 1 — Repair crawl integrity

### [x] SEO-001 Return real non-200 responses for unpublished provider routes

Confirmed defect:

- Arbitrary `/appraiser/<slug>/` paths return `200 noindex,nofollow` with a
  canonical to the indexable Appraiser hub.

Work:

- Change the marker-gated provider fallback to preserve the branded unavailable
  body while returning HTTP `404`.
- Use `410` only for a finite, reviewed list of intentionally retired URLs
  where faster removal is desired; arbitrary never-published slugs remain
  `404`.
- Remove the cross-page canonical from the unavailable response.
- Keep the five reviewed provider routes returning `200`, indexable, and
  self-canonical.
- Update the 2026-07-18 external QA brief in the same patch so it no longer
  accepts `200` for suppressed providers.
- Update
  `/srv/infrastructure/docs/runbooks/directory-static-release-model.md`, which
  currently permits the old generic `200 noindex` suppressed-provider
  behavior.
- Update the remediation contract that currently requires the `418`/named
  fallback behavior.

Likely files:

- `nginx.conf`
- `public_site/appraiser-unavailable.html`
- `scripts/check-remediation-contract.mjs`
- `scripts/check-route-link-contract.mjs`
- `docs/postdeploy-external-customer-qa-brief-2026-07-18.md`

Acceptance:

- Each reviewed provider returns `200` and its own canonical.
- A random provider slug returns branded `404`.
- A known suppressed provider returns branded `404` or an explicitly approved
  `410`.
- No HTTP `200` response combines `noindex` with a canonical to another page.
- Direct `/index.html` variants remain unavailable.
- Tests exercise marker-present and marker-absent rollback behavior.

Depends on: SEO-000.

### [x] SEO-001A Version and bind route enforcement to the release artifact

Confirmed release risk:

- Production Nginx is a separately mounted infrastructure artifact.
- The static helper hashes and rolls back `public_site/`, but not that Nginx
  file.
- The active release already carries `.reviewed-route-enforcement-v1`;
  changing semantics under the same marker would make rollback non-atomic.

Work:

- Update and validate both Nginx sources:
  - `nginx.conf`;
  - `/srv/infrastructure/vps-infra/compose/appraisily/runtime/docker-compose/art-appraisers-directory/nginx.conf`.
- Introduce `.reviewed-route-enforcement-v2` for the new provider-status,
  alias, and cache behavior.
- Add a parity contract for the repo/runtime Nginx sources and record both
  hashes in the release receipt.
- Prove in isolated containers:
  - old active artifact plus staged config preserves old behavior;
  - candidate artifact plus staged config enables v2 behavior;
  - rollback restores the previous artifact-compatible behavior.

Acceptance:

- Repo and runtime Nginx are byte-identical or pass a documented semantic
  parity test.
- A v1 artifact cannot accidentally activate v2 behavior.
- Failure restores both content-compatible routing behavior and the previous
  static artifact, with hashes recorded.

Depends on: SEO-001, SEO-002, SEO-005.

### [x] SEO-002 Replace broken provider aliases with evidence-backed outcomes

Confirmed defect:

- All 12 configured alias `301`s point to unpublished slugs and terminate on
  the generic `200 noindex` page.

Work:

- Build an alias decision table containing:
  - source URL;
  - historical provider identity;
  - proposed replacement;
  - replacement publication status;
  - source evidence;
  - final outcome: `301`, `404`, or `410`.
- Keep a `301` only when the destination is an actually published, canonical
  provider URL.
- Return `404`/`410` for aliases with no verified published replacement.
- Extend the route contract to parse every nginx `return 301` target and fail
  unless the target is:
  - a current published route;
  - an approved external canonical; or
  - explicitly documented in the alias decision table.

Likely files:

- `nginx.conf`
- `scripts/check-route-link-contract.mjs`
- `scripts/check-remediation-contract.mjs`
- a new reviewed alias manifest under `data/` or `docs/`

Acceptance:

- No internal `301` chain ends on `noindex`, `404`, `410`, or a generic
  unavailable page.
- Every retained redirect is one hop and query-safe.
- Every removed alias returns the approved final non-200 status.
- The full alias table is reviewed before release.

Depends on: SEO-001, SEO-002A.

### [x] SEO-002A Build the historical Art URL retirement ledger

Work:

- Create a normalized union of:
  - the archived 241-URL sitemap;
  - the current 13 URLs;
  - every recoverable URL from the 397-era sitemap, GSC exports, Git history,
    crawler logs, cross-host links, and publication manifests.
- Record provenance and confidence for every recovered URL.
- Assign one evidence-backed terminal result:
  - retained `200`;
  - equivalent one-hop `301`;
  - known retired `410`;
  - unknown or unmatched `404`.
- Explicitly record any unrecoverable part of the 397-era inventory. Do not
  describe the ledger as complete if only the historical count survives.
- Use this ledger in route tests, crawl-log monitoring, and any future
  consolidation map.

Acceptance:

- Every recovered historical URL has one tested terminal outcome.
- No URL redirects merely to preserve signals when the destination does not
  satisfy substantially the same user intent.
- Counts are reported by evidence source, with duplicates normalized.
- A route-contract fixture covers every outcome class and unmatched wildcard
  behavior.

Depends on: SEO-000, SEO-001. Feeds SEO-002, SEO-011, and SEO-015.

### [x] SEO-003 Remove every cross-host link to a retired Art route

Confirmed defect:

- At least 163 active links point to Art routes that now return `404`.

Work:

- Re-run the complete source/target inventory immediately before editing.
- Article surface:
  - correct the 43 broken occurrences in the 15 identified article files;
  - inspect main-page Art landing references to retired Chicago and Miami
    routes;
  - do not replace a broken deep link with an unrelated city.
- Antique surface:
  - stop unconditionally interpolating every Antique city into an Art city URL;
  - expose an Art city link only when the slug belongs to the current reviewed
    Art location cohort;
  - otherwise omit the module or use one genuinely useful Art hub link.
- Introduce a fail-closed cross-host route contract based on the Art sitemap or
  a reviewed route snapshot with source release/hash.
- Ensure the contract catches drift when the Art cohort changes.

Likely files:

- `/srv/repos/agents/article-agent/scripts/inject-related-guides.mjs`
- affected article source/static records identified by SEO-000
- `/srv/repos/frontends/main_page/src/landing/art-appraisers/pages/ArtAppraiserPainLedV3.tsx`
- `/srv/repos/frontends/antique-appraiser-directory-frontend/src/pages/StandardizedLocationPage.tsx`
- `/srv/repos/frontends/antique-appraiser-directory-frontend/scripts/check-art-directory-recovery-links.mjs`
- corresponding focused tests and immutable release manifests

Acceptance:

- A complete scan reports zero links from active Appraisily/Article/Antique
  documents to non-200 Art city routes.
- Every retained Art deep link resolves directly to a current sitemap URL.
- No city is silently redirected to a different city.
- Googlebot-visible HTML contains the corrected links; the fix is not
  hydration-only.
- Article and directory corpus-safety checks show no unrelated URL loss.

Depends on: SEO-000, SEO-003A.

### [x] SEO-003A Establish one versioned canonical Art-route registry

Confirmed risk:

- Articles, Antique, and main-page currently maintain separate hard-coded Art
  route assumptions.
- Active Googlebot-visible HTML also contains thousands of tracked Art URLs,
  creating crawl variants of the same canonical destinations.

Work:

- Generate or commit one reviewed registry containing:
  - allowed URL;
  - route kind;
  - publication status;
  - canonical URL;
  - source Art release ID and artifact hash.
- Make Articles, Antique, and main-page link validators consume the same
  immutable snapshot.
- Require Googlebot-visible SEO/navigation links to use clean canonical URLs
  without query strings or fragments. Keep attribution in existing click-data
  attributes or analytics events rather than crawlable UTM variants.
- Fail validation if a generator emits an Art path absent from the registry or
  the registry hash does not match the release under review.
- Refresh and review the registry after SEO-006/SEO-007 changes the cohort.

Likely source assumptions to replace:

- `/srv/repos/frontends/articles-static/scripts/inject-city-bridge-links.mjs`
- `/srv/repos/agents/article-agent/scripts/inject-related-guides.mjs`
- `/srv/repos/frontends/antique-appraiser-directory-frontend/src/pages/StandardizedLocationPage.tsx`
- `/srv/repos/frontends/antique-appraiser-directory-frontend/scripts/check-art-directory-recovery-links.mjs`
- `/srv/repos/frontends/main_page/src/landing/art-appraisers/pages/ArtAppraiserPainLedV3.tsx`

Acceptance:

- One reviewed registry/hash governs every cross-host contract.
- Zero retained Art-host links contain query strings or fragments in delivered
  crawlable HTML.
- Zero retained links fall outside the approved registry.
- Registry drift blocks candidate promotion.

Depends on: SEO-000. Refresh depends on SEO-006 and SEO-007.

### [x] SEO-004 Replace corpus-wide directory linking with bounded contextual links

Confirmed state:

- 3,211 article files contain 4,703 Art-host links; 4,612 point to `/`.

Work:

- Identify which repeated surfaces create the two or more Art-home links per
  article, including:
  - directory note injection;
  - directory cards;
  - local-specialist decision routing;
  - shared footer/chrome network links.
- Define eligibility using actual page intent:
  - keep contextual links on art-appraiser, art-appraisal, near-me, local
    specialist, donation/insurance appraisal, and closely matching pages;
  - remove local-directory prompts from unrelated object-identification and
    general antique pages;
  - retain global network navigation only once where it is useful to humans.
- Change the generator first so the pattern does not return.
- Cover all generator paths, not only the related-guides injector:
  - `/srv/repos/frontends/articles-static/scripts/inject-decision-routing.mjs`;
  - `/srv/repos/frontends/articles-static/scripts/inject-city-bridge-links.mjs`;
  - `/srv/repos/frontends/articles-static/_templates/base-article.html`;
  - `/srv/repos/agents/article-agent/scripts/inject-related-guides.mjs`;
  - prompt/tooling contracts that require preserving a generic directory
    bridge.
- Replace broad keyword inference and fallback-to-both-directories behavior
  with a fail-closed eligibility decision using title, description, category,
  and reviewed intent. Generic “value,” “identify,” “memorabilia,” or
  “appraisal” alone is not sufficient Art-directory intent.
- Produce a manifest for existing affected articles.
- Remediate existing static pages in bounded, hash-verified tranches rather
  than a single blind 3,211-page rewrite.
- Start with:
  - Tranche A: generator fixes and the 15 files containing broken city links;
  - Tranche B: a bounded manifest of indexed/impression-bearing and
    high-relevance art/local-appraisal pages;
  - later tranches only after reviewing the exact graph delta from the prior
    tranche.
- For each article record source slug, eligibility reason, old/new SHA-256,
  removed links, retained links, and target-registry hash. Compare against the
  active immutable Articles release, not the dirty staging tree.

Likely files:

- `/srv/repos/agents/article-agent/scripts/inject-related-guides.mjs`
- article templates/enhancement generators responsible for directory cards
- article batch-manifest and corpus-safety tooling
- shared Appraisily chrome only if it creates duplicate links on the same page

Acceptance:

- No unrelated article receives an Art-directory contextual block.
- Relevant articles contain no more than one bounded contextual directory
  module plus any legitimate global network navigation.
- All retained anchors describe the destination and intent.
- A generator regression test covers art, antique, mixed, and unrelated
  categories, plus tax/donation and local-appraiser intent.
- Existing corpus remediation is manifest-bound and cannot overwrite unrelated
  article changes.

Depends on: SEO-003, SEO-003A.

### [x] SEO-005 Apply one HTML cache policy to the full sitemap cohort

Confirmed defect:

- The ten exact-match reviewed city/profile routes lack the no-store headers
  served by the homepage and hubs.

Work:

- Centralize HTML no-cache headers at the server level or apply the complete
  set consistently to every exact-match HTML location.
- Preserve long-lived immutable caching for hashed assets.
- Account for nginx `add_header` inheritance when adding or overriding any
  future security headers.
- Extend the container HTTP contract to iterate through every current sitemap
  URL and remain manifest-driven if the final cohort changes.

Likely files:

- `nginx.conf`
- nginx/static-release smoke and contract tests

Acceptance:

- All current 13—and every later approved—sitemap URLs return the same
  approved HTML Cache-Control policy.
- Reviewed routes return `Cache-Control: no-cache, no-store, must-revalidate`
  and the approved Cloudflare cache directive.
- Hashed assets retain immutable caching.
- A candidate release cannot pass if any indexable HTML route lacks the policy.

Depends on: SEO-000.

## Phase 2 — Decide whether the pages deserve separate indexation

### [x] DEC-SEO-01 Choose the city-page architecture

Options:

1. **Enrich the five city pages** only if verified local decision evidence is
   available.
2. **Collapse one-provider city pages** into a stronger reviewed location hub
   while preserving the useful provider profiles.

Required evidence per city before choosing enrichment:

- a claim-level evidence manifest containing claim, source URL, source type,
  checked-at date, primary-location versus service-area classification, and
  the page section the evidence supports;
- verified provider primary location versus service area;
- supported appraisal specialties and use cases;
- in-person/remote service format;
- public contact path;
- credentials or associations only when sourced;
- review/source URLs and verification date;
- a useful explanation of when a local versus online appraisal fits;
- enough differentiation that the page is useful without swapping the city
  and provider names.
- a city-versus-profile overlap review identifying the distinct user question
  answered by the city page.

Decision rule:

- Default to collapse for a one-provider city unless verified city-level
  decision value exists independently of the provider profile.
- Choose enrichment only for cities that pass the evidence matrix.
- Collapse a city page if the only available content is the provider card and
  generic template statements.
- Do not use a minimum word target.
- Generic city/market prose and repeated provider facts do not qualify as
  city-level utility.

Acceptance:

- A written city-by-city decision table exists for Boston, Houston,
  Los Angeles, New York, and Philadelphia.
- Every claim links to approved source evidence.
- A retained city still contains sourced local decision value after removing
  the provider name, city name, and shared boilerplate.
- Unsupported, stale, or service-area-as-primary-location claims fail
  publication.
- Collapsing all five cities is an acceptable successful decision if none
  passes.
- The selected architecture is approved before HTML work begins.

Depends on: SEO-000.

### [x] SEO-006 Implement the approved city/hub architecture

If enrichment is approved:

- Update both the initial static HTML and hydrated component.
- Add only source-backed sections that help a visitor choose an appraiser.
- Distinguish primary location from remote service area.
- Preserve one clear local-provider route and the explicit Appraisily online
  alternative.
- Keep ratings/review counts absent under the current policy.

If collapse is approved:

- Remove weak city URLs from the sitemap and internal navigation.
- Select a canonical destination for each retired city URL.
- Use `301` only when the destination satisfies substantially the same intent;
  otherwise return a real `404`/`410`.
- Strengthen the Location hub so it explains the reviewed cohort and exposes
  the five useful profiles without doorway-like city shells.

Likely files:

- `src/pages/StandardizedLocationPage.tsx`
- `src/App.tsx`
- the five reviewed `public_site/location/*/index.html` files
- `scripts/build-indexing-manifest.mjs`
- `public_site/location/index.html`
- route, remediation, schema, asset, and interaction contracts

Acceptance:

- Static and hydrated content agree.
- Every retained city page passes the approved evidence matrix.
- No generic city template can be published merely by changing entity names.
- The Location hub uses the shared brand/navigation shell.
- Sitemap, navigation, feeds, schema, nginx allowlist, and publication
  manifest agree exactly.

Depends on: DEC-SEO-01.

### [x] DEC-SEO-02 Select one canonical Appraisily home per provider and city intent

Work:

- Audit all five current Art providers against the Antique directory and
  Appraisily apex.
- Start with the confirmed Wilson Art Services duplicate.
- For each duplicate, compare:
  - current GSC state and demand;
  - content completeness;
  - topical fit;
  - inbound internal links;
  - historical URL signals;
  - provider/source evidence.
- Select one indexable canonical home.
- Make the other copy a real redirect or non-indexable support page only when
  that state serves a user need; do not keep two self-canonical duplicates.
- Perform the same decision for overlapping city intent, noting that Antique
  pages already earn art-appraisal impressions.

Acceptance:

- No provider identity has two indexable self-canonical Appraisily pages
  without a documented, materially distinct intent.
- Redirects are complete and one hop.
- Cross-host structured data and source facts remain consistent.

Depends on: SEO-000.

### [x] SEO-007 Implement approved canonical-home decisions

Work:

- Update publication/indexing manifests, sitemap membership, route maps,
  cross-host links, canonical tags, and structured data atomically.
- Preserve public provider facts and correction provenance.
- Extend `audit-cross-host-provider-truth.mjs` to fail on unauthorized
  self-canonical duplication.

Acceptance:

- Cross-host truth audit passes.
- Each duplicate decision is represented identically in HTML, JSON feeds,
  sitemap, nginx routes, and internal links.
- No redirect ends on an unpublished or `noindex` target.

Depends on: DEC-SEO-02.

### [x] SEO-006A Make sitemap membership manifest-authoritative

Confirmed defect:

- Profiles currently enter the sitemap when an HTML directory exists without
  `noindex`.
- Cities currently qualify with one listing and
  `minimumRenderedWords: 0`.
- This can publish a stray historical file without reviewed provider/city
  approval.

Work:

- Generate provider membership only from the reviewed provider-publication
  manifest.
- Generate city membership only from the approved city decision/evidence
  manifest.
- Do not infer publication from file existence, absence of `noindex`, one
  listing, or a rendered-word threshold.
- Test exact set equality across:
  - publication and city-decision manifests;
  - feeds and schema;
  - sitemap;
  - internal navigation;
  - Nginx route allowlist.
- Add negative fixtures for an accidentally indexable suppressed profile, an
  unapproved one-provider city, and every feed/manifest/sitemap mismatch.

Likely files:

- `scripts/build-indexing-manifest.mjs`
- reviewed provider and city manifests
- shared indexing, route-link, and remediation contracts

Acceptance:

- Sitemap provider URLs exactly equal the verified provider manifest.
- Sitemap city URLs exactly equal the approved city-decision manifest.
- Any extra indexable-looking file fails validation rather than entering the
  sitemap.
- All publication surfaces agree as sets, not merely by count.

Depends on: DEC-SEO-01, DEC-SEO-02. Must complete with SEO-006 and SEO-007.

### [x] SEO-008 Strengthen the homepage and hubs as useful crawl entry points

Work:

- Give the homepage, Appraiser hub, and Location hub enough unique utility to
  explain:
  - what the directory reviews;
  - what it does not verify or publish;
  - how to choose among the five profiles;
  - the difference between provider location and service area;
  - how corrections and source freshness work.
- Keep the hubs compact and factual; do not repeat the same paragraph on all
  three.
- Use the shared visual/navigation shell on initial HTML and after hydration.

Likely files:

- `public_site/index.html`
- `public_site/appraiser/index.html`
- `public_site/location/index.html`
- `scripts/build-indexing-manifest.mjs`
- matching React components and contracts

Acceptance:

- Each hub has a distinct purpose and user task.
- Hubs link to every retained indexable child once through descriptive,
  crawlable HTML.
- No hidden link dump or repetitive SEO block is introduced.

Depends on: DEC-SEO-01, DEC-SEO-02.

### [x] SEO-009 Preserve primary navigation without JavaScript on mobile

Confirmed defect:

- The homepage static shell hides Locations and Methodology below 680px and
  has no static menu control.

Work:

- Keep essential primary links visible at 390px before hydration.
- Use a wrapping compact row or accessible CSS-only disclosure.
- Let hydration replace/enhance the shell without duplicate focus targets.
- Add a JavaScript-disabled mobile browser contract.

Acceptance:

- At 390×844 with JavaScript disabled, Locations, Methodology, and correction
  paths remain visible and keyboard reachable.
- No horizontal overflow or duplicate accessible controls after hydration.
- The same essential routes are present in delivered HTML.

Depends on: none.

## Phase 3 — Sitemap, release, and GSC gates

### [x] SEO-010 Contract truthful change dates or deliberate `lastmod` omission

Work:

- Preserve the current deliberate omission as the default approved outcome.
- Define an authoritative source for meaningful page changes:
  - reviewed provider verification date;
  - approved content revision date;
  - hub revision ledger.
- Emit `<lastmod>` only when backed by that source.
- Do not use filesystem mtime, build time, deploy time, or “today” as a proxy
  for content change.
- If no authoritative date exists, continue omitting `<lastmod>`.
- Treat adding dates as optional; the required change is a regression contract
  preventing false build/deploy dates.

Likely files:

- `scripts/build-indexing-manifest.mjs`
- provider publication/indexing manifest
- focused sitemap contract tests

Acceptance:

- Every emitted date is traceable to one reviewed record.
- Unchanged pages retain their prior date.
- Sitemap membership remains exactly aligned with the approved architecture.
- A fixture proves rebuilds and deployments cannot change `<lastmod>` values.

Depends on: SEO-006, SEO-007, SEO-008.

### [x] SEO-011 Build and validate one frozen release candidate

Required gates:

- `npm run typecheck`
- `npm run lint`
- `npm run check:static`
- `npm run check:indexing-contract`
- `npm run check:route-links`
- `npm run check:remediation-contract`
- provider-source-quality and cross-host truth audits
- all 13/approved sitemap URLs in an isolated nginx container
- arbitrary provider, retired provider, alias, slash, direct-index, and unknown
  city route matrix
- cache-policy assertions for HTML and hashed assets
- desktop/mobile browser checks with:
  - initial HTML;
  - hydrated DOM;
  - JavaScript disabled;
  - no browser/script/network failures.

Release-candidate evidence must record:

- source commit/tree state;
- exact included dirty files;
- public artifact hash;
- sitemap count;
- provider/city counts;
- route outcomes;
- link-graph scan;
- rollback release.

Acceptance:

- Zero broken cross-host Art links.
- Zero provider alias chains ending on non-indexable content.
- Zero arbitrary provider-shaped `200` responses.
- One cache policy across all indexable HTML.
- No publication-manifest, feed, schema, nginx, or sitemap disagreement.
- Candidate remains frozen after validation.

Depends on: every applicable SEO-001 through SEO-010 task, including `A`
subtasks and both architecture decisions.

### [x] SEO-011A Make the full route matrix an automatic promotion gate

Work:

- Extend the production directory smoke to test:
  - every final sitemap URL;
  - a randomized unknown document;
  - a randomized provider-shaped URL;
  - a known suppressed provider;
  - every retained alias;
  - representative retired provider and city routes;
  - slash and direct-`index.html` variants;
  - the internal enforcement marker;
  - HTML and hashed-asset cache headers;
  - essential mobile navigation with JavaScript disabled.
- Record status, final URL, redirect count, robots, canonical, cache headers,
  and body fingerprint for each HTTP route.
- Run the same matrix against the isolated candidate and public production.
- Wire the public smoke into the deploy helper so failure occurs inside the
  rollback boundary.

Acceptance:

- A provider soft `200`, broken alias, missing cache header, wrong marker, or
  hidden no-JS primary navigation fails promotion and triggers rollback.
- The smoke covers the final cohort rather than a hand-picked happy path.
- Pre-activation and post-promotion receipts are comparable.

Depends on: SEO-001A, SEO-002, SEO-005, SEO-009, SEO-011.

### [x] SEO-011B Bind deploy-helper expectations to the frozen cohort

Confirmed defect:

- The current helper override hard-codes sitemap count `13`, Los Angeles, and
  Open to the Public even though the approved city/canonical decisions can
  change that cohort.

Work:

- Derive the expected sitemap count and representative routes from the frozen
  approved manifest, or update and hash a reviewed helper snapshot in the same
  candidate.
- Fail before promotion if helper expectations and candidate membership
  disagree.
- Select stable representative routes only after city/provider canonical
  decisions are complete.

Acceptance:

- Helper expected count equals the frozen sitemap count.
- Every configured route exists in the approved cohort.
- A retired route or obsolete count cannot reach deployment.

Depends on: SEO-006, SEO-006A, SEO-007, SEO-011.

### [x] SEO-012 Coordinate and deploy all affected production surfaces

Deployment approved and completed on 2026-07-26.

Work after approval:

- Freeze and validate a separate candidate for every affected surface:
  - Articles through its manifest-bound immutable article flow;
  - Antique through its static-release helper;
  - main-page, if changed, through its blue/green flow;
  - Art through its static-release helper.
- Record each active baseline, candidate hash, exact included delta, release
  receipt, and rollback target.
- Promote in a link-safe sequence:
  1. remove existing broken inbound links from source surfaces;
  2. verify no active source points to a non-`200` Art target;
  3. activate the Art routing/content candidate;
  4. publish any new or retained deep links only after their final targets are
     live and verified.
- Re-run the complete cross-host registry/link scan after every promotion.
- Keep approvals and rollback decisions separate per service. Do not use one
  service rollback to undo unrelated releases.
- Re-run the full route/browser/cache matrix and verify Googlebot receives the
  same statuses and HTML as a normal client.

Acceptance:

- Every public surface matches its frozen candidate hash and has a release
  receipt.
- There is no interval where a newly published link points to an unavailable
  Art target.
- Final live scan reports zero broken, noncanonical, tracked-query, or
  unregistered Art links.
- A source rollback cannot reintroduce links outside the approved registry.
- Dirty-tree files outside each manifest/candidate are not promoted.
- Any failure identifies and rolls back the affected service atomically.

Depends on: SEO-003, SEO-003A, SEO-004, SEO-011, SEO-011A, SEO-011B and
explicit deployment approval for each affected service.

Completion evidence:

- Articles: `20260726220600-4bfc6db0650c`;
- Antique: `20260726222142-2c80a77fc178`;
- Art: `20260726223104-8f2c57469025`;
- main-page: `prod-20260726223809-8a1bc612b`, build
  `52b921104d9710a16522`;
- live `/art` already contained only registered Art-directory root links; the
  deployed `PainLedV3` edit is dormant because `/art` renders
  `ArtAppraiserProofV4`;
- the route-registry validator now checks the actual Googlebot-visible
  `art.html` shell and shared chrome, and separately preflights the dormant
  component;
- final live Articles scan: 2,768 links across 2,690 documents, zero deep
  unregistered Art links;
- final live Art route/cache/browser contract: passed.

### [x] SEO-013A Freeze and automate the post-remediation observation contract

Critical confirmed defect:

- The current checkpoint script hard-codes the July 15 cohort/boundary and
  fixed calendar dates.
- It can currently classify the directory as evaluated after only one
  post-release crawl or matching crawler-log row.
- It therefore cannot judge a changed final cohort safely.

Work:

- Implement and fixture-test the manifest-driven runner before deployment.
- After SEO-012, write an immutable experiment manifest containing:
  - release IDs, artifact hashes, and deployment UTCs;
  - final sitemap URL list and sitemap hash;
  - planned final indexing-request cohort;
  - reference to the original July experiment;
  - release-relative Day-7, Day-14, and Day-28 dates.
- Store later per-URL GSC UI receipts in a hash-linked append-only receipt
  ledger; do not rewrite the release-boundary manifest.
- Parameterize
  `/srv/repos/tools/search-console-inspector/art-directory-recovery-checkpoint.mjs`
  to consume this manifest instead of fixed July constants.
- Preserve the original eight URLs as historical comparison only.
- Report `evaluated_count / final_cohort_count`, each inspected URL's crawl
  time, and a distinct `partially_evaluated` state.
- Permit `evaluated_not_recovered` or consolidation only when every surviving
  final-cohort URL has a successful inspection and a crawl after the new
  release boundary.
- Collect separate reproducible Search Analytics datasets:
  - `date` totals;
  - `date,page` URL totals;
  - `date,page,query` diagnostic detail only.
- Use explicit start/end dates, record the latest complete GSC date/latency,
  and split pre-release from post-release rows.

Acceptance:

- A fixture with one of thirteen post-release crawls cannot return
  `evaluated_not_recovered`.
- Retired or redirected historical URLs cannot count toward final-cohort
  evaluation.
- Manifest hash, live sitemap hash, and inspected/requested cohorts agree.
- Query-dimensional rows are never called complete property totals or unique
  users.
- No negative verdict issues before both complete GSC dates and complete final
  cohort crawl evaluation.

Depends on: SEO-011 for tooling; completion also requires SEO-012 to instantiate
the live boundary. Must complete before SEO-013 and new release checkpoints.

Completion evidence:

- immutable manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-26-remediation-release/experiment-manifest.json`;
- manifest SHA-256:
  `6682a5e5ea9988cd0c9b4bd696a8af56ce91ffda936125babcd9ac14cef71e08`;
- exact 8-URL cohort and sitemap hash are bound to all four release IDs and
  artifact hashes;
- manifest-driven Day-7 dry run passed with full-cohort evaluation required;
- the empty request-receipt ledger records that GSC mutation has not started.

### [!] SEO-013 Resubmit the final sitemap and request the bounded cohort

Approval required because this mutates Search Console.

Work:

- Confirm the live sitemap and release hash first.
- Submit/resubmit only the final canonical sitemap.
- Request indexing only for the final useful cohort.
- Save exact UTC receipts or screenshots for each UI request.
- Populate the SEO-013A experiment manifest without erasing the July
  experiment by writing the hash-linked request receipt ledger.

Acceptance:

- GSC downloads the live sitemap with zero errors/warnings.
- Every requested URL is `200`, indexable, self-canonical, and in the sitemap.
- No retired, redirected, noindex, or error URL is requested.

Depends on: SEO-013A and explicit GSC approval.

## Phase 4 — Measurement and stop rules

### [ ] SEO-014 Run the fixed Day-14 checkpoint on 2026-07-29

Command:

```bash
node /srv/repos/tools/search-console-inspector/art-directory-recovery-checkpoint.mjs \
  --label day14 \
  --out /srv/manager/seo/art-directory-recovery/2026-07-29-day14
```

Work:

- Reinspect the original eight-URL cohort.
- Record crawl timestamps, coverage states, Google canonicals, sitemap state,
  URL-prefix/domain Search Analytics, and crawler logs.
- Compare crawl times with both:
  - 2026-07-15 recovery boundary;
  - 2026-07-25 latest directory release.
- If implementation ships before this read, label the cohort contaminated and
  keep this as a historical July read. Do not call it Day 14 of the new
  release.
- Check the Search Console Manual Actions and Security Issues UI and save a
  dated receipt. These reports are not exposed by the current APIs and must
  not be inferred as clear from URL Inspection.

Decision rules:

- At least one indexed URL or nonzero impression is a recovery signal, not a
  completed SEO win.
- No post-2026-07-25 crawl means the latest release is not yet evaluated.
- Only complete successful inspection plus post-release crawl coverage for
  every surviving final-cohort URL can support an evaluated rejection.
- Do not infer unique users or rates from dimensional aggregate rows.

Depends on: calendar date; no mutation required.

### [ ] SEO-014A Run release-relative Day-7, Day-14, and Day-28 checkpoints

Work:

- Use the immutable SEO-013A experiment manifest and dates calculated from the
  actual release/request boundary.
- At every checkpoint store:
  - property-total clicks and impressions over explicit date ranges;
  - per-page totals and query detail separately;
  - URLs indexed;
  - successful inspections;
  - URLs crawled after the boundary;
  - final cohort size;
  - sitemap download time and state;
  - crawler-log evidence.
- Protect a comparison cohort of existing Antique pages earning
  art-appraisal demand so consolidation or link changes cannot silently damage
  them.
- Classify the read as:
  - `recovery_signal_observed`;
  - `partially_evaluated`;
  - `evaluated_not_recovered`;
  - `not_yet_evaluated`.

Acceptance:

- Every read is reproducible from stored start/end dates and immutable
  cohort/release hashes.
- Partial crawl coverage never produces a negative final verdict.
- A recovery signal is reported separately from business impact.
- Antique comparison changes are surfaced; no causal claim is made without a
  valid boundary and denominator.

Depends on: SEO-013 and the release-relative calendar dates.

### [ ] SEO-015 Run the consolidation gate on or after 2026-08-05

Trigger consolidation planning only if all are true:

- Google downloaded the corrected final sitemap.
- Google crawled the final useful cohort after its release boundary.
- Zero URLs are indexed.
- Search Analytics still reports zero impressions.

Compare:

1. Curated Art-provider and city paths on `appraisily.com`.
2. Consolidation into the performing Antique/general appraiser directory.

Required comparison:

- existing GSC demand and indexed history;
- content/intent fit;
- provider and city canonical ownership;
- redirect/retirement coverage for the recovered historical ledger, including
  explicit limitations where the 397-era inventory cannot be reconstructed;
- internal-link changes;
- user trust and naming;
- deployment complexity and rollback;
- effect on existing Antique rankings.

Acceptance:

- One canonical target architecture is recommended with evidence.
- Every recovered historical URL is represented in the old-to-new
  redirect/retirement map, and any unrecoverable portion is explicit.
- No migration or redirect ships without separate approval.
- If neither trigger nor recovery signal is present because Google has not
  recrawled, record `not yet evaluated`; do not keep rewriting pages blindly.

Depends on: SEO-014A, complete final-cohort evaluation, and the trigger
conditions above.

## Phase 5 — Contingent consolidation

This phase remains dormant unless SEO-015 meets its trigger and the user
separately approves consolidation.

### [!] DEC-SEO-03 Approve the consolidation target

Decision:

- Choose either:
  - curated Art-provider/city paths on `appraisily.com`; or
  - the established Antique/general appraiser directory.
- Approve:
  - provider and city canonical ownership;
  - target URL pattern;
  - source-host retirement behavior;
  - the protected Antique ranking/query cohort;
  - migration order and rollback boundary.

Acceptance:

- The decision cites SEO-015 evidence rather than assuming the stronger host.
- Every retained provider/city intent has exactly one canonical owner.
- Risks to existing Antique rankings and Appraisily conversion paths are
  explicit.
- No build, redirect, deployment, or GSC mutation occurs under this decision
  alone.

Depends on: SEO-015 and explicit architecture approval.

### [ ] SEO-017 Build the approved consolidation candidate

Work:

- Materialize SEO-002A into the approved old-to-new/retirement route map.
- Move only useful, evidence-backed provider and hub content.
- Update atomically:
  - canonical tags and robots directives;
  - schema, feeds, and sitemaps;
  - navigation and all cross-host links;
  - correction/source provenance;
  - analytics attribution and route reporting.
- Remove duplicate self-canonical copies.
- Produce before/after URL, link-graph, and protected-Antique-cohort
  manifests.
- Freeze independent source, target, and routing candidates with rollback
  receipts.

Acceptance:

- Every current 13-cohort URL and every recovered historical URL has one
  terminal outcome.
- No redirect chain, canonical conflict, orphan, or sitemap/feed disagreement
  exists.
- Protected Antique pages are unchanged or explicitly reviewed.
- Candidate is immutable, hash-bound, and rollback-capable.

Depends on: DEC-SEO-03, SEO-002A, SEO-003A.

### [!] SEO-018 Deploy the approved consolidation candidate

Approval required.

Work:

- Deploy the target surface, inbound-link sources, and Art-host routing in a
  documented link-safe order.
- Verify source/live hashes, health, public HTTP behavior, analytics
  continuity, protected Antique pages, and rollback after every promotion.
- Roll back only the affected component on failure.

Acceptance:

- Every old URL reaches its approved terminal outcome in zero or one redirect.
- Target canonicals, sitemaps, schema, navigation, and analytics agree.
- Cross-host live scan has no broken or obsolete Art links.
- Art and protected Antique source/live receipts are archived.

Depends on: SEO-017 and explicit per-surface deployment approval.

### [!] SEO-019 Execute and measure the GSC migration

GSC approval required.

Work:

- Submit only the final target canonical sitemap(s).
- Preserve UI receipts for submissions and bounded indexing requests.
- Create an immutable migration observation manifest.
- Run release-relative Day-7, Day-14, and Day-28 checks covering:
  - source URL disappearance/redirect recognition;
  - target discovery, crawl, selected canonical, and indexation;
  - target impressions and clicks;
  - protected Antique query/page performance.

Acceptance:

- No source URL is requested for indexing after migration.
- Source/target cohorts and date ranges are reported separately.
- Query-dimensional exports are diagnostic, not complete denominators.
- The final report distinguishes migration completion, SEO recovery, and
  business impact.

Depends on: SEO-018 and explicit GSC approval.

## Phase 6 — Lower-priority hardening

### [x] SEO-016 Isolate provider-quality audit output

Confirmed defect:

- `check:static` writes to fixed
  `/tmp/art-provider-source-quality.json` using ordinary `fs.writeFile`.

Work:

- Use a run-specific `mkdtemp` directory or repo-local ignored reports
  directory.
- Refuse symlink destinations.
- Ensure concurrent validation runs cannot read or overwrite one another.

Likely files:

- `package.json`
- `scripts/audit-provider-source-quality.mjs`
- focused script tests

Acceptance:

- Two concurrent audit runs produce isolated reports.
- Existing symlink destinations are rejected.
- `check:static` still exposes the report path in its receipt.

Depends on: none.

## Final release success criteria

Implementation is complete only when:

- all confirmed crawl defects are fixed and tested;
- cross-host broken-link count is zero;
- the chosen city/provider architecture is approved and implemented;
- the final sitemap, manifests, routes, feeds, schema, and HTML agree;
- the frozen candidate passes full static, nginx, browser, and source-quality
  gates;
- deployment and GSC mutations, if approved, have receipts;
- observation tooling is bound to the actual final release and cannot declare
  rejection from a partial crawl;
- the next GSC checkpoint distinguishes:
  - `recovery_signal_observed`;
  - `partially_evaluated`;
  - `evaluated_not_recovered`;
  - `not_yet_evaluated`.

The business outcome remains open until GSC shows an indexed URL or impression,
or the consolidation decision is approved, executed, and measured.

## Evidence and related records

- SEO diagnosis:
  `/srv/manager/seo/2026-07-26/art-directory-diagnosis/DIAGNOSIS.md`
- Late Day-7 checkpoint:
  `/srv/manager/seo/art-directory-recovery/2026-07-26-day7-late/readout.md`
- Existing recovery plan:
  `/srv/manager/plans/art-appraisers-directory-gsc-recovery-task-list-2026-07-15.md`
- Earlier remediation backlog:
  `/srv/repos/frontends/art-appraiser-directory-frontend/docs/audit-remediation-task-list-2026-07-18.md`
- Pre-implementation Claude audit with Codex dispositions:
  `docs/audits/2026-07-26-preimplementation/AUDIT.md`
- Pre-implementation Claude accepted-finding subset:
  `docs/audits/2026-07-26-preimplementation/TASKS.md`
- Implementation receipt:
  `docs/art-directory-seo-recovery-implementation-receipt-2026-07-26.md`
- Post-implementation Claude audit with Codex dispositions:
  `/srv/repos/frontends/art-appraiser-directory-frontend/AUDIT.md`
- Post-implementation accepted hardening tasks:
  `/srv/repos/frontends/art-appraiser-directory-frontend/TASKS.md`
