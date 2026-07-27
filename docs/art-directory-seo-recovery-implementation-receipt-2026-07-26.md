# Art Directory SEO Recovery Implementation Receipt

**Implemented:** 2026-07-26  
**Scope:** source changes, immutable candidates, validation, coordinated production release, and GSC tooling  
**Production:** deployed and verified on 2026-07-26  
**Search Console:** not mutated

## Result

The implementation reduces the standalone Art directory to one reviewed,
internally consistent eight-URL cohort:

- homepage;
- Appraiser hub;
- Location hub;
- five reviewed provider profiles.

All five one-provider city shells were collapsed because none contained
independent, source-backed city decision value. The five retired city routes
and all twelve unverified provider aliases have explicit `410` outcomes in
the v2 route policy. Unknown and unpublished provider-shaped routes return a
branded `404` without a canonical. The previous v1 artifact keeps its previous
behavior under the staged configuration, so rollback does not accidentally
activate v2 semantics.

The Art host is the reviewed canonical home for the five retained providers.
The exact Sarah Ann Wilson duplicate on the Antique host is suppressed from
its sitemap and feed and has a one-hop redirect decision to the Art profile.

The coordinated production release is complete. Articles and Antique were
promoted before the Art route-policy candidate, then the scoped main-page
candidate was promoted through the required blue/green candidate QA gate.
No unrelated dirty main-page files were included.

## Frozen artifacts

| Surface | Baseline | Candidate/evidence | Result |
| --- | --- | --- | --- |
| Art directory | `20260725220154-4fdb51fa6ea6` | `/mnt/srv-storage/art-appraisers-directory/releases/20260726223104-8f2c57469025` | Deployed; 8 sitemap URLs; full public route/cache/browser contract passed |
| Articles | `20260726190341-db769e96b157` | `/mnt/srv-storage/appraisily-articles/releases/20260726220600-4bfc6db0650c` | Deployed; 3,661 articles; 3,198 hash-bound changes; public and corpus safety passed |
| Articles receipt | same baseline | `/srv/manager/seo/art-directory-recovery/candidates/articles-20260726-registry-remediation-receipt.json` | candidate tree hash and per-file before/after evidence recorded |
| Article batch | same baseline | `/srv/manager/seo/art-directory-recovery/candidates/articles-20260726-registry-remediation-batch-manifest.json` | isolation check passed for all 3,198 changed files |
| Antique directory | `20260725214801-2dc0aec35ce2` | `/mnt/srv-storage/antique-appraiser-directory/releases/20260726222142-2c80a77fc178` | Deployed; 418 sitemap URLs; 239 published providers; cross-host contracts passed |
| Main page | `prod-20260726191632-a92800b0b` | `prod-20260726223809-8a1bc612b` | Deployed from one-file dirty snapshot; build `52b921104d9710a16522`; candidate-bound desktop/mobile checkout QA passed |

The shared route registry is:

`/srv/repos/tools/directory-site-utils/references/art-route-registry.json`

Registry facts:

- registry SHA-256:
  `b1c7ffba32f253de9cbf6d7aeb66ad881c4d287641c6fca1bc1bb14af44603a2`;
- Art artifact SHA-256:
  `8f2c574690256863bb89e34bc6c4cd8f427c7d7dcf56ac79ab2905f830a23205`;
- sitemap SHA-256:
  `78b0117a927dbbd03355991b6c83b6182b23e31712a82f80f68c775edaf0c789`;
- allowed routes: 8.

## Implemented contracts

- A complete historical retirement ledger reconstructs all 397 unique
  historical URLs: 8 retained `200`, 17 reviewed `410`, and 372 unmatched
  `404`.
- Sitemap membership is generated only from reviewed provider and city
  decision manifests.
- Crawlable Art links on Articles, Antique, and main-page must be clean,
  canonical, and present in the one shared registry.
- Article generators fail closed on unrelated content and no longer fall back
  to broad Art-directory prompts.
- The existing article corpus was remediated from the active immutable release,
  not the dirty staging tree. The final candidate has 2,768 Art links across
  2,690 documents, with zero query strings, fragments, unregistered routes, or
  broken Art targets.
- HTML no-store policy is server-wide while hashed assets remain immutable.
- Essential mobile navigation remains visible at 390 px with JavaScript
  disabled.
- Static deployment now records pre-activation evidence and a final release
  receipt, and its promotion smoke is bound to the route registry.
- Legacy-artifact compatibility checks derive the expected route-policy
  version from the artifact marker, preserving v1 behavior on a v1 rollback
  while also allowing later v2-to-v2 promotions to prove that v2 behavior
  remains active.
- Search Console checkpoint tooling accepts a release experiment manifest,
  explicit date bounds, separate complete totals from query diagnostics, and
  cannot classify a partially inspected cohort as rejected.
- Provider audit output uses an isolated temporary directory and rejects
  symlink destinations.

## Verification

Passed:

- Art `npm run lint`;
- Art `npm run test:interactions`;
- Art `npm run check:static`;
- Art isolated Nginx candidate and legacy rollback compatibility;
- Articles candidate static release validation;
- Articles complete registry link scan;
- Article-agent related-guide contract tests, 6/6;
- all modified Articles and tool scripts parse with `node --check`;
- Search Console checkpoint fixtures, including a partial-inspection negative
  verdict guard;
- Antique complete static contract;
- Antique 418-URL indexing contract and cross-host truth audit;
- main-page typecheck and route-registry check;
- deploy-helper regression self-test.

Production proof:

- Articles release receipt:
  `/srv/manager/deploys/appraisily-articles/20260726220600/static-release-receipt.json`;
