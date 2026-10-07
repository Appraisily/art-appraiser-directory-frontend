# Art Appraiser Directory Frontend

This repository now operates as a static publishing system for the Art Appraiser Directory website.

The production surface is plain HTML served directly from `public_site/` through the VPS release directory. Source data still lives in the repo, but the canonical published artifact is the final static HTML, not a rebuilt SPA bundle.

Operational guardrails: [docs/operational-guardrails.md](docs/operational-guardrails.md).

## Features

- Standardized data model for consistent UI and maintenance
- Static HTML publishing for all appraiser and location pages
- Provider-neutral first-party image assets with an explicit placeholder contract
- SEO optimization with structured schema.org data
- Automatic sitemap generation
- Atomic static-release promotion through the standard VPS deploy helper

## Standardized Data Model

The project now uses a standardized data format for all appraiser data:

- Consistent field names and data structures
- Comprehensive appraiser profiles with detailed information
- Rich schema.org markup for improved SEO
- See [DATA_STANDARDIZATION.md](./DATA_STANDARDIZATION.md) for details

## Static-First Workflow

The normal workflow is now `public_site`-first.

### Recommended commands

```bash
npm run build
npm run serve:static
```

`npm run build` no longer means “compile the app” or “refresh generated HTML.”
It is validation-only. Profile and city HTML should not be mass-edited by npm
scripts.

After individually reviewing HTML and publication decisions, refresh only the
sitemap and indexing metadata without regenerating browse hubs or changing robots:

```bash
npm run seo:indexing-manifest
npm run build:llm-feeds
node scripts/build-art-route-registry.mjs
node scripts/build-historical-url-ledger.mjs
```

`seo:indexing-manifest` is metadata-only. Broad content/robots-writing mode requires
the explicit `--write --allow-reviewed-content-write` arguments and is not routine
maintenance. A declared resource missing from a production input is a hard failure;
`--fixture` only relaxes resource presence for intentionally minimal nonproduction
test inputs and is rejected for the canonical `public_site/` directory.

Keep the central route registry and runtime nginx provider allowlist synchronized
with the candidate before validation and release. The September 30 expansion adds
MIR (Chicago), Jaynes (Seattle), and Jeanie Craig (Mill Valley, serving the Bay Area)
as separate reviewed additions; the original five-city recovery cohort is unchanged.

The October 6 supporting resources are authored initial-response HTML at
`/compare-art-appraisers/` and `/art-appraisal-inquiry-worksheet/`. Their explicit
inventory is `data/directory-resource-pages.json`; metadata-only generation adds
them without changing provider eligibility or city/profile content. The comparison
preserves original provider source-review dates. The worksheet uses native browser
print and has no form or customer-data submission. `check:static` includes the
focused resource regression suite. The current sitemap contains 292 URLs after
ASA's source-reviewed exclusion as an association rather than a local appraisal
practice. Its historical provider URL returns the generic noindex 404, not a
substitute Herndon listing. A&A remains limited, with Naples locality and service
evidence dated separately from its old identity check; Manhattan's unsupported
address is omitted, not guessed. Provider filter options are the exact current
static-row facets. The focused factual regression suite protects these decisions,
source dates and metadata/feed parity.

WorthWise's October 7 [location correction](docs/worthwise-service-area-correction-20261007.md)
omits an unconfirmed office and labels Colorado Front Range service separately.
Denver publishes that explicit regional option, not an invented Denver office.
The original October 1 provider-review date is retained; the new field check has
its own date. The focused regression protects profile/city/schema/feed parity and
the fail-closed, explicitly approved service-area exception in the Art validator.

The separate [reviewed-provider field corrections](docs/reviewed-provider-field-corrections-20261007.md)
use Open to the Public's current principal name and distinguish DeCarrera's
Newport Beach contact locality from Los Angeles/Orange County service coverage.
Original provider reviews and eligibility remain; the October 7 field checks
are recorded separately and protected by `test:resources`.

The [qualification provenance ledger](docs/qualification-field-provenance-20261007.md)
records separately dated official-source evidence for five existing qualification
sections. It preserves their exact provider-attributed wording, original July 15
reviews and all public artifacts. Source snapshots and an explicit
`independentCredentialVerification: false` boundary accompany the field evidence;
this is not a new certification, provider promotion or static-content release.
`test:resources` protects the exact qualification value and original review dates.

