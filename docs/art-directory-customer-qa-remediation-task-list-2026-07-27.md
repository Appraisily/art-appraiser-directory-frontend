# Art Directory Customer-QA Remediation Task List

**Prepared:** 2026-07-27
**Canonical implementation contract:** this file
**Target:** `https://art-appraisers-directory.appraisily.com/`
**Status:** corrective release, external QA, and immutable GSC boundary
verified; ARTQA-010 approved and sitemap submitted; eight UI indexing requests
and GSC safety checks await an authenticated browser profile
**Status legend:** `[ ]` open, `[x]` complete, `[~]` implemented but awaiting a
live or elapsed-time gate, `[!]` explicit approval required

## Outcome

Make the Art Appraiser Directory present one consistent customer experience
before and after its React application mounts:

- all five reviewed provider profiles retain their official-source link and
  public review context;
- the appraiser, methodology, and correction pages remain readable without
  horizontal overflow on mobile;
- current navigation never offers retired city routes;
- retired city bookmarks keep their correct HTTP `410` meaning while showing
  a branded explanation and safe recovery path;
- the corrected release passes a fresh external customer canary before its
  sitemap is resubmitted or its URLs are requested for indexing.

This backlog is complete only when every source, candidate, release, customer
QA, and GSC-boundary item below is either checked or explicitly left behind an
approval/date gate. Passing source tests alone does not complete it.

## Evidence and current state

### External customer QA

- Run ID: `eea47cf8-c5fe-4b5d-88ad-1e2a9b1fd2e6`
- Receipt: `qa_b655ef97-1d65-4a3e-95ee-dac5f3a5ae99`
- Receipt status: submitted, HTTP `201`
- Result: `fail`
- Release recommendation: `go_with_known_risk`
- Canonical result:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-27/eea47cf8-c5fe-4b5d-88ad-1e2a9b1fd2e6/result.json`
- Result SHA-256:
  `708a38331f00ae39de14bdf3b2f5259e6aa7c4e3ac7955c0a360f35df1c367a4`

The status and recommendation are not contradictory. The customer observed
serious defects, but no blocking privacy, payment, data-loss, or completely
inaccessible-primary-task defect.

### Production and experiment drift

- Active Art release:
  `/mnt/srv-storage/art-appraisers-directory/releases/20260727080054-c54bd5d9fceb`
- Active release verified at: `2026-07-27T08:01:41.233Z`
- Active source hash:
  `c54bd5d9fceb805fd2fbc7a7159144d1350a0f16c2e0916d6f2b935a2b0260ae`
- Existing recovery manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-26-remediation-release/experiment-manifest.json`
- That manifest still names Art release
  `20260726223104-8f2c57469025`, so it is not a valid immutable boundary for a
  later corrective release.
- Search Console mutation remains `not_started`.
- The live sitemap is still the exact eight-URL cohort and has SHA-256
  `78b0117a927dbbd03355991b6c83b6182b23e31712a82f80f68c775edaf0c789`.

### Independently reproduced defects

| ID | Surface | Live result after the page settled | Confirmed cause |
| --- | --- | --- | --- |
| QA-01 | Five provider profiles | No official-provider action remains after React mounts | Static profile HTML exposes `ProfessionalService.sameAs` and “Visit official website,” but `/appraisers.json` omits `website`; `StandardizedAppraiserPage` replaces the static DOM from that incomplete feed |
| QA-02 | `/appraiser/` at `390x844` | `clientWidth=375`, `scrollWidth=433`; the introduction is pushed off-screen | Unscoped fallback `header`, `main`, `h1`, and `p` CSS remains in `<head>` after `main.tsx` calls `rootElement.replaceChildren()` and affects the React page |
| QA-03 | `/get-listed/` at `390x844` | `clientWidth=375`, `scrollWidth=407`; the heading and introduction become narrow columns | Same fallback-CSS leakage |
| QA-04 | `/methodology/` at `390x844` | `clientWidth=375`, `scrollWidth=470`; the introduction is clipped | Same fallback-CSS leakage; this was found during independent follow-up and belongs to the same repair |
| QA-05 | Retired `/location/houston/` | Bare `410 Gone` and Nginx signature with no explanation or recovery link | Retired-city Nginx block returns `410` without a `410` error document |

