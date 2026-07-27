# Claude audit with Codex verification

Claude found no critical release blocker. Codex accepted four low-severity hardening findings in mutation and legacy-refresh scripts, but verified that none corrupted the frozen recovery candidates. Three candidates were rejected because they describe an explicit rollback-compatibility policy, an intentional VPS-only path contract, or a hypothetical link residue already excluded from the indexable cohort and guarded by route validation.

- Overall decision: **iterate**.

## Scope

Mode is a whole-repo snapshot at head 2243aee4 with no base commit and an empty patch, so new work cannot be distinguished from pre-existing code; severity was calibrated assuming the staged scripts and configs are the change under review (consistent with the 2026-07-26 implementation receipt). Production is stated as not deployed, so all mutation scripts operate on staging candidates, capping realistic impact at data-integrity of candidates and post-promotion SEO behavior. I fully reviewed the highest-risk executable surfaces (remediation/injection scripts, both nginx configs, static-release promotion, indexing-manifest builder, GSC checkpoint, smoke contract, link checkers, route registry) and spot-checked the two large TSX pages for Art-directory link targets (both link only to registered hub routes). Large evidence/data files and the deploy self-test harness were not line-by-line reviewed.

- Mode: `repo`
- Scope: `tracked repository`
- Reviewed files: 18

## Findings

### CC-001 — Unbounded regex lookahead can delete Antique-directory link lists during Articles Art-link remediation

- Claude: **medium** severity, **medium** confidence, `data_loss`.
- Codex: **accepted**, final severity **low**.
- Location: `repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs:91`.
- Candidate evidence: The replacement pattern matches '<p>If you want an in-person inspection...</p>\s*<ul>' followed by a lookahead '(?=[\s\S]*?art-appraisers-directory\.appraisily\.com\/location\/)' and then '[\s\S]*?<\/ul>'. The lookahead asserts an Art location link exists anywhere later in the document, not inside the matched <ul>. Because line 128 only processes files that contain 'art-appraisers-directory.appraisily.com' somewhere, the assertion is satisfiable by an unrelated link elsewhere on the page, so a directory list containing only antique-appraiser-directory city links is still replaced by the single Art location-hub paragraph, removing the Antique links. The non-greedy '[\s\S]*?<\/ul>' also truncates at the first '</ul>' if the list nests sublists.
- Impact: Legitimate Antique-directory city links (and any other list content) are silently deleted from remediated articles, reducing internal linking to the Antique host that the recovery plan explicitly preserves; the per-file receipt records only Art-link counts, so the loss is not surfaced.
- Reproduction: Inference-based: construct an article index.html containing the exact intro paragraph followed by a <ul> whose items link only to antique-appraiser-directory.appraisily.com city pages, plus a single art-appraisers-directory.appraisily.com/location/ link later in the body; run the script with --write against a matching baseline; the <ul> is replaced by the Art-hub paragraph.
- Proposed test: Fixture unit test on transform(): given HTML with the intro paragraph, an antique-only <ul>, and an Art link elsewhere, assert the antique links survive; given a <ul> that does contain an Art city link, assert it is replaced.
- Recommendation: Match the <ul> content into a capture group and perform the Art-link check inside a replacer callback on the captured list content (returning the original match when the list has no Art links), instead of using a document-wide lookahead.
- Codex rationale: The document-wide lookahead is structurally unsafe, but a scan of all 13,638 baseline HTML files found zero documents with an antique-only matched list and a later Art location link. The frozen candidate therefore shows no evidence of this deletion; total Antique-host links increased from 12,747 to 14,019. Accept as future transformer hardening, downgraded from medium.
- Verification evidence: The regex lookahead is outside the captured ul content.; Active baseline vulnerableCount=0 across 13,638 index.html files.; Antique-host link count baseline=12,747 and candidate=14,019.
- Verification commands: `rg -n If.you.want.an.in-person.inspection repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs`; `node baseline corpus scan for antique-only list plus later Art link`; `rg -o antique-appraiser-directory links in baseline and candidate`
- Assumptions: Some existing articles have the intro paragraph followed by lists that mix or exclusively contain Antique city links; the 977-line receipt JSON suggests wide application but I could not verify affected pages from the staged bundle.

