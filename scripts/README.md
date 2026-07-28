# Static Publish Scripts

This directory contains supported validation and HTML-maintenance scripts for the art appraiser directory static site.

`public_site/` is the canonical published artifact. Profile and city page content under `public_site/appraiser/**` and `public_site/location/**` must not be mass-edited by scripts. The indexing-manifest script is the narrow exception: it may update only city robots metadata plus the generated sitemap and manifest.

## Supported Workflow

For normal static validation:

```
npm run build
npm run check:static
```

The indexing contract is generated from rendered city quality and reviewed profile state:

```
npm run seo:indexing-manifest
npm run check:indexing-contract
```

A city is indexable only when it has at least one exact-city profile, at least
700 rendered words, the expected canonical, a useful meta description, an H1,
and FAQ schema. The write command synchronizes city robots metadata,
`public_site/sitemap.xml`, and `public_site/indexing-manifest.json`. Profile
indexability remains review-driven; the script prevents noindex profiles from
entering the sitemap but does not promote profiles automatically.

Production publishing is not supported from this directory. Use the standard
VPS deploy helper for `art-appraisers-directory` after validation and review.

Hydrated city cards use the strict-local JSON feeds as canonical data:
`public_site/locations.json` and `public_site/location/<city>/index.json`.
Run `npm run repair:directory-locality -- --dry-run` to inspect out-of-city
cards, and `npm run repair:directory-locality -- --write` to remove cards whose
profile address city does not match the city page. This intentionally may leave
some city pages sparse or empty rather than publishing false local coverage.
Profiles with an explicit `serviceAreas`, `areasServed`, or `serviceArea` match
are retained separately as `nearbyAppraisers`; they are never presented as
exact-city listings.

Static city HTML must also match those strict-local feeds. Run
`npm run repair:directory-html-parity -- --dry-run` to inspect stale static
cards, and `npm run repair:directory-html-parity -- --write` after the locality
repair to remove stale card/summary links and update page counts/JSON-LD.

## Remaining Scripts

Most script entrypoints in this directory are compatibility wrappers around
`/srv/repos/tools/directory-site-utils`. Keep the local wrapper paths because
package scripts and operator runbooks call them directly.

- `check-static-site.mjs`: validates the static artifact.
- `check-directory-consistency.mjs`: validates active assets and strict-local city feeds.
- `check-asset-references.mjs`: crawls reviewed runtime entrypoints and both asset-prefix dependency
  graphs; it fails on missing references or retained orphan files.
- `test-interactions.mjs`: renders feedback and city search in JSDOM and checks success/failure,
  keyboard, mobile-control, geolocation-error, and telemetry behavior.
- `test-retired-index-robots-contract.mjs`: mounts the reviewed Nginx config
  against the retained static release and verifies direct `/index.html`,
  `/robots.txt`, sitemap, mapped-profile, query-preservation, and unknown-route
  behavior.
- `build-indexing-manifest.mjs`: generates and validates city eligibility, robots state, and the sitemap URL set.
- `check-indexing-contract.mjs`: audits every sitemap URL for static HTML, robots, canonical, H1, description, JSON-LD, and visible FAQ parity.
- `repair-faq-schema.mjs`: regenerates FAQ JSON-LD from visible FAQ sections and removes unsupported FAQ claims.
- `repair-internal-location-links.mjs`: repairs links to missing location/profile routes without creating thin pages.
- `repair-directory-locality.mjs`: rewrites JSON feeds to strict-local city cards.
- `repair-directory-html-parity.mjs`: rewrites static city HTML to match strict-local JSON feeds.
- `serve-static.js`: local static server for `public_site/`.
- `test-html.js`: read-only HTML diagnostics; use `--strict` only when missing local assets should fail the command.
- `count-appraisers.js`: read-only data count/report helper.
- `check-images.js`: legacy image diagnostics.

## Removed Build Path

Removed from the normal workflow.

Do not reintroduce `dist`-based rebuild steps into the production path for this repo.