The fresh `/location/` hub did not expose a retired city link during Codex's
clean follow-up. The customer's static/dynamic navigation discrepancy remains
credible but is not yet reproducible as an always-present hub defect. It must
be covered by hard-load and client-transition tests rather than reported as
universally present.

## Decisions and guardrails

- [x] **DEC-01 — Keep the directory static-first.** `public_site/` remains the
  canonical release artifact. The immediate repair makes the current client
  enhancement agree with the static artifact; it does not authorize a broad
  SPA rewrite.
- [x] **DEC-02 — Preserve the reviewed cohort.** Do not add providers, restore
  city shells, expand the sitemap, or fabricate provider facts.
- [x] **DEC-03 — Preserve correct HTTP semantics.** Retired reviewed city
  routes remain `410`; unknown routes remain `404`; neither receives a
  canonical that could turn it into a soft error.
- [x] **DEC-04 — Use only public reviewed source data.** Provider websites and
  review dates may enter feeds only when already present in canonical public
  HTML/JSON-LD and allowed by the reviewed provider manifest. Do not expose
  discovery data, customer data, private enrichment, internal notes, or
  credentials.
- [x] **DEC-05 — Hold GSC mutation.** Do not resubmit the sitemap or request
  indexing until the corrective release and external retest pass.
- [x] **DEC-06 — Preserve shared work.** The Art repo is currently on
  `codex/art-directory-audit-remediation-20260718`. The shared
  `/srv/repos/tools` tree is heavily dirty with unrelated work; edit only the
  named shared directory utility and its focused tests. Do not pull, reset, or
  discard anything.
- [x] **DEC-07 — Keep deployment separate.** Source implementation and
  candidate validation do not authorize production deployment. Use the
  standard `art-appraisers-directory` static-release helper only after
  explicit deployment approval.

## Phase 0 — Freeze the repair boundary

### [x] ARTQA-000 Record the pre-change source/live matrix and pause GSC

Work:

- Record the active Art release path, receipt, source hash, sitemap hash, and
  the five defect reproductions above in the implementation receipt.
- Confirm the customer-QA result and receipt hashes from canonical private
  storage.
- Mark the existing GSC submission task as dependent on this remediation and
  leave its mutation receipt ledger empty.
- Treat the 2026-07-26 experiment manifest as historical evidence; do not
  overwrite it to describe a later release.

Acceptance:

- The implementation receipt can identify the exact pre-fix release and QA
  result without relying on chat history.
- No Search Console, production, provider, sitemap, or route mutation occurs
  during baseline capture.

## Phase 1 — Restore one provider-trust truth

### [x] ARTQA-001 Add official-source fields to the public feed contract

Primary files:

- `/srv/repos/tools/directory-site-utils/build-directory-llm-feeds.mjs`
- `scripts/build-directory-llm-feeds.mjs`
- `scripts/apply-recovery-reviewed-cohort.mjs`
- `public_site/appraisers.json`
- `public_site/directory.json`

Work:

- Extend the shared feed extractor to map a public provider schema's
  `sameAs` value into the documented `website` field. Handle both string and
  array forms deterministically.
- Carry a public review date into `source.verifiedAt`. Prefer an explicit
  public Schema.org date such as `dateModified`; add that field to verified
  profile JSON-LD during cohort generation if necessary.
- Accept only `http:` or `https:` public provider URLs after normalization.
  Reject empty, malformed, credential-bearing, JavaScript, data, and
  Appraisily-directory self URLs.
- Keep the feed's privacy statement true: every exported field must already
  exist in public profile HTML or public JSON-LD.
- Rebuild `appraisers.json`, `directory.json`, and dependent feeds from the
  reviewed `public_site/` artifact.
- Ensure the shared change remains compatible with the Antique directory; do
  not change its publication cohort or expose previously private fields.

