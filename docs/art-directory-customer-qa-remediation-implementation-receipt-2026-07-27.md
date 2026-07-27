# Art Directory Customer-QA Remediation Implementation Receipt

**Started:** 2026-07-27
**Implementation contract:**
`docs/art-directory-customer-qa-remediation-task-list-2026-07-27.md`
**Source branch:** `codex/art-directory-audit-remediation-20260718`
**Source HEAD before implementation:** `aa4ebbef38e24f16886744293ef1610c3ae564c4`

## Status

Source implementation, frozen-candidate validation, production deployment,
fresh production browser verification, external customer QA, and the immutable
GSC experiment boundary are complete through ARTQA-009. ARTQA-010 was approved:
the exact sitemap has been submitted and downloaded successfully, while the
eight UI-only indexing requests and GSC safety checks remain pending browser
authentication. Elapsed measurement has not started.

## ARTQA-000 pre-change boundary

Captured before source mutation:

- Active Art release:
  `/mnt/srv-storage/art-appraisers-directory/releases/20260727080054-c54bd5d9fceb`
- Active release symlink:
  `/srv/apps/art-appraisers-directory/releases/current`
- Active source hash:
  `c54bd5d9fceb805fd2fbc7a7159144d1350a0f16c2e0916d6f2b935a2b0260ae`
- Live sitemap SHA-256:
  `78b0117a927dbbd03355991b6c83b6182b23e31712a82f80f68c775edaf0c789`
- External customer-QA run:
  `eea47cf8-c5fe-4b5d-88ad-1e2a9b1fd2e6`
- External customer-QA receipt:
  `qa_b655ef97-1d65-4a3e-95ee-dac5f3a5ae99`
- Canonical result:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-27/eea47cf8-c5fe-4b5d-88ad-1e2a9b1fd2e6/result.json`
- Result status and recommendation: `fail` / `go_with_known_risk`
- Result SHA-256:
  `708a38331f00ae39de14bdf3b2f5259e6aa7c4e3ac7955c0a360f35df1c367a4`
- Receipt SHA-256:
  `b91509bd59cb6216a02a7b277837774ee0271ce53b30ae3132c1c00c286e87e4`
- Historical experiment manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-26-remediation-release/experiment-manifest.json`
- Historical GSC receipt ledger:
  `/srv/manager/seo/art-directory-recovery/2026-07-26-remediation-release/gsc-request-receipt-ledger.json`

The 2026-07-26 experiment remains historical and is not rewritten for this
repair. The durable GSC task remains blocked on this remediation. No production,
provider, sitemap, route, or Search Console mutation occurred during baseline
capture.

## Pre-change defect matrix

| ID | Surface | Pre-change evidence |
| --- | --- | --- |
| QA-01 | Five provider profiles | Static HTML and JSON-LD contain the reviewed `sameAs` destination, but `public_site/appraisers.json` contains no `website` or `source.verifiedAt`, so the settled React view loses the official source |
| QA-02 | `/appraiser/` | Unscoped inline fallback selectors remain active after `#root` is replaced |
| QA-03 | `/get-listed/` | Unscoped inline fallback selectors remain active after `#root` is replaced |
| QA-04 | `/methodology/` | Unscoped inline fallback selectors remain active after `#root` is replaced |
| QA-05 | Retired city routes | Nginx returns terminal `410` with no city-specific branded recovery document |

## Source implementation

Completed for ARTQA-001 through ARTQA-005:

- The shared directory feed generator now exports one safe, normalized public
  `website` plus the public review date in `source.verifiedAt`. Verified Art
  profiles fail closed when either value is missing.
- The five reviewed profiles expose the same official source and
  `dateModified` in static schema and feed data. The client re-sanitizes URLs,
  renders one explicit “Official website” action, and shows the review context
  after React mounts.
- Unsafe schemes, credential-bearing URLs, malformed values, and directory
  self-links are rejected at both build and client boundaries.
- Static fallback roots and selectors are scoped so their layout rules stop
  matching the mounted React application. The repair script is idempotent and
  the static contract inventories every module-plus-inline-style page.
- The shared browser smoke now supports a settled multi-route,
  multi-viewport matrix, client transitions, no-JavaScript checks, retired-link
  scans, mobile-overflow checks, source parity, console errors, and failed
  first-party requests.
