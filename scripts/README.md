# Static Publish Scripts

This directory contains the supported scripts for validating and patch-publishing the art appraiser directory static site.

`public_site/` is the canonical published artifact. Profile and city page content under `public_site/appraiser/**` and `public_site/location/**` must not be mass-edited by scripts.

## Supported Workflow

For normal static validation:

```
npm run build
npm run check:static
```

Use the patch publisher for footer, nav, homepage, CSS, managed CTA block, or
asset-only deploys:

```
npm run publish:patch
```

Patch publish clones the active release first, overlays only allow-listed static
paths from `public_site/` (`index.html` and `assets/` by default), then updates
shared envelope blocks on existing appraiser/location pages. It refuses
`appraiser/` and `location/` paths unless explicitly overridden and verifies that
protected profile/city content is unchanged before flipping `current`.

Full generated publish is disabled from npm. Individual appraiser and location
HTML content should only change through direct, reviewed HTML edits. Do not use
scripts to mass-edit `public_site/appraiser/**` or `public_site/location/**`.

## Remaining Scripts

Most script entrypoints in this directory are compatibility wrappers around
`/srv/repos/tools/directory-site-utils`. Keep the local wrapper paths because
package scripts and operator runbooks call them directly.

- `check-static-site.mjs`: validates the static artifact.
- `publish-patch.mjs`: patch publisher for homepage/assets/shared envelope blocks.
- `serve-static.js`: local static server for `public_site/`.
- `test-html.js`: read-only HTML diagnostics; use `--strict` only when missing local assets should fail the command.
- `count-appraisers.js`: read-only data count/report helper.
- `check-images.js`: legacy image diagnostics.

## Removed Build Path

Removed from the normal workflow.

Do not reintroduce `dist`-based rebuild steps into the production path for this repo.