Acceptance:

- All five Art feed records have one normalized `website`.
- Every `website` equals the reviewed public source for that provider.
- Every feed record has the expected public review date or the build fails
  closed; it must not invent the current date.
- The five website values survive a second feed regeneration byte-for-value,
  apart from the documented generation timestamp.
- A fixture with absent/malformed `sameAs` produces no website rather than an
  unsafe link.
- Shared utility tests cover string, array, malformed, self-host, and missing
  source cases.

Focused verification:

```bash
npm --prefix /srv/repos/frontends/art-appraiser-directory-frontend run build:llm-feeds
jq -e '.count == 5 and ([.appraisers[] | select(.website | type == "string" and length > 0)] | length == 5)' \
  /srv/repos/frontends/art-appraiser-directory-frontend/public_site/appraisers.json
npm --prefix /srv/repos/tools/directory-site-utils run check
```

### [x] ARTQA-002 Preserve the official source and review context after React mounts

Primary files:

- `src/utils/standardizedData.ts`
- `src/pages/StandardizedAppraiserPage.tsx`
- `src/data/publishedAppraisers.ts`
- `scripts/check-remediation-contract.mjs`

Work:

- Continue sanitizing the feed website through `sanitizePublicSourceUrl`.
- Harden `sanitizePublicSourceUrl` itself to allow only `http:` and `https:`.
  Build-time validation is the first boundary, not the only boundary; a
  malformed or tampered feed must not turn `javascript:`, `data:`, or another
  unsafe scheme into a clickable client link.
- Render an explicit “Official website” section/action from the verified feed
  rather than the ambiguous “listed website” wording.
- Render the source-review date/context that the static profile and appraiser
  hub promise. Do not imply that Appraisily independently guarantees
  credentials, availability, price, service area, or quality.
- Keep phone and email absent unless those public fields are intentionally
  present in the reviewed feed.
- Split parity proof into two honest layers:
  - `scripts/check-remediation-contract.mjs` compares feed data with static
    profile HTML, JSON-LD `sameAs`, and the public provider-source metadata;
  - the real-browser gate in ARTQA-004 compares the settled React DOM with the
    same expected source/action.
- Fail either layer if a static official-source action disappears after client
  mount or the feed disagrees with the reviewed static source.

Acceptance:

- Each of the five settled live-equivalent React profiles contains exactly one
  visible official-provider action with the reviewed destination.
- Provider image links, official-source actions, and visible source text agree
  on the destination.
- The action opens safely with `noopener noreferrer`; returning leaves the
  directory profile understandable.
- Static and settled client views agree on provider identity, city, source,
  review date, and Appraisily handoff.
- No official link is derived from unreviewed or private data.
- `sanitizePublicSourceUrl('javascript:alert(1)')` and a `data:` URL both
  return an empty value, and a client fixture with either renders no website
  action.

## Phase 2 — Isolate static fallback styles from the client application

### [x] ARTQA-003 Scope fallback markup and CSS on every client-mounted static page

Confirmed affected pages:

- `public_site/appraiser/index.html`
- `public_site/methodology/index.html`
- `public_site/get-listed/index.html`

Related generation/validation:

- `scripts/apply-recovery-reviewed-cohort.mjs`
- `scripts/check-remediation-contract.mjs`
- `src/main.tsx`

Work:

- Wrap server fallback content in one explicit marker such as
  `[data-static-fallback]`.
- Scope fallback layout rules to that marker. Generic rules such as
  `header`, `main`, `footer`, `h1`, `h2`, `p`, `section`, `ul`, and `li a`
  must not match the React tree after `rootElement.replaceChildren()`.
- Keep only genuinely global reset/color rules global and prove that they do
  not alter React layout.
- Apply the durable change in the artifact-generation/remediation path so a
  later cohort rebuild cannot restore unscoped CSS.
- Inventory every page containing both the module bundle and inline style;
  fail the contract when any such page retains unscoped layout selectors.
- Preserve meaningful no-JavaScript content and navigation.