### CC-002 — Articles remediation aborts mid-run on unregistered route, leaving partially rewritten candidate with no receipt

- Claude: **medium** severity, **high** confidence, `correctness`.
- Codex: **accepted**, final severity **low**.
- Location: `repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs:117`.
- Candidate evidence: canonicalTarget() (lines 53-58) throws for any Art href that is neither registered nor a /location/<city> path. The throw propagates out of transform() at line 147 inside the top-level per-file loop, which has no try/catch; with --write, files processed earlier in the loop have already been renamed into place (lines 156-160), and the receipt is only written after the loop completes (lines 176-179).
- Impact: A single unexpected Art URL (e.g. /appraiser/<retired-alias>/?utm=...) aborts the run after an arbitrary prefix of the tree has been rewritten, producing a candidate that is partially remediated with no receipt or change ledger, undermining the hash-bound evidence model the pipeline depends on.
- Reproduction: Inference-based: place an href to https://art-appraisers-directory.appraisily.com/appraiser/some-unknown-slug/ in one article that sorts after another remediable article; run with --write; the process exits non-zero with the first article rewritten and no receipt file emitted.
- Proposed test: Integration test over a temp public dir with two files — one remediable, one containing an unregistered /appraiser/ Art link — asserting either no files are modified or a receipt/conflict record is emitted covering the modified file.
- Recommendation: Treat unregistered routes as conflict records (like the existing baseline-mismatch path) and skip the file, or run transform over all files first and only write after the whole tree validates; always emit the receipt in a finally block.
- Codex rationale: The script can throw from canonicalTarget after earlier files have been atomically replaced and before the receipt is written. The current frozen run completed with its receipt and full validator, so this is a rerun/process-integrity hardening task rather than damage to the candidate.
- Verification evidence: canonicalTarget throws on unregistered non-city routes.; Writes occur in the per-file loop at lines 158-159.; Receipt is emitted only after the loop at lines 163-179.; The current candidate receipt exists and the complete link scan passed.
- Verification commands: `rg -n function.canonicalTarget.for.*filename.writeFile.rename.receipt repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs`; `node check-art-directory-recovery-links.mjs --public-dir frozen-candidate`
- Assumptions: The script is intended to be re-runnable against an immutable baseline, so recovery is possible, but the evidence gap between tree state and receipt is still a process-integrity defect.

### CC-003 — Antique-side remediation lacks the atomic-write and baseline-conflict safeguards of its Articles counterpart

- Claude: **low** severity, **high** confidence, `data_loss`.
- Codex: **accepted**, final severity **low**.
- Location: `repos/frontends/antique-appraiser-directory-frontend/scripts/remediate-art-directory-links.mjs:39`.
- Candidate evidence: Files are rewritten with a direct 'await fs.writeFile(filename, after, "utf8")' (line 65) — no temp-file+rename — and there is no comparison against an immutable baseline release before mutating, unlike repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs which stages via a .tmp rename (lines 156-160) and refuses files whose sha256 differs from the active baseline (lines 130-146). The receipt is also merge-accumulated across runs (lines 68-90), so beforeSha256 provenance depends on the first run's tree state.
- Impact: A crash or concurrent writer can leave truncated/partially written HTML in the Antique public_site staging tree, and edits made to a dirty tree are recorded as if remediated from a clean state, weakening the before/after evidence chain the recovery receipt relies on.
- Reproduction: Inference-based: interrupt the process (SIGKILL) during the write loop on a large public_site; fs.writeFile is not atomic, so an interrupted file may be empty or partial while the receipt (written later) records nothing.
- Proposed test: Unit test that stubs fs.writeFile to fail on the second file and asserts no file is left partially written (i.e., writes go through a temp+rename helper), plus a test asserting the script refuses to modify a file whose hash differs from a supplied baseline.
- Recommendation: Reuse the Articles pattern: write to a sibling temp file and rename, and add an optional --baseline-dir hash gate; smallest fix is the temp+rename change.
- Codex rationale: The Antique transformer writes directly and does not bind inputs to an immutable baseline. Its completed current receipt and passing static contracts show no present corruption, but it should use detached atomic writes and a baseline hash gate before future reuse.
- Verification evidence: Direct fs.writeFile occurs inside the mutation loop.; No baseline-dir or pre-write baseline hash check exists.; Antique static, indexing, and Art-link contracts passed after the completed run.
- Verification commands: `rg -n writeFile.rename.baseline.beforeSha256.receipt repos/frontends/antique-appraiser-directory-frontend/scripts/remediate-art-directory-links.mjs`; `npm --prefix antique-appraiser-directory-frontend run check:static`
- Assumptions: The Antique tree being remediated is the 'current public_site staging candidate' named in the receipt, not an immutable release, making dirty-tree drift plausible.