- A branded, noindex `410` recovery document preserves terminal `410`
  semantics and provides current-directory and Appraisily recovery actions.
  Repo and runtime Nginx configurations are byte-identical, suppress version
  disclosure, and remain compatible with the current pre-fix artifact.

Primary source and contract files:

- `src/pages/StandardizedAppraiserPage.tsx`
- `src/utils/publicUrls.ts`
- `scripts/apply-recovery-reviewed-cohort.mjs`
- `scripts/check-remediation-contract.mjs`
- `scripts/scope-static-fallback-pages.mjs`
- `scripts/test-nginx-recovery-contract.mjs`
- `scripts/test-settled-browser-contract.mjs`
- `scripts/fixtures/customer-qa-browser-matrix.json`
- `scripts/fixtures/interaction-test-entry.tsx`
- `public_site/410.html`
- `nginx.conf`
- `/srv/repos/tools/directory-site-utils/build-directory-llm-feeds.mjs`
- `/srv/repos/tools/directory-site-utils/tests/directory-llm-feeds.test.mjs`
- `/srv/repos/tools/smoke/directory-static-contract.mjs`
- `/srv/repos/tools/smoke/tests/directory-static-contract.test.mjs`
- `/srv/infrastructure/vps-infra/compose/appraisily/runtime/docker-compose/art-appraisers-directory/nginx.conf`

Generated candidate changes include the three public feeds, the five verified
profile documents, scoped fallback documents, reviewed client bundles, and
entry-asset references throughout the static artifact. No provider or
indexable-URL cohort was added.

## Candidate validation

Completed for ARTQA-006.

- Frozen candidate artifact SHA-256:
  `9d4493e573cf2da753f3bb4325b1d6ab6fe9855d3e45e23a2a93a529cabad658`
- Route-registry SHA-256:
  `248d7570592e1daafb0f00c9c52e5c0f2d1562cf5e3d067036a964f60d1f74b4`
- Sitemap: unchanged eight URLs, SHA-256
  `78b0117a927dbbd03355991b6c83b6182b23e31712a82f80f68c775edaf0c789`
- Repo/runtime Nginx SHA-256:
  `6325d9ccfd3339a71aae1f6ccf9c1334eda061510cac1e9cad1666e7b04816d5`
- Reviewed JavaScript bundle SHA-256:
  `8bc48fe7548797d6b9c32b877a0a5220678f58217e59c51a5b188c5c4f585d77`
- Reviewed CSS bundle SHA-256:
  `c911b511213e4b875b8e720764095830987329d6af94b8bf47071c34d2a31191`

Durable validation manifest:

`/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/manifest.json`

Manifest SHA-256:

`2640a99d44837a415afac25f6753f675a7199cef69f8b0d1b09fe8d5c01e9aa1`

Green validation:

- Art lint and the full Art static contract.
- Shared directory utility syntax and regression suite, including safe-source
  feed fixtures.