Acceptance:

- At `390x844` and `375x812`, after `networkidle` plus a client-settle delay:
  - `document.documentElement.scrollWidth <=
    document.documentElement.clientWidth + 1`;
  - the kicker, H1, and introduction occupy a readable vertical flow;
  - no text begins outside the viewport;
  - navigation and primary actions remain reachable.
- At `1440x900`, the same pages retain their intended desktop layout.
- With JavaScript disabled, the fallback remains readable and its essential
  navigation works.
- `/appraiser/`, `/methodology/`, and `/get-listed/` all pass; fixing only the
  two pages named in the external report is insufficient.

### [x] ARTQA-004 Add settled-browser responsive and transition contracts

Primary files:

- `scripts/test-interactions.mjs`
- `/srv/repos/tools/smoke/directory-static-contract.mjs`
- focused tests beside the changed smoke/interaction code

Work:

- Keep responsibilities explicit:
  - JSDOM-based `scripts/test-interactions.mjs` covers routing, event, and
    feed-to-component mapping logic only;
  - all layout, viewport, overflow, visibility, and settled-DOM assertions run
    in the real `agent-browser` path. JSDOM has no layout engine and its
    dimensions are not acceptable mobile evidence.
- Extend the real-browser smoke to accept a browser-only multi-route,
  multi-viewport matrix. Do not force noindex support pages such as
  `/methodology/` and `/get-listed/` through the indexable-route HTTP
  contract.
- Run browser assertions after the client has replaced the static DOM, not
  merely against the initial HTML.
- Cover hard loads and client-side transitions among:
  - `/appraiser/`;
  - `/location/`;
  - one provider profile;
  - `/methodology/`;
  - `/get-listed/`.
- Scan the settled DOM for links to the five retired city slugs:
  `boston`, `houston`, `los-angeles`, `new-york`, and `philadelphia`.
- Verify the mobile menu's Locations action reaches `/location/`, and provider
  city labels either reach the provider or the current location hub—not a
  retired city route.
- Record viewport, `clientWidth`, `scrollWidth`, page title, H1, official
  actions, retired-route links, console errors, and failed first-party
  requests in the smoke artifact.
- Keep screenshots viewport-sized; do not rely on one tall full-page image.

Acceptance:

- No current settled navigation exposes a retired city route.
- Hard-load and client-transition destinations render the same current cohort.
- Zero serious console errors or failed first-party requests occur in the
  tested journey.
- The browser gate fails on fixtures reproducing the present official-link
  disappearance and CSS leakage.

## Phase 3 — Preserve `410` semantics with customer recovery

### [x] ARTQA-005 Add a branded retired-location response

Primary files:

- `nginx.conf`
- `/srv/infrastructure/vps-infra/compose/appraisily/runtime/docker-compose/art-appraisers-directory/nginx.conf`
- a new or shared public `410` recovery document under `public_site/`
- `scripts/check-remediation-contract.mjs`
- isolated Nginx and static-release smoke tests

Work:

- Serve a branded internal error document for the five reviewed retired city
  routes while preserving final HTTP status `410`.
- Explain that the city page is no longer published and that current reviewed
  providers are available from the active hubs.
- Provide visible recovery actions to:
  - `/location/`;
  - `/appraiser/`;
  - Appraisily's online appraisal path with controlled directory attribution.
- Do not include a canonical on the `410` document.
- Include a conservative `noindex, follow` robots directive without changing
  the terminal HTTP status.
- Do not expose an Nginx version/signature in the visible response.
- Set `server_tokens off` so default bodies and the `Server` header do not
  expose the Nginx version.
- Keep the repo and runtime Nginx configurations byte-identical, but do not
  restart or activate the runtime copy during source implementation. Runtime
  activation belongs only to the explicitly approved ARTQA-007 deployment.
- Preserve forward/rollback compatibility. The new configuration must not
  point an active or rollback artifact at a missing internal error document.
  Use an artifact-compatible document path, marker/version gate, or
  deployment sequencing that passes the old-artifact test below.