### CC-004 — inject-related-guides --refresh inserts a duplicate section when only a legacy-format related-guides block exists

- Claude: **low** severity, **medium** confidence, `correctness`.
- Codex: **accepted**, final severity **low**.
- Location: `repos/agents/article-agent/scripts/inject-related-guides.mjs:489`.
- Candidate evidence: The skip gate (lines 388-399) recognizes legacy blocks via hasLegacyRelatedGuides() (patterns include id="related-guides-section" and bare <h2>Related Guides</h2>, lines 304-313), but replacement position comes from relatedSectionMatch() (line 336-339), which only matches sections carrying 'article-related' classes or data-related-* attributes. For a page with only a legacy block, --refresh bypasses the skip, existingRelated is null, so the code falls into the anchor-insertion branch (lines 492-497) and adds a new related-guides section while the legacy block remains in the document.
- Impact: Refreshed articles can ship two 'Related guides' sections (duplicate H2s, duplicate data-analytics impression modules), degrading page quality and analytics accuracy; downstream validators that count related sections or targets may then flag or miscount the page.
- Reproduction: Inference-based: create an article containing '<section id="related-guides-section"><h2>Related Guides</h2>...</section>' with valid canonical, then run the script with --slug <slug> --refresh; the output HTML contains both the legacy section and the newly inserted data-related-guides section.
- Proposed test: Extend test/relatedGuidesContract.test.mjs with a legacy-format fixture run under --refresh, asserting exactly one related-guides section exists in the output.
- Recommendation: Before inserting, remove any block matched by the legacy patterns (or extend relatedSectionMatch to cover the legacy id/class forms) so refresh always replaces rather than appends.
- Codex rationale: The refresh path recognizes legacy sections in its skip gate but relatedSectionMatch cannot replace the legacy id-only form. Corpus inspection found 96 legacy-only documents, so a future --refresh can append a second block. Existing duplicate headings are already present in the immutable baseline and were not introduced by this Art-link candidate.
- Verification evidence: hasLegacyRelatedGuides matches id=related-guides-section.; relatedSectionMatch only matches article-related or data-related markers.; 96 candidate documents have legacy-only related-guide markup.; A sampled duplicate document has the same duplicate headings in the active baseline.
- Verification commands: `sed -n 296,352p and 374,525p article-agent/scripts/inject-related-guides.mjs`; `node corpus scan for legacy-only related-guide documents`; `rg Related.Guides baseline and candidate sample`
- Assumptions: Legacy-format pages still exist in the corpus; hasLegacyRelatedGuides existing at all suggests they do. The staged contract test file was not fully reviewed, so this case may or may not already be covered.

### CC-005 — Marker-absent (v1/rollback) nginx path serves unknown provider routes as HTTP 200 soft-404s