- Two isolated Art feed regenerations retained all five website and review-date
  values byte-for-value after removing only the documented generation
  timestamp. Receipt:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/feed-idempotence.json`.
- Shared browser smoke regression fixtures that reproduce official-link loss,
  CSS overflow, and unsettled fallback failures.
- Antique directory full static contract plus an isolated feed-regeneration
  compatibility check; its provider/location cohort was unchanged.
- Isolated Nginx checks against both the current pre-fix release and the
  corrective candidate: ten retired slash/slashless responses stayed `410`;
  direct index and unknown routes stayed `404`; provider aliases stayed `410`;
  the server header exposed no version.
- Settled browser contract: 19 hard loads, four client transitions, six
  no-JavaScript checks, and 19 viewport screenshots at `390x844`, `375x812`,
  and `1440x900`. All five provider sources were checked; there was no mobile
  overflow, retired navigation, serious console error, or failed first-party
  request. The receipt also proves each visible provider image's actual `href`
  and safety attributes, its review context, and the complete attributed
  Appraisily `/start` handoff. The wrapper uses a per-run browser socket
  directory so concurrent VPS sessions cannot corrupt this gate.
- Environment governance exited successfully for the Art frontend and active
  Art service. Its receipt also records pre-existing warnings from unrelated
  archived candidate environment directories; those warnings did not enter
  this candidate.

Browser receipt:

`/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/settled-browser-contract.json`

Browser receipt SHA-256:

`6660c27ec089ee1bb184604c80b34a0e509fc511deabef61512ea9b2b8e4eb23`

## Pre-release requirement audit

This audit covers only ARTQA-000 through ARTQA-006. It does not close or weaken
the production, external-QA, GSC, or final-reconciliation gates.

| Item | Result | Authoritative proof |
| --- | --- | --- |
| ARTQA-000 | Complete | The pre-change release, source, sitemap, external-QA result/receipt hashes, historical GSC boundary, and no-mutation state are recorded above |
| ARTQA-001 | Complete | Full static contract, shared feed tests, five-record feed output, and `feed-idempotence.json` prove safe source extraction, public review dates, fail-closed fixtures, and two-pass stability |
| ARTQA-002 | Complete | Static/feed/schema parity plus the settled-browser receipt prove exactly one safe official action, the image's actual matching destination, visible review context, and the attributed Appraisily handoff for every reviewed provider |
| ARTQA-003 | Complete | The static selector inventory and settled/no-JavaScript browser matrix prove scoped fallback CSS, readable H1/introduction flow, and zero horizontal overflow for appraiser, methodology, and correction pages at both mobile widths and desktop |
| ARTQA-004 | Complete | The browser receipt proves 19 hard loads, four client transitions, six no-JavaScript checks, no retired navigation, no serious console errors, and no failed first-party requests; the self-test proves official-link loss, image drift, handoff drift, overflow, and unsettled fallback fixtures fail closed |
| ARTQA-005 | Complete | `nginx-recovery-contract.json` proves old/new artifact compatibility, ten retired slash/slashless `410` responses, branded recovery, unknown/direct-index `404`, alias `410`, no canonical/version exposure, and repo/runtime config parity |
| ARTQA-006 | Complete | The validation manifest binds the full check packet to candidate `9d4493e573cf2da753f3bb4325b1d6ab6fe9855d3e45e23a2a93a529cabad658` and the unchanged eight-URL sitemap |

## Production release

ARTQA-007 is complete.

- Active release:
  `/mnt/srv-storage/art-appraisers-directory/releases/20260727114811-6adb6b2f630e`
- Release/source SHA-256:
  `6adb6b2f630e9c0fcc1e7fc791e53f477fe1a77459e8e5e08fd3b601e153d548`
- Previous release:
  `/mnt/srv-storage/art-appraisers-directory/releases/20260727080054-c54bd5d9fceb`
- Release receipt:
  `/srv/manager/deploys/art-appraisers-directory/20260727114811/static-release-receipt.json`
- Release-receipt SHA-256:
  `523d27520b0e2edff23eb4d3a6ad0455e4fdff64df51d82c3d03999ac209e096`
- Release-bound route registry:
  `/srv/manager/deploys/art-appraisers-directory/20260727114811/route-registry.json`
- Release-bound registry SHA-256:
  `3f78364134cd96b96051e9c0db9a629d7488cf926c3bac748920d3873db50782`
- Live browser/HTTP receipt:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/live/settled-browser-contract.json`
- Live receipt SHA-256:
  `8eeef7b3219a21d1c47fa2c192b2088632e36f4a29046021f57789f19d7147b1`

The fresh production contract passed the eight canonical HTTP routes, all 23
route-policy probes, 19 hard loads, four client transitions, six no-JavaScript
checks, and 19 screenshots. It re-proved the five reviewed provider
destinations, image destinations, review context, attributed Appraisily
handoffs, mobile/desktop layout, and console/network boundaries.

The current source artifact hash is `9d4493e5…`, while the deployed release is
`6adb6b2f…`. A byte-level comparison proves the only differences are removal
of trailing whitespace and addition of a final newline in
`get-listed/index.html` and `methodology/index.html`; there is no behavior,
asset, feed, route, sitemap, or Nginx difference.

## External customer QA

ARTQA-008 is complete.

- Run ID: `20c533c9-0bce-4b30-ad63-a230daccf593`
- Prompt hash:
  `9daa91b0cbce46bf19e5c98420fa8eee43db98a7d2e0291b982ee2a33a3a3d1c`