- Preserve:
  - slash and slashless retired-city `410` behavior;
  - `/location/<slug>/index.html` as `404`;
  - unknown city routes as branded `404`;
  - reviewed provider aliases as branded `410`;
  - unknown provider routes as branded `404`.

Acceptance:

- Each retired city returns `410`, branded explanatory copy, and at least one
  working recovery link.
- No retired response contains `nginx/<version>`, a blank body, or a canonical.
- Unknown routes remain `404`; no error route becomes a soft `200`.
- Cache headers remain the intended HTML no-store set.
- The new Nginx configuration mounted over the currently active pre-fix
  artifact still returns a non-broken terminal `410`; mounted over the
  corrective artifact it returns the branded `410`.
- Repo and runtime Nginx files are byte-identical in the frozen candidate, but
  production behavior does not change until ARTQA-007.

Focused verification:

```bash
for slug in boston houston los-angeles new-york philadelphia; do
  curl -sS -D - "https://art-appraisers-directory.appraisily.com/location/$slug/" -o /dev/null
done
```

Run that command against an isolated candidate first; production execution
belongs only to the approved post-deploy gate.

## Phase 4 — Candidate integrity and release gates

### [x] ARTQA-006 Run the complete source and candidate validation matrix

Required checks:

```bash
npm --prefix /srv/repos/frontends/art-appraiser-directory-frontend run lint
npm --prefix /srv/repos/frontends/art-appraiser-directory-frontend run test:interactions
npm --prefix /srv/repos/frontends/art-appraiser-directory-frontend run check:static
npm --prefix /srv/repos/tools/directory-site-utils run check
```

Also:

- run the isolated Nginx candidate contract;
- run legacy rollback-compatibility checks;
- run the full eight-URL route/cache/canonical/sitemap contract;
- run the five-provider static-versus-settled-client parity contract;
- run mobile settled-browser checks for appraiser, methodology, correction,
  one provider, and location hub;
- run the Antique directory's applicable static/feed checks after the shared
  feed-generator change;
- run `node /srv/repos/env-governance/check-all.mjs` only if environment or
  runtime configuration changes.

Acceptance:

- All focused and full applicable checks pass.
- The sitemap still contains exactly the same eight canonical URLs unless a
  separately approved SEO decision says otherwise.
- Publication manifest, feeds, HTML, React view, schema, route registry, and
  sitemap agree.
- No unrelated dirty files from `/srv/repos/tools` enter the candidate.
- A frozen candidate hash and validation receipt exist before deployment.

Completion evidence:

- Frozen candidate artifact SHA-256:
  `9d4493e573cf2da753f3bb4325b1d6ab6fe9855d3e45e23a2a93a529cabad658`
- Validation manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/manifest.json`
- The sitemap remains the same eight-URL cohort with SHA-256
  `78b0117a927dbbd03355991b6c83b6182b23e31712a82f80f68c775edaf0c789`.
- Production, external QA, and Search Console remain unchanged.

### [x] ARTQA-007 Deploy through the standard static-release flow

Approval required because this changes production.

Work after approval:

- Re-check the active release immediately before promotion.
- Deploy the frozen candidate with the standard
  `art-appraisers-directory` static-release helper.
- Require the pre-activation, post-activation, rollback-compatibility, route,
  cache, feed, and settled-browser gates.
- Save the release receipt, candidate/source hash, deployment UTC, live asset
  identity, and prior-release pointer.
- Verify production from a fresh isolated browser session at desktop and both
  mobile viewports.

Acceptance:

- The promoted path and live `current` symlink agree.
- Every ARTQA-001 through ARTQA-006 acceptance criterion passes against
  production.
- Rollback remains possible without silently reactivating retired routes.
- No GSC mutation occurs during deployment.

Depends on: ARTQA-001 through ARTQA-006 and explicit deployment approval.

Completion evidence:

- Active release:
  `/mnt/srv-storage/art-appraisers-directory/releases/20260727114811-6adb6b2f630e`
- Release/source SHA-256:
  `6adb6b2f630e9c0fcc1e7fc791e53f477fe1a77459e8e5e08fd3b601e153d548`
- Release receipt:
  `/srv/manager/deploys/art-appraisers-directory/20260727114811/static-release-receipt.json`
- Fresh live contract:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/live/settled-browser-contract.json`
- The live contract passed eight HTTP routes, 23 policy probes, 19 hard
  loads, four transitions, six no-JavaScript checks, and 19 screenshots.