- Claude: **low** severity, **high** confidence, `correctness`.
- Codex: **rejected**, final severity **low**.
- Location: `repos/frontends/art-appraiser-directory-frontend/nginx.conf:101`.
- Candidate evidence: For '/appraiser/<anything>/' the location falls back to 'try_files $uri $uri/index.html =418' with 'error_page 418 =200 /appraiser-unavailable.html', so when the .reviewed-route-enforcement-v2 marker file is absent (the currently active release, and any rollback), every unknown provider-shaped URL returns the branded unavailable page with status 200. Only with the marker does the block 'return 404'.
- Impact: The exact soft-404 indexing trap this recovery project remediates (arbitrary provider URLs indexable with 200 responses) persists in production until the v2 artifact is promoted and is silently reintroduced by any rollback; crawlers can accumulate 200-status junk provider URLs during that window.
- Reproduction: Inference-based: with a document root lacking the marker file, request /appraiser/nonexistent-slug/ — try_files falls through to =418, which error_page rewrites to a 200 response serving /appraiser-unavailable.html.
- Proposed test: Add a deploy-self-test/smoke case that runs the nginx config against a root without the marker and asserts the team's intended v1 status for an unknown provider route, documenting the accepted soft-200 window explicitly.
- Recommendation: If the 200 is required only for byte-identical v1 rollback, keep it but record the soft-200 window as an explicit risk in the retirement ledger; otherwise change the fallback to '=404' so both artifact generations return a real 404/410 for unknown provider routes.
- Codex rationale: This is an explicit, tested compatibility requirement, not an accidental regression. The separately mounted staged Nginx config must preserve the active v1 artifact behavior until v2 content is promoted and must restore that behavior on rollback. Activating v2 semantics against the old artifact would violate the atomic release contract. The isolated test records unknownProviderStatus=200 and v2BehaviorInactive=true for the legacy artifact.
- Verification evidence: Task SEO-001A requires v1 artifact compatibility.; Isolated candidate test proves v2 behavior only with the v2 marker.; Implementation receipt explicitly records the time-bounded rollback tradeoff.
- Verification commands: `node scripts/check-isolated-nginx-candidate.mjs --public-dir frozen-art-candidate --legacy-artifact active-v1-release`; `rg reviewed-route-enforcement-v2 nginx.conf`
- Assumptions: The implementation receipt states v1 must keep 'its previous behavior' under the staged config, so this is a deliberate trade-off; severity is low because it is documented and time-bounded by promotion.

### CC-006 — Cross-repo scripts hard-code an absolute /srv registry path evaluated at module load

- Claude: **low** severity, **high** confidence, `maintainability`.
- Codex: **rejected**, final severity **low**.
- Location: `repos/agents/article-agent/scripts/inject-related-guides.mjs:9`.
- Candidate evidence: ART_ROUTE_REGISTRY is read synchronously from '/srv/repos/tools/directory-site-utils/references/art-route-registry.json' at import time, before argument parsing. The same absolute path is hard-coded in repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs (line 12), both check-art-directory-recovery-links.mjs scripts, and repos/frontends/antique-appraiser-directory-frontend/scripts/remediate-art-directory-links.mjs (line 9), with no override flag.
- Impact: Four repos are coupled to one deploy-host filesystem layout: the scripts crash immediately (including for --dry-run/--help) on CI, developer machines, or a relocated host, and there is no way to pin a specific registry revision per run beyond whatever file currently sits at that path.
- Reproduction: Run any of the listed scripts on a machine without /srv/repos/tools/directory-site-utils; node throws ENOENT during module evaluation before any flag is processed.
- Proposed test: A smoke test that invokes each script with --help/--dry-run and an ART_ROUTE_REGISTRY_PATH override in a temp directory, asserting it does not require the /srv path.
- Recommendation: Accept a --route-registry flag or ART_ROUTE_REGISTRY_PATH environment variable with the /srv path as default, and defer the read until after argument parsing.
- Codex rationale: These are VPS operational scripts whose canonical execution environment and shared registry location are explicitly /srv. The registry artifact and SHA-256 are recorded in every candidate receipt and drift gates promotion. Portability would be optional refactoring, not a correctness finding for this deployment contract.
- Verification evidence: Workspace AGENTS and operational docs define /srv as the canonical VPS layout.; Registry hash b1c7ff... and artifact hash 8f2c57... are bound into validators and receipts.
- Verification commands: `sha256sum /srv/repos/tools/directory-site-utils/references/art-route-registry.json`; `node main_page/scripts/check-art-directory-route-registry.mjs`
- Assumptions: These scripts are intended to run only on the VPS today; the receipt's recorded registrySha256 mitigates, but does not eliminate, revision-pinning concerns.

