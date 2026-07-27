# Claude audit with Codex verification

Accept all six corrected-pass candidates after production/source verification. CC-001 and CC-003 directly worsen crawl cleanup; CC-002 is a confirmed release-integrity defect. CC-004 through CC-006 are lower-priority contract and hardening work. These findings supplement, rather than replace, the fresh GSC diagnosis and cross-host link/content work.

- Overall decision: **iterate**.

## Scope

The bundle is a folder-mode snapshot (scope "docs", 18 files, empty DIFF.patch) combining four planning/QA documents with the runtime nginx config, package manifest, and a representative subset of the published static artifact (homepage, both hubs, five city pages, unavailable page, robots.txt, sitemap.xml). This is sufficient to evaluate the SEO consult's claims against the actual routing/caching contract and the published HTML surface it describes, and the sitemap/allowlist/hub inventories were cross-checked and found consistent (13 URLs, 5 providers, 5 cities). It is not sufficient to verify artifacts the config and pages depend on: provider profile HTML, /methodology/, /get-listed/, 404.html, hashed assets, data/provider-publication-manifest.json, and all scripts/*.mjs validation gates are unstaged, so their existence and behavior were taken from documentation claims only.

- Mode: `folder`
- Scope: `docs`
- Reviewed files: 18

## Findings

### CC-001 — Arbitrary /appraiser/<slug>/ URLs return HTTP 200 soft-404 with contradictory noindex + cross-canonical signals

- Claude: **high** severity, **high** confidence, `correctness`.
- Codex: **accepted**, final severity **high**.
- Location: `nginx.conf:93`.
- Candidate evidence: location ~ ^/appraiser/[^/]+/?$ returns 418 when the .reviewed-route-enforcement-v1 marker is present; error_page 418 = @reviewed_provider_unavailable uses the bare '=' form, so try_files serves /appraiser-unavailable.html with HTTP 200 for every unpublished provider-shaped URL. That page (public_site/appraiser-unavailable.html:8-10) combines meta robots noindex,nofollow with rel=canonical to the indexable /appraiser/ hub. docs/claude-seo-consult-context-2026-07-26.md:49-53 confirms Googlebot is fetching these URLs in production and lists this as a defect, yet the staged config still ships the 200 behavior.
- Impact: An unbounded URL space returns 200 for retired/never-published providers, wasting crawl budget on a 13-URL site that currently has zero indexed pages, and sends Google the contradictory combination of a permanent-looking 200, a noindex directive, and a canonical pointing at an indexable page. This soft-404 pattern is a plausible contributor to the sitewide 'Crawled - currently not indexed' state the consult is trying to fix, and historical retired provider URLs never emit a removable signal (404/410).
- Reproduction: Run the staged nginx.conf in a container with the artifact root containing .reviewed-route-enforcement-v1 and appraiser-unavailable.html, then: curl -si http://localhost:8080/appraiser/any-random-slug/ — observe HTTP/1.1 200 and the unavailable page body instead of 404/410.
- Proposed test: Add a config-contract test that starts nginx with the marker present and asserts: each of the 5 allowlisted /appraiser/<slug>/ routes returns 200 with its own canonical; any non-allowlisted slug (e.g. /appraiser/alicia-e-weaver/) returns 404 (or 410) while still rendering the branded unavailable body; and no 200 response carries both noindex and a canonical to a different URL.
- Recommendation: Change the enforcement branch to return 404 (e.g. 'error_page 404 /appraiser-unavailable.html;' scoped so the branded body is served with a 404 status, mirroring the existing error_page 404 /404.html pattern), reserve 301 for verified replacements, and drop the cross-page canonical from the unavailable page since a 404/410 response makes it moot.
- Codex rationale: Confirmed in production: an arbitrary never-published provider slug returns HTTP 200 with noindex,nofollow and a canonical to /appraiser/. The active release marker is present. This creates a real unbounded soft-unavailable surface and conflicts with the desired retired-route cleanup.
- Verification evidence: Live arbitrary provider URL returned HTTP/2 200.; Live body contained Listing unavailable, noindex,nofollow, and canonical /appraiser/.; The active immutable release contains .reviewed-route-enforcement-v1.; nginx.conf lines 93-102 route all non-allowlisted provider-shaped URLs through error_page 418 = @reviewed_provider_unavailable.
- Verification commands: `curl -sS -D /tmp/cc001-headers https://art-appraisers-directory.appraisily.com/appraiser/claude-audit-never-published-20260726/ -o /tmp/cc001-body`; `test -f /mnt/srv-storage/art-appraisers-directory/releases/current/.reviewed-route-enforcement-v1`; `rg -n 'reviewed_provider_unavailable|error_page 418|appraiser/\[\^/\]' /srv/repos/frontends/art-appraiser-directory-frontend/nginx.conf`
- Assumptions: The .reviewed-route-enforcement-v1 marker ships with the active release, as the config comment (nginx.conf:51-53) and consult doc state.; The production behavior described in docs/claude-seo-consult-context-2026-07-26.md matches this staged config.