The same ledger now records four individually reviewed name/summary cases: ISA's
public profile supports Alicia Weaver's exact designation; Stoots and Joette
remain provider-attributed; Dudley's evidence supports its business-name wording
only. Original limited/verified statuses and review dates are retained. This is
source-only evidence, not a public-content release. Bailey, Christine Anderson
(different source host), Art Directives and Art Fortune remain explicitly unresolved
in the current checker; no unrelated evidence or website outage clears them.

Published slashless provider/city/resource paths and only the root/two-resource
`index.html` equivalents have exact, case-sensitive canonical aliases. The
reviewed nginx map uses the original request URI, so internal index lookups cannot
redirect clean canonical pages into a loop. Raw query parameters are preserved;
unknown, suppressed, retired and provider/city `index.html` URLs retain terminal
statuses. `.canonical-route-redirects-v1` is an internal artifact marker: older
rollback trees retain their existing routing with the staged configuration.

`npm run test:canonical-routing` is a blocking build gate for exact policy/map/
marker parity. `npm run test:canonical-routing-http` starts only its own isolated
nginx candidate and tests every declared alias with GET/HEAD, clean final targets
and the historical/unknown/direct-index terminal matrix. `--base <URL>` verifies
the same contract on an already running candidate or public host. To review a map
after an approved publication-policy change, run
`node scripts/check-canonical-route-redirects.mjs --print`; it writes no files.
Apply the reviewed block to repo and matching runtime nginx, then check both.
Do not hand-add unreviewed aliases or redirect unknown names to home.

The five original reviewed profiles serve their authored HTML without mounting
the legacy SPA, preserving source dates, specialties and services. `test:resources`
includes metadata/content parity negative fixtures. `npm run test:settled-browser`
checks every sitemap URL against the reviewed manifest/city/resource inventory and
25 representative routes at desktop, 390px and 320px with JavaScript enabled and
actually disabled. It uses isolated nginx and named browser sessions. Optional
`--base`, `--receipt`, `--artifact-dir` and `--policy-root` arguments support exact
candidate/live evidence. No production container restart is needed for this test.
The standard isolated candidate gate runs this contract against the promoted
candidate; an omitted declared URL, conflicting metadata, lost reviewed facts or
mobile overflow fails release. It does not prove Google inclusion.
Authored-text parity excludes only the shared embed's identified chat control
nodes on body-fallback documents; unrelated added text and changed provider
facts still fail the negative fixtures. The chat embed itself is not changed.
The exact zero-size hidden GTM `noscript` fallback is also normalized across
Chrome scripting-on and no-JS/JSDOM parser trees. Meaningful fallback text,
unknown iframe owners and all authored provider content remain protected by
negative fixtures; the public tracker markup is unchanged.
The 320px JS/no-JS checks also enter five representative pages through their
slashless/index aliases and verify the actual canonical arrival and raw query.

All active documents now leave SEO metadata owned by their authored HTML. The
remaining correction and unavailable-listing documents do not mount the legacy
React entry; its unreferenced published bundle has been removed. Inactive React
canonical helpers are not rewritten. The browser gate covers the noindex
correction/methodology pages and representative 404/410 provider responses using
explicit unpublished policies, without relaxing the indexable sitemap contract.
At 320px it follows the correction page's native contact link and checks the
preserved source, directory attribution and synthetic QA marker; it never submits
the contact form. A published-profile canonical remains slash-consistent and clean.

Production publishing is intentionally unavailable through npm. After review,
promote the complete validated `public_site/` artifact with the standard VPS
deploy helper.