- Search Console was not mutated.

### [x] ARTQA-008 Rerun the external customer canary

The corrective release received one terminal external customer result.
Ticket `20c533c9-0bce-4b30-ad63-a230daccf593` submitted HTTP `201` receipt
`qa_0432f408-30b2-44d5-b136-31afd8a06c63` at
`2026-07-27T13:47:36.755Z`.

Work:

- Generate a new 24-hour customer-QA ticket after deployment.
- Keep the tester blind during the natural journey, then focus the acceptance
  phase on:
  - all five official-provider actions;
  - appraiser, methodology, and correction mobile layouts;
  - current navigation versus retired city routes;
  - branded `410` and unknown-provider `404` recovery;
  - Appraisily handoff and safe return.
- Require viewport screenshots for each previously failing surface when the
  tester supports screenshots.
- Preserve tool limitations as `not_proven`; do not turn unavailable zoom,
  JavaScript-disable, isolation, or exact Tab-order capabilities into product
  defects.

Acceptance:

- No `serious` or `blocking` `appraisily_defect` remains for the repaired
  surfaces.
- The tester can open at least two official provider websites and safely
  return.
- Mobile appraiser, methodology, and correction pages do not clip or overflow.
- Retired and unknown routes show the correct branded recovery with correct
  terminal status when network diagnostics are available.
- A new canonical HTTP `201` receipt is stored and linked from the
  implementation receipt.

Depends on: ARTQA-007.

Completion evidence:

- Result: `pass`, release recommendation `go_with_known_risk`, zero findings.
- All five provider profiles retained the dated official-provider action and
  matching image destination.
- Two official sites opened and Back safely restored the directory profiles.
- The mobile appraiser, methodology, correction, location, and provider
  surfaces had matching client/scroll widths and no clipping.
- The branded retired/unknown recovery, current navigation, and $59 Appraisily
  handoff passed.
- Network status, viewport screenshots, standard-browser separate-tab
  creation, and profile isolation were explicitly `not_proven` tool
  limitations, not product defects, as required by this contract.
- Canonical result:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-27/20c533c9-0bce-4b30-ad63-a230daccf593/result.json`
- Result SHA-256:
  `b5c146f0cbdcf94e9e2b657775edca3c9fbb329d7e14f32435e461d9a419b851`
- Receipt SHA-256:
  `52b2fc6e76f777cfc369f7f4c890fb2fc64dd4f3c8fb1e3990137bf46389af00`

## Phase 5 — Establish a valid GSC experiment

### [x] ARTQA-009 Create a new immutable release/request boundary

Approval required for Search Console mutation; creation of a source-only
manifest does not itself authorize submission.

The deterministic builder and regression test are part of `check:static`.
Before ARTQA-008 completed, a live rehearsal rejected the pending ticket and
wrote no files. After the accepted customer result, it created the immutable
manifest and empty ledger exactly once.

Work:

- Preserve the 2026-07-26 manifest unchanged as historical evidence.
- Create a new experiment manifest bound to:
  - the corrective Art release ID and source hash;
  - the unchanged or separately approved sitemap URL/hash;
  - the exact final eight-URL cohort;
  - the new external-QA receipt;
  - the new deployment UTC;
  - an empty hash-linked GSC request-receipt ledger.
- Recalculate Day 7, Day 14, and Day 28 from the actual corrective
  release/request boundary.
- Make checkpoint tooling reject the older release ID for the new experiment.

Acceptance:

- Manifest hash, live release, live sitemap, requested cohort, and QA receipt
  agree.
- The request ledger is empty before operator action.
- No old checkpoint is presented as a valid readout for the new release.

Depends on: ARTQA-008.

Completion evidence:

- Experiment:
  `art-directory-corrective-2026-07-27-20260727114811-6adb6b2f630e`
- Manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/experiment-manifest.json`
- Manifest SHA-256:
  `b4b024816155375cd2d95f0a9a32cd23fa6a5b56b8e2501531d7f2fc313c485a`