- Submitted: `2026-07-27T13:47:36.755Z`
- HTTP status: `201`
- Receipt ID: `qa_0432f408-30b2-44d5-b136-31afd8a06c63`
- Result: `pass`
- Release recommendation: `go_with_known_risk`
- Findings: zero
- Ticket manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/external-qa/manifest.json`
- Executable prompt:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/external-qa/customer-qa-prompt.md`

The compact version-2 ticket was issued once, its returned prompt hash matched
the exact placeholder prompt, and its token length/format and endpoint/run-ID
bindings passed the generator contract. The canonical result and receipt are:

- Result:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-27/20c533c9-0bce-4b30-ad63-a230daccf593/result.json`
- Result SHA-256:
  `b5c146f0cbdcf94e9e2b657775edca3c9fbb329d7e14f32435e461d9a419b851`
- Receipt:
  `/mnt/srv-storage/storage/private/ops/customer-tests/submissions/2026-07-27/20c533c9-0bce-4b30-ad63-a230daccf593/receipt.json`
- Receipt SHA-256:
  `52b2fc6e76f777cfc369f7f4c890fb2fc64dd4f3c8fb1e3990137bf46389af00`

The tester verified all five official-provider destinations and review dates,
opened and returned from two provider sites, found no mobile overflow on the
five required surfaces, confirmed current navigation and branded recovery,
and completed the $59 Appraisily handoff/Back journey without entering data.
The reported limitations concern unavailable network status, screenshots,
standard-browser tab creation, and anonymous-profile proof. They are
`not_proven` coverage—not Appraisily defects—and the result contains no
findings.

## Search Console boundary

ARTQA-009 is complete. ARTQA-010 approval was received and its API-supported
sitemap action is complete; its UI-only actions remain authentication-gated.

- Builder:
  `scripts/build-corrective-gsc-boundary.mjs`
- Regression contract:
  `scripts/test-corrective-gsc-boundary.mjs`
- Durable preparation receipt:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/gsc-boundary-preparation.json`
- Preparation receipt SHA-256:
  `8ac0d9a83c8e60a9942ffd8e7dd73bdf9dd70a48b36da18da39ec3e6795b6d78`

The builder binds the verified corrective release, its release-bound route
registry, the unchanged eight-URL sitemap, and the new external-QA result. It
created an empty request ledger whose predecessor is the unchanged historical
ledger, recalculated the Day 7/14/28 checkpoints from the corrective release
boundary, and used exclusive file creation so an existing boundary cannot be
silently overwritten.

The focused regression suite proves deterministic output, exact cohort parity,
an empty pre-mutation ledger, the hash chain, date recalculation, and rejection
of both pending QA and an older release ID. The full repository static contract
passed with this test included. A pre-result rehearsal failed closed and
created no output; the accepted result then produced:

- Experiment:
  `art-directory-corrective-2026-07-27-20260727114811-6adb6b2f630e`
- Manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/experiment-manifest.json`
- Manifest SHA-256:
  `b4b024816155375cd2d95f0a9a32cd23fa6a5b56b8e2501531d7f2fc313c485a`
- Manifest-bound empty-ledger snapshot:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/gsc-request-receipt-ledger.genesis.json`
- Genesis SHA-256:
  `aa96893306f34b227fcaf3ef2c7229bd45e873be65eea1040f4368f381c4b7db`
- Boundary verification:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/validation/gsc-boundary-verification.json`
- Boundary-verification SHA-256:
  `3b9063e9447e871c9a90611c1165a73d7dc4ebb593fdb23b953ec62ee1d0b63a`

The active release, live sitemap hash, exact eight live
`200`/self-canonical/indexable URLs, external-QA hashes, checkpoint loader, and
empty ledger all agree. Checkpoints are Day 7 `2026-08-03`, Day 14
`2026-08-10`, and Day 28 `2026-08-24`. At boundary creation, no Search Console
API, indexing, sitemap-submission, or browser mutation had occurred.

The 2026-07-26 manifest and ledger remain historical and unchanged. The new
corrective boundary is now immutable; only a separately approved receipt-ledger
update may record later Search Console actions.

### ARTQA-010 execution status

The user explicitly approved the exact Art sitemap and eight-URL cohort.
Preflight re-proved the manifest hash, empty-ledger hash, active release, live
sitemap hash, and eight-URL cohort before mutation.

Completed:

- Submitted only
  `https://art-appraisers-directory.appraisily.com/sitemap.xml` to the exact
  URL-prefix property
  `https://art-appraisers-directory.appraisily.com/`.