### CC-002 — Reviewed city and provider pages are served without any Cache-Control headers, bypassing the config's stale-HTML protection

- Claude: **medium** severity, **medium** confidence, `correctness`.
- Codex: **accepted**, final severity **medium**.
- Location: `nginx.conf:64`.
- Candidate evidence: The exact-match locations for the 5 reviewed city routes (lines 64-68) and 5 reviewed provider routes (lines 84-88) contain only try_files. In nginx, add_header directives are inherited from enclosing levels only; there are no add_header directives at server or http level, so these responses carry no Cache-Control, Cloudflare-CDN-Cache-Control, cf-edge-cache, or Pragma headers. By contrast, the generic 'location /' (lines 157-164) and the .html regex (lines 146-153) explicitly send no-store headers, with a comment stating this prevents stale HTML pointing at old chunk names.
- Impact: The ten most important pages on the site (the reviewed cohort) are the only HTML documents delivered without cache directives. If a Cloudflare cache-everything rule is active (implied by the deliberate Cloudflare-CDN-Cache-Control headers elsewhere), the edge may cache these pages with default TTLs, so a promoted release can keep serving stale city/profile HTML that references pruned hashed bundles — exactly the failure mode the config comments say the headers exist to prevent. Intermediary and browser heuristic caching applies even without Cloudflare.
- Reproduction: Run the staged nginx.conf in a container with the artifact: curl -sI http://localhost:8080/location/boston/ shows no Cache-Control header, while curl -sI http://localhost:8080/ and http://localhost:8080/location/ return the full no-store header set.
- Proposed test: Add an HTTP-contract test that requests every sitemap URL against the candidate container and asserts identical Cache-Control/Cloudflare-CDN-Cache-Control headers on all HTML responses (the reviewed cohort must match the homepage's no-store set).
- Recommendation: Add the same no-cache add_header set (with 'always') to the ten exact-match cohort locations, or hoist the HTML no-cache headers to the server level and override only in the asset locations.
- Codex rationale: Confirmed live: the homepage and hubs return the intended no-store header set, while reviewed Boston and Heidi Vaughan exact-match routes return only Last-Modified and no Cache-Control headers. This is a release-integrity defect, though no stale response was observed during the check.
- Verification evidence: Live / and /location/ returned no-cache, no-store, must-revalidate plus cf-edge-cache no-cache.; Live /location/boston/ and /appraiser/heidi-vaughan-ma-isa-am/ returned no Cache-Control, Cloudflare-CDN-Cache-Control, cf-edge-cache, Pragma, or Expires headers.; nginx.conf exact-match locations contain try_files only and bypass the generic HTML locations.
- Verification commands: `for url in / /location/ /location/boston/ /appraiser/heidi-vaughan-ma-isa-am/; do curl -sSI "https://art-appraisers-directory.appraisily.com$url" | rg -i '^(HTTP/|cache-control:|cloudflare-cdn-cache-control:|cf-edge-cache:|pragma:|expires:|last-modified:)'; done`; `sed -n '64,96p' /srv/repos/frontends/art-appraiser-directory-frontend/nginx.conf`
- Assumptions: Cloudflare fronts this origin with HTML caching enabled or configurable, inferred from the Cloudflare-specific headers used throughout the config; if the zone never caches HTML, impact drops to heuristic browser/proxy caching only.; The staged nginx.conf is the runtime config, as the task list's 'repository and runtime-mounted nginx contracts are byte-for-byte aligned' claim states.

### CC-003 — All 12 canonical provider-alias 301s redirect to slugs outside the reviewed allowlist, terminating at the 200 noindex soft-404

- Claude: **medium** severity, **high** confidence, `correctness`.
- Codex: **accepted**, final severity **medium**.
- Location: `nginx.conf:105`.
- Candidate evidence: The alias block 301-redirects 12 provider URLs to targets such as /appraiser/amelia-jeffers/, /appraiseitnow/, /artifactual-history/, /adelaide-fine-art/, /djr-authentication/, /escher-associates-ea/, /kagan-fine-art-appraisals/, /art-of-estates-personal-property-appraisal-firm/, /prestige-estate-services/, and /redtail-appraisals/. None of these targets appears in the 5-slug exact-match allowlist (lines 84-88) or in public_site/sitemap.xml, so with the enforcement marker present each redirect target falls through to the regex at line 93 and returns the HTTP 200 noindex unavailable page (CC-001).
- Impact: Permanent redirects that end at a soft-404 tell crawlers the retired URL's canonical successor is an unpublished placeholder, which neither consolidates signals nor removes the URLs from crawl rotation. This directly violates the consult's own remediation rule (docs/claude-seo-consult-context-2026-07-26.md:65-66: '301 only for verified replacements') and adds 12 more contradictory URL chains to a site already failing to index.
- Reproduction: curl -sIL http://localhost:8080/appraiser/amelia-jeffers-auctioneers-appraisers/ against the staged config with the marker present: observe 301 to /appraiser/amelia-jeffers/ followed by a 200 response of the unavailable page.
- Proposed test: Extend the route-link contract (check:route-links) to parse every 'return 301' target in nginx.conf and fail unless the target is a member of the published allowlist/sitemap or an approved external URL; add a fixture asserting the current 12 alias targets resolve to real 200 content or the aliases are removed.
- Recommendation: Delete or repoint each alias: 301 only where the target slug is actually published, and return 404/410 for retired providers with no verified replacement, per the consult's remediation item 2.
- Codex rationale: Confirmed all twelve live alias chains: each starts with 301 and ends on an unpublished target returning HTTP 200 noindex. None of the targets belongs to the five-provider published cohort. Each alias must be re-proven and either redirected to a published replacement or retired with a non-200 status.
- Verification evidence: All 12 configured alias URLs returned 301 to their configured target.; Following every redirect ended in HTTP 200 on the generic noindex unavailable page.; None of the target slugs is present in the five exact-match provider allowlist or the 13-URL sitemap.
- Verification commands: `curl -sSL -o /tmp/cc003-body -w '%{http_code} %{url_effective}' https://art-appraisers-directory.appraisily.com/appraiser/amelia-jeffers-auctioneers-appraisers/`; `sed -n '79,116p' /srv/repos/frontends/art-appraiser-directory-frontend/nginx.conf`; `rg -n '<loc>' /srv/repos/frontends/art-appraiser-directory-frontend/public_site/sitemap.xml`
- Assumptions: The alias targets are genuinely unpublished; none of the 12 target slugs appears in the allowlist, sitemap, hub page, or any staged inventory, and the reviewed cohort is documented as exactly 5 providers.; The enforcement marker is present in the active artifact (same assumption as CC-001).

### CC-004 — Current QA acceptance brief codifies the 200 soft-404 behavior that the newer SEO remediation classifies as a defect

- Claude: **low** severity, **high** confidence, `testing`.
- Codex: **accepted**, final severity **low**.
- Location: `docs/postdeploy-external-customer-qa-brief-2026-07-18.md:73`.
- Candidate evidence: The post-deploy acceptance appendix states '/appraiser/alicia-e-weaver/ may return 200 only as the generic noindex unavailable page', making HTTP 200 the accepted contract for suppressed provider routes. The later consult (docs/claude-seo-consult-context-2026-07-26.md:65-66) proposes 'Return real branded 404 responses for arbitrary provider slugs'. Neither document supersedes or references the other's conflicting requirement.
- Impact: Two live process documents define opposite acceptance criteria for the same route class. If remediation item 2 is implemented, the next external QA run generated from this brief will flag correct 404 behavior as a regression; if the brief wins, the soft-404 defect (CC-001) gets re-validated as passing. Either path produces a wrong release verdict.
- Reproduction: Inference-based: compare the two staged documents; the conflict is textual, not runtime.
- Proposed test: Add a docs-consistency check to the remediation workflow: when the provider-route status contract changes, require a same-change update to the QA brief's acceptance appendix (a grep-able 'expected status for suppressed provider routes' line kept identical in both documents).
- Recommendation: When finalizing the consult's task list, amend the QA brief's routing acceptance items (suppressed provider status, and the /location/atlanta/ expectations if 410 is adopted) in the same change, and mark the 2026-07-18 brief as superseded for those items.
- Codex rationale: The process-document conflict is exact and current: the 2026-07-18 QA brief permits HTTP 200 for a suppressed provider, while the SEO remediation context requires a real 404. The QA contract must change in the same patch as routing to avoid a false regression result.
- Verification evidence: postdeploy-external-customer-qa-brief-2026-07-18.md lines 73-77 explicitly permit 200 for the generic unavailable provider page.; claude-seo-consult-context-2026-07-26.md lines 65-66 requires real branded 404 responses for arbitrary provider slugs.
- Verification commands: `rg -n 'may return 200|real branded.*404|arbitrary provider' /srv/repos/frontends/art-appraiser-directory-frontend/docs/postdeploy-external-customer-qa-brief-2026-07-18.md /srv/repos/frontends/art-appraiser-directory-frontend/docs/claude-seo-consult-context-2026-07-26.md`
- Assumptions: The 2026-07-18 brief is still the source for the next externally issued QA prompt, as its Issuance Gate section indicates.

### CC-005 — Static homepage shell hides primary navigation on mobile with no non-JavaScript fallback

- Claude: **low** severity, **medium** confidence, `accessibility`.
- Codex: **accepted**, final severity **low**.
- Location: `public_site/index.html:51`.
- Candidate evidence: The mobile media query '.static-nav-links a:not(:last-child) { display: none; }' removes the Locations and Methodology links below 680px, leaving only 'Correct a listing'. The static HTML contains no menu toggle; the accessible mobile menu (Escape/focus behavior required by docs/postdeploy-external-customer-qa-brief-2026-07-18.md:96-98) exists only after the deferred module script hydrates the shell.
- Impact: Until hydration completes — or permanently if /directory/assets/index-YpbWiG2L.js fails, is blocked, or errors — mobile users have no path to /location/ or /methodology/ from the homepage, and the links are removed with display:none so they are also unreachable by assistive technology. Search-engine mobile rendering of the pre-hydration DOM likewise sees a homepage whose primary internal links are hidden.
- Reproduction: Open public_site/index.html at a 390px viewport with JavaScript disabled: the Locations and Methodology links are not rendered and no toggle is present. City pages in-body links still reach /location/, but the homepage header offers no route.
- Proposed test: Add a static-shell check (extend test-interactions or the route-shell contract) that renders each active document at 390px with scripts disabled and asserts every primary nav destination remains reachable via at least one visible link or a functional non-JS disclosure control.
- Recommendation: Keep the links visible on mobile in the static shell (e.g. wrap them or reduce font size) instead of display:none, or add a CSS-only disclosure; let hydration replace it with the full menu.
- Codex rationale: The static homepage source directly hides Locations and Methodology below 680px and provides no static toggle. Hydration normally replaces the shell, so this is not a primary indexation cause, but it is a real non-JavaScript and failed-bundle navigation regression worth covering in the release contract.
- Verification evidence: public_site/index.html lines 51-53 set display:none on every static navigation link except the final correction link below 680px.; The static shell contains no disclosure or menu toggle; the richer mobile menu depends on the deferred client bundle.
- Verification commands: `rg -n 'static-nav-links|@media \(max-width: 680px\)|<nav' /srv/repos/frontends/art-appraiser-directory-frontend/public_site/index.html`
- Assumptions: The hydrated React shell replaces the static header with the accessible mobile menu, as the QA brief and task list describe; the finding concerns the pre-/non-hydration state only.

### CC-006 — Build gate writes audit output to a fixed, predictable /tmp path on a shared VPS

- Claude: **low** severity, **medium** confidence, `security`.
- Codex: **accepted**, final severity **low**.
- Location: `package.json:9`.
- Candidate evidence: check:static runs audit-provider-source-quality.mjs with '--output /tmp/art-provider-source-quality.json'. Per the staged docs this repo lives on a multi-tenant VPS (/srv/repos with multiple services and agents), and /tmp is world-writable.
- Impact: A fixed filename in a world-writable directory allows another local user to pre-create the path as a symlink, causing the build to overwrite an attacker-chosen file with the runner's privileges (Node fs writes follow symlinks), or to read/tamper with the audit artifact between write and consumption. Concurrent builds also clobber each other's output, which can make the gate pass or fail on another run's data.
- Reproduction: Inference-based: as a different local user, 'ln -s /path/to/victim-file /tmp/art-provider-source-quality.json' before the build runs; the next npm run build overwrites the target. Not executed — the script itself is not staged.
- Proposed test: Add a unit test for the audit script asserting it refuses to write through an existing symlink (lstat check or O_NOFOLLOW/O_EXCL open) and defaults to a repo-local ignored path.
- Recommendation: Write the report to a repo-local ignored directory (e.g. ./reports/ or a mkdtemp-created directory) instead of a fixed /tmp filename.
- Codex rationale: The package gate uses a fixed /tmp filename and the audit script creates the parent then calls ordinary fs.writeFile without symlink or exclusivity checks. Cross-user attack likelihood is low on this VPS, but concurrent agent/build clobbering is credible. Move the generated report to an isolated run directory.
- Verification evidence: package.json check:static passes --output /tmp/art-provider-source-quality.json.; audit-provider-source-quality.mjs lines 170-171 call mkdir and fs.writeFile directly on the supplied path.; The shared VPS can run concurrent agent and validation jobs.
- Verification commands: `rg -n '/tmp/art-provider-source-quality|writeFile|mkdtemp|lstat' /srv/repos/frontends/art-appraiser-directory-frontend/package.json /srv/repos/frontends/art-appraiser-directory-frontend/scripts/audit-provider-source-quality.mjs`
- Assumptions: The VPS hosting builds has other local users or agent processes, as implied by the shared /srv layout and multi-project docs; on a strictly single-user host this reduces to the concurrency clobbering issue.; audit-provider-source-quality.mjs (not staged) uses ordinary fs write calls without symlink protection.

## Limitations

- DIFF.patch is empty (sha256 of the empty string; folder-mode snapshot with base=null), so no change-level review was possible; the audit assessed the snapshot state only.
- nginx.conf references /404.html (error_page) and the pages link /methodology/ and /get-listed/, none of which are staged; internal canary notes in docs/audit-remediation-task-list-2026-07-18.md claim they return 200, but this could not be verified from the bundle.
- The scripts/*.mjs validation gates invoked by package.json, data/provider-publication-manifest.json, public_site/appraisers.json, public_site/locations.json, and the hashed asset files referenced under /assets/ and /directory/assets/ are not staged, so the claimed parity/link/asset contracts could not be inspected.
- Cloudflare edge configuration is outside the bundle, so the practical caching impact of missing Cache-Control headers on reviewed-cohort pages (CC-002) is inferred from the config's own use of Cloudflare-CDN-Cache-Control headers elsewhere.
- GSC data, live HTTP behavior, and the external QA receipts cited in the docs are runtime evidence outside the bundle and were treated as untrusted claims, not verified facts.