- Empty ledger:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/gsc-request-receipt-ledger.json`
- Empty-ledger SHA-256:
  `aa96893306f34b227fcaf3ef2c7229bd45e873be65eea1040f4368f381c4b7db`
- Boundary verification:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/gsc-boundary-verification.json`
- The active release, passing QA receipt, live sitemap bytes, exact eight live
  `200`/self-canonical/indexable URLs, checkpoint loader, and empty ledger all
  agree. Day 7/14/28 are `2026-08-03`, `2026-08-10`, and `2026-08-24`.
- Search Console mutation remains `not_started`.

### [~] ARTQA-010 Resubmit only the final sitemap and bounded cohort

Explicit GSC approval required.

Approval was received and the API-supported sitemap portion is complete.
Google accepted and downloaded the exact sitemap at
`2026-07-27T15:13:44Z`, reporting eight submitted URLs, zero errors, and zero
warnings. Fresh URL Inspection API reads succeeded for all eight approved URLs:
seven are crawled/not indexed and Wilson Art Services is discovered/not
indexed.

The remaining actions are UI-only. The VPS browser reached the direct URL
Inspection link but Google redirected it to account sign-in; there is no
authenticated Search Console browser profile or saved browser credential on
the host. Therefore zero “Request indexing” clicks were submitted, and Manual
Actions/Security Issues remain unchecked. These receipts must not be inferred
from the successful sitemap API response.

Work after approval:

- Use the exact URL-prefix property:
  `https://art-appraisers-directory.appraisily.com/`.
- Resubmit only:
  `https://art-appraisers-directory.appraisily.com/sitemap.xml`.
- Request indexing only for the exact eight final sitemap URLs.
- Save UTC UI receipts and quota outcomes in the new receipt ledger.
- Check Manual Actions and Security Issues once and save dated evidence.

Acceptance:

- GSC downloads the final sitemap with zero errors and warnings.
- Every requested URL is live `200`, indexable, self-canonical, present in the
  sitemap, and part of the corrective release.
- No retired, redirected, `404`, `410`, noindex, or unrelated-host URL is
  requested.

Depends on: ARTQA-009 and explicit GSC approval.

Current evidence:

- Sitemap execution receipt:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-execution-20260727/sitemap-submission-receipt.json`
- Pre-request inspection:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-execution-20260727/pre-request-url-inspection.json`
- Manifest-bound empty-ledger snapshot:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/gsc-request-receipt-ledger.genesis.json`
- Sitemap-successor ledger:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/gsc-request-receipt-ledger.sitemap.json`
- Current ledger requests: zero.

## Phase 6 — Closeout

### [x] ARTQA-011 Publish the implementation receipt and reconcile durable tasks

Work:

- Create
  `docs/art-directory-customer-qa-remediation-implementation-receipt-2026-07-27.md`.
- Record changed files, tests, candidate hash, release receipt, live browser
  evidence, external-QA receipt, and the new GSC manifest/ledger state.
- Update this checklist item by item; do not mark gated work complete early.
- Link the receipt from the durable agent todo.
- Reconcile or close the older Art-directory remediation todo only when its
  own acceptance contract is actually complete.

Acceptance:

- The task list, implementation receipt, release receipt, QA receipt, GSC
  manifest, and todo index point to one another.
- Source completion, production completion, external QA, GSC mutation, and
  elapsed measurement remain separately visible.

Completion evidence:

- Implementation receipt:
  `docs/art-directory-customer-qa-remediation-implementation-receipt-2026-07-27.md`