### CC-007 — Location-page scrub only removes suppressed-provider links wrapped in article/li containers

- Claude: **low** severity, **low** confidence, `correctness`.
- Codex: **rejected**, final severity **low**.
- Location: `repos/frontends/art-appraiser-directory-frontend/scripts/apply-recovery-reviewed-cohort.mjs:292`.
- Candidate evidence: For each '/appraiser/' link whose slug is not in the allowed cohort, the code removes link.closest('article') or link.closest('li') and otherwise leaves the anchor in place — a suppressed-provider link appearing in body prose, a nav element, or a div-based card would survive the scrub while the JSON-LD ItemList is filtered separately (lines 300-314).
- Impact: Retained location/hub pages could keep visible links to provider routes that now return 404/410 under the v2 policy, leaking crawlable dead links from indexable pages and contradicting the 'crawlable Art links must be registered' contract.
- Reproduction: Inference-based: a location index.html with '<p>See <a href="/appraiser/suppressed-slug/">X</a></p>' passes through updateLocationPage unchanged for that anchor; whether such markup exists in the generated pages was not verifiable from the bundle.
- Proposed test: Unit test on updateLocationPage with a disallowed appraiser link outside article/li, asserting the anchor is removed or rewritten; additionally ensure check-remediation-contract.mjs (not fully reviewed) scans retained pages for internal /appraiser/ links against the allowed set.
- Recommendation: Fall back to unwrapping or removing the anchor itself when no article/li container exists, or add a post-pass assertion that no disallowed /appraiser/ href remains in the serialized document.
- Codex rationale: The hypothetical residual anchor cannot enter the approved indexable cohort unnoticed. All city pages are collapsed and return 410 under v2; the active HTML route contract scans the eight retained routes and rejects any unpublished /appraiser/ link. Current Art check:static passed with locations=0 and 94 validated internal links.
- Verification evidence: City decision manifest retains zero city pages.; check-route-link-contract rejects any appraiser slug outside the reviewed manifest.; Art static contract passed providers=5, locations=0 and internalLinks=94.
- Verification commands: `rg -n allowedAppraiserSlugs.checkUrl scripts/check-route-link-contract.mjs`; `npm --prefix art-appraiser-directory-frontend run check:static`
- Assumptions: Generated location pages may only ever place provider links in article/li cards, in which case this is dead-code risk; check-remediation-contract.mjs or the static contract may already catch residual links — neither was fully reviewed.

## Limitations

- DIFF.patch is empty (sha256 of empty string) — the bundle is a snapshot with no base, so findings cannot be attributed to this change set versus pre-existing code.
- Two candidate evidence files were omitted from the bundle for exceeding 256000 bytes (articles-20260726-registry-remediation-batch-manifest.json and -receipt.json), so the 3,198-file remediation evidence could not be inspected.
- Scripts invoked by staged code are outside the staged scope and were not auditable: scripts/audit-provider-source-quality.mjs (the receipt's symlink-rejection claim is verified only via its staged test), search-console-inspector's index.mjs, search-analytics.mjs and shared/loadOAuth.mjs, article-agent's src/env and src/keywords/inventory modules, and the data manifests (provider-publication-manifest.json, recovery-reviewed-provider-cohort.json) consumed by apply-recovery-reviewed-cohort.mjs.
- The following staged files were skimmed or checked only with targeted searches, not fully reviewed, due to budget: deploy-self-test.mjs (1610 lines), art-directory-seo-recovery-task-list doc, historical-url-retirement-ledger.json (3840 lines), StandardizedLocationPage.tsx and ArtAppraiserPainLedV3.tsx (full contents), inject-city-bridge-links.mjs, inject-city-directory-bridges.mjs, inject-decision-routing.mjs, check-remediation-contract.mjs, check-route-link-contract.mjs, check-isolated-nginx-candidate.mjs, build-art-route-registry.mjs, build-historical-url-ledger.mjs, build-art-directory-remediation-batch-manifest.mjs, check-art-directory-route-registry.mjs, service-overrides.json, the remaining data JSONs, and both staged test files.
- No code was executed; all reproductions are inference from source.