- Google accepted it at `2026-07-27T15:13:44.052Z` and downloaded it at
  `2026-07-27T15:13:44.860Z`.
- GSC reports eight submitted URLs, zero errors, zero warnings, and zero
  indexed URLs at this immediate read.
- Fresh URL Inspection API reads succeeded for all eight approved URLs:
  seven `Crawled - currently not indexed`, one
  `Discovered - currently not indexed`, zero failures.

Pending:

- Eight UI-only “Request indexing” actions.
- Manual Actions and Security Issues checks.

The available isolated VPS browser followed Google's direct inspection link but
was redirected to `accounts.google.com`; no authenticated GSC browser profile
or saved browser credential exists on the VPS. No indexing receipt was
fabricated and zero URLs were represented as requested.

Evidence:

- Sitemap receipt:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-execution-20260727/sitemap-submission-receipt.json`
- Receipt SHA-256:
  `e81cefa25148c000f81116aacba491a3ddba4d6eb172ec128355cc70b62de033`
- Pre-request inspection:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-execution-20260727/pre-request-url-inspection.json`
- Sign-in evidence:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-execution-20260727/gsc-sign-in-blocker.png`
- Sitemap-successor ledger:
  `/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/gsc-boundary/gsc-request-receipt-ledger.sitemap.json`
- Sitemap-successor SHA-256:
  `de0ebb07d7448b62a1e41bf228d1651cd0bd002180d572431f7eb51e3bd88dd3`

The immutable manifest's `createdAt` is the corrective release verification
timestamp because the builder version used for this one-time creation defaulted
that field to `releaseBoundary`. It therefore predates the accepted QA receipt.
The actual order is independently proven by the QA receipt at
`2026-07-27T13:47:36.755Z` and boundary verification at
`2026-07-27T14:10:51Z`; the manifest was not rewritten. The builder now
requires an explicit creation UTC at or after the accepted QA timestamp for
all future boundaries.

## Claude final implementation review

The promised second look ran locally through Claude Code 2.1.220 using
`claude-fable-5`, read-only `Read`, `Glob`, and `Grep`, plan permission mode,
strict empty MCP configuration, and no session persistence. The historical
repository-root `AUDIT.md` and `TASKS.md` were preserved, so the scoped final
review is stored at:

`/srv/manager/seo/art-directory-recovery/2026-07-27-customer-qa-remediation/claude-final-review/review.json`

Review SHA-256:

`f87f82f3608276babc1328fb4cd4fc42621a03eeda8695c61110dc36e79a8f4b`

Claude's decision was `keep`. It independently confirmed ARTQA-000 through
ARTQA-009, the honest treatment of external-QA limitations, the corrective
release and exact sitemap binding, the hash-chained empty ledger, and the
absence of Search Console mutation.

Claude raised two low-severity forward-looking builder observations. Codex
accepted both after inspecting the cited source and artifacts:

1. The builder previously required a terminal submission and recorded
   acceptance, but did not independently require `testStatus: pass` and zero
   serious/blocking Appraisily defects.
2. The builder previously defaulted `createdAt` to the release verification
   timestamp.

The builder now fails closed unless the QA test passed with zero serious and
blocking defects, records submission and test statuses separately, requires an
explicit creation timestamp, and rejects a timestamp earlier than the accepted
QA receipt. Regression fixtures cover each failure. Builder SHA-256:
`5cf0977c304839f69888dc049347c8fbf0ed42c3643030b92c9fea4da5168b7a`;
test SHA-256:
`7ba196dc964c6c8d36831f9296087acc329e08f4b384877c8f8f8f3691a29c8e`.
Focused tests, lint, and the full static contract passed after these changes.

## Durable task reconciliation

ARTQA-000 through ARTQA-009 and ARTQA-011 are complete. ARTQA-010 is partially
complete: approval and sitemap submission are recorded, while its UI-only
indexing/safety checks remain blocked on authenticated GSC browser access. The
separate GSC todo remains blocked and points to the manifest, ledger chain,
execution receipt, and this receipt. Elapsed measurement remains not started.