- Validation manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/manifest.json`
- Final read-only Claude review:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/claude-final-review/review.json`
- Claude returned `keep`. Codex independently accepted and implemented its two
  low-severity forward-looking builder findings, then reran focused tests,
  lint, and the full static contract.
- The remediation todo is closed; the separate GSC-mutation todo remains
  blocked on explicit approval and links the immutable manifest, empty ledger,
  and boundary verification.
- No GSC mutation or elapsed measurement is represented as complete.

## Required implementation order

1. ARTQA-000 — freeze evidence and hold GSC.
2. ARTQA-001 and ARTQA-002 — restore feed/client trust parity.
3. ARTQA-003 and ARTQA-004 — isolate fallback styles and test settled client
   navigation/layout.
4. ARTQA-005 — add branded `410` recovery.
5. ARTQA-006 — build and validate one frozen candidate.
6. ARTQA-007 — deploy only with explicit approval.
7. ARTQA-008 — obtain the fresh external customer receipt.
8. ARTQA-009 and ARTQA-010 — establish and execute the new GSC boundary only
   with explicit approval.
9. ARTQA-011 — close out the durable record.

## Claude second-opinion review

**Reviewed:** 2026-07-27
**Reviewer:** locally authenticated Claude Code 2.1.220,
`claude-fable-5`
**Mode:** read-only `Read`, `Glob`, and `Grep`; no web access, edits, session
persistence, deployment, or GSC mutation
**Claude verdict:** `approve_with_changes`
**Codex final verdict after independent verification:** approved for
implementation with all six Claude corrections incorporated below

The existing repository-root `AUDIT.md` and `TASKS.md` belong to the 2026-07-26
implementation audit. The installed `$consult-claude` workflow correctly
refused to overwrite them, so this plan review used the same read-only safety
posture with a scoped prompt and recorded its reconciled result here.

### Candidate dispositions

| Claude ID | Disposition | Final severity | Verified evidence | Plan change |
| --- | --- | --- | --- | --- |
| PLAN-001 | Accepted | Medium | `src/utils/publicUrls.ts` returns any scheme accepted by `new URL()`, and `StandardizedAppraiserPage.tsx` places the result in `href` | ARTQA-002 now requires a client-side `http:`/`https:` allowlist and unsafe-scheme fixtures |
| PLAN-002 | Accepted | Medium | `scripts/check-remediation-contract.mjs` requires repo/runtime Nginx byte parity; the current marker contract prevents config-only behavior changes against old artifacts | ARTQA-005 now includes the runtime Nginx file, activation boundary, and old/new artifact compatibility test |
| PLAN-003 | Accepted | Medium | `scripts/test-interactions.mjs` uses JSDOM without layout; only the shared `agent-browser` smoke can prove overflow | ARTQA-004 now separates JSDOM logic tests from a real-browser multi-route/multi-viewport matrix |
| PLAN-004 | Accepted | Low | `/srv/repos/tools/directory-site-utils/package.json` defines `check`, not `test` | Both invalid commands now use `npm ... run check` |
| PLAN-005 | Accepted | Low | Neither repo nor runtime Nginx config has `server_tokens off` | ARTQA-005 now explicitly suppresses the version and tests body/header output |
| PLAN-006 | Accepted | Low | `scripts/check-remediation-contract.mjs` can prove static/feed parity but cannot observe the settled React DOM | ARTQA-002 now defines separate static/feed and real-browser settled-DOM parity layers |

### Claude strengths retained

- The five documented root causes follow from the cited source and live
  artifacts.
- The task ordering is correct and no extra design, provider, city, or content
  expansion is needed.
- Static-first, HTTP `410`/`404`, privacy, deployment-approval, external-QA,
  and GSC-approval guardrails are appropriate.
- The GSC boundary must be recreated after the corrective release rather than
  rewriting the historical 2026-07-26 manifest.

### Consultation conclusion

The revised task list is sufficiently scoped and implementation-ready. Claude
did not identify a reason to block the plan after the six corrections above.
This is approval of the task list, not evidence that the implementation,
deployment, external canary, or GSC work is complete.