- Antique release receipt:
  `/srv/manager/deploys/antique-appraiser-directory/20260726222142/static-release-receipt.json`;
- Art release receipt:
  `/srv/manager/deploys/art-appraisers-directory/20260726223104/static-release-receipt.json`;
- main-page release manifest:
  `/srv/manager/deploys/main-page/prod-20260726223809-8a1bc612b/manifest.json`;
- main-page candidate QA receipt:
  `/srv/manager/deploys/main-page/prod-20260726223809-8a1bc612b/qa/attempt-1785105878908/qa-receipt.json`;
- live main-page build ID: `52b921104d9710a16522`;
- live `/art` emits only clean, registered Art-directory root links and no
  retired city links;
- live Articles scan: 2,768 Art links in 2,690 documents and zero deep
  unregistered Art links;
- live Wilson duplicate: one-hop `301` from Antique to the reviewed Art
  profile;
- final live Art contract: 8 sitemap URLs, 5 provider profiles, all 12
  reviewed aliases `410`, all 5 retired cities `410`, unknown provider/city
  `404`, direct `index.html` `404`, slashless provider one-hop `301`, and
  no-store/DYNAMIC edge behavior;
- JavaScript mobile navigation passed; no-JavaScript DOM/layout navigation
  passed. Its screenshot capture timed out and is advisory because the
  blocking visibility and layout assertions passed.

Two pre-promotion Art/Antique smoke attempts rolled back safely while the
shared smoke was corrected to observe the actual Cloudflare cache-policy
headers. A later Art no-JavaScript screenshot timeout also rolled back safely
until screenshot capture was made advisory while DOM/layout checks remained
blocking. The final releases and regression self-test all passed.

The immutable post-remediation observation boundary is:

- manifest:
  `/srv/manager/seo/art-directory-recovery/2026-07-26-remediation-release/experiment-manifest.json`;
- manifest SHA-256:
  `6682a5e5ea9988cd0c9b4bd696a8af56ce91ffda936125babcd9ac14cef71e08`;
- boundary: `2026-07-26T22:55:08Z`;
- cohort: the exact 8 live sitemap URLs;
- Day 7 / Day 14 / Day 28: 2026-08-02 / 2026-08-09 / 2026-08-23.

The manifest-driven checkpoint dry run passed and requires full-cohort
post-release evaluation before a negative or consolidation verdict.

The first deploy attempt was blocked safely by the root-disk threshold.
Instead of deleting active work, 187 old `/srv/temp/main-agent` directories
from before 2026-07-18 were archived to
`/mnt/srv-storage/temp-archives/srv-temp-main-agent-pre-20260718`. The root
filesystem finished below the deploy stop threshold with approximately 29 GiB
free.

Main-page verification also exposed that the canonical `/art` route currently
renders `ArtAppraiserProofV4`, not the scoped `ArtAppraiserPainLedV3` file.
The live route was already safe, so the deployed `PainLedV3` edit is dormant
pre-emption and has no current UI effect. The source-only registry validator
was corrected after promotion to inspect the actual Googlebot-visible
`art.html` shell and shared chrome, while still checking the dormant component
for future safety. That validator correction passed and does not require a
runtime redeploy.

Known unrelated baseline:

- Antique's standalone TypeScript compile still reports pre-existing failures
  in untouched components including `AnalyticsTracker`, `CitySearch`,
  `DecisionRouter`, `Navbar`, `posthog`, and `StandardizedAppraiserPage`.
  Antique's production static artifact contract passes. These unrelated
  failures were not modified or hidden by this implementation.

## Intentionally gated work

The following are not implementation omissions:

- sitemap resubmission and bounded indexing requests require explicit Search
  Console approval;
- Day-7, Day-14, and Day-28 observations require a real release/request
  boundary and elapsed time;
- consolidation remains dormant unless Google fully evaluates the released
  cohort, recovery remains zero, and a separate architecture/deployment
  decision is approved.

## Claude second look

After implementation, Claude Code reviewed a sanitized 4.1 MB, 40-file packet
covering the plan, implementation receipt, policy manifests, Nginx routing,
registry, generators, Search Console tooling, release smoke, and validation
contracts. Claude had read-only `Read`, `Glob`, and `Grep` access.

Claude returned seven candidates and no critical finding. Codex independently
verified every candidate:

- accepted four low-severity hardening tasks;
- rejected three candidates as an explicit rollback-compatibility tradeoff, an
  intentional VPS-only path contract, and a hypothetical condition already
  excluded by publication/route gates;
- concluded `iterate`, not `block`.

The accepted hardening items affect future reruns, not the frozen recovery
candidates:

1. scope the Articles list-removal regex to the matched list;
2. make the Articles transformer preflight all conflicts before mutation or
   always emit a partial-run receipt;
3. add atomic writes and baseline hashes to the Antique transformer;
4. replace legacy related-guide blocks during `--refresh` instead of appending.

Candidate-integrity checks performed during verification:

- zero vulnerable Articles documents across all 13,638 baseline HTML files for
  the list-removal edge case;
- Antique-host links increased from 12,747 in the baseline to 14,019 in the
  frozen candidate;
- the completed Articles receipt and full registry scan remain valid;
- duplicate related-guide headings sampled in the candidate were already
  present in the immutable baseline and were not introduced by this Art-link
  remediation.

Durable reports:

- `/srv/repos/frontends/art-appraiser-directory-frontend/AUDIT.md`
- `/srv/repos/frontends/art-appraiser-directory-frontend/TASKS.md`

Structured review:

- `/srv/temp/consult-claude/2026-07-26T19-35-28-719Z-5e41b73c/VERIFIED_AUDIT.json`