Published provider actions identify Appraisily explicitly when they lead to its
online appraisal or screener, while official provider website links keep their
own destination. Legacy two-column profiles put their existing provider summary
first in source and on phones; the small `directory-provider-handoff-20261007.css`
contract retains the desktop sidebar arrangement. No provider facts, source dates,
link destinations, event attributes or telemetry owners change for this handoff
correction. `npm run test:provider-handoff` checks every published provider and
negative fixtures. The settled-browser gate additionally checks source/settled
labels, DOM order, mobile columns, desktop arrangement and original attribution.
At all three widths it follows the official 812 Maplewood services link and the
native Appraisily appraisal actions without submitting forms. JavaScript-enabled
checks verify the adopted journey identity after main-page's governed URL
redaction, along with retained campaign/directory tags and the synthetic marker;
no-JavaScript checks prove native navigation without claiming bootstrap execution.
Official-site clicks use separately owned browser sessions so external scripts'
late errors cannot contaminate the directory/apex error gate; their navigation
and external errors are recorded separately. All owned sessions are closed.
An official-check source-page open timeout is retained in the receipt and can
proceed only after independently proving the exact target URL, parsed document,
initial/settled facts/metadata/link parity and active QA marker. Other navigation
errors fail immediately; an open timeout or URL alone is never a passing state.

### Canonical surfaces

- `data/`: structured source facts for appraisers and locations
- `public_site/`: canonical published HTML artifact
- Standard deployment: `/home/deploy/.codex/skills/public/appraisily-vps-deploy/scripts/deploy.mjs`

## Development Commands

```bash
# Start development server
npm run dev

# Validate the canonical static site in public_site/
npm run build

# Validate public_site/ structure
npm run check:static

# Serve the canonical static site locally
npm run serve:static

# Run lint checks
npm run lint

```

## VPS Static Publish

The VPS deployment serves plain HTML from an nginx container, with content bind-mounted from a release directory (articles-style). The reviewed provider manifest controls which provider-specific HTML nginx may return; all other provider-shaped URLs receive a generic noindex response.

- Canonical editable surface: `public_site/`
- Validate the static artifact:
  - `npm run build`
- Validate the static artifact:
  - `npm run check:static`
All HTML, SEO, envelope, and asset changes use one production path:

```bash
node /home/deploy/.codex/skills/public/appraisily-vps-deploy/scripts/deploy.mjs \
  --service art-appraisers-directory
```

The helper validates and content-hashes `public_site/`, promotes changed content
atomically, verifies the public route and assets, and rolls back on failure.
`npm run publish`, `npm run publish:patch`, and `npm run deploy` are blockers.

## Project Structure

- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts
- `/data` - JSON data files for appraisers and locations
- `/public_site` - Canonical static HTML served in production

## Image Handling

Provider entity/feed `image` fields describe the actual provider, not Appraisily
branding or a generated illustration. Omit unknown provider imagery. Labeled
checked-in non-likeness artwork may remain a page illustration; it is not a
provider identity image. `npm run test:provider-images`, included in the static
build gate, rejects the known publisher-logo and non-likeness asset families in
provider schema and all provider/location feeds. This scoped check does not
authenticate other images or clear the broader field-evidence audit.

Empty, placeholder, invalid, and failed image
URLs render the deterministic initials fallback; the directory never borrows
another provider's image. Validation and deployment do not generate or rewrite
images automatically; see [IMAGE_GENERATION.md](IMAGE_GENERATION.md).

## Editing Rule

- For normal content, SEO, schema, and internal-link changes, edit `public_site/.../index.html` directly.
- Do not use scripts to mass-edit `public_site/appraiser/**` or `public_site/location/**`.
- Do not rebuild a frontend app as part of the normal workflow.

## SEO Optimization Features

This directory frontend implements comprehensive SEO features to maximize Google ranking potential:

### Technical SEO Implementation

- **Pre-rendered HTML**: All pages are pre-rendered for optimal indexing by search engines
- **Schema.org Structured Data**: Rich structured data for appraisers, locations, and FAQs
- **Optimized Meta Tags**: Complete set of meta tags including title, description, canonical URLs
- **Social Sharing**: OpenGraph and Twitter Card tags for better sharing on social media
- **Semantic HTML**: Proper HTML5 semantic elements for better content parsing
- **Performance Optimization**: Minified HTML/CSS/JS with deferred script loading
- **Sitemap Generation**: Dynamic XML sitemap with priority and frequency attributes
- **Robots.txt**: Custom robots.txt with sitemap reference

### Content Optimization

- **Keyword-rich Content**: Pages are structured for relevant art appraisal keywords
- **Structured Content**: Clear content hierarchy with proper heading structure
- **Local SEO**: Location-specific pages optimized for local search queries
- **FAQ Schema**: Structured FAQ content for potential featured snippets
- **Breadcrumbs**: Clear navigation paths with breadcrumb structured data
