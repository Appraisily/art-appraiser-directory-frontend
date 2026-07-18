# Directory image and fallback policy

The Art Appraiser Directory does not generate or upload profile images during validation or deployment.

## Canonical sources

- The reviewed public feeds, `public_site/appraisers.json` and
  `public_site/locations.json`, are the browser-facing image source of truth.
- A reviewed provider may use an owned, verified image or a checked-in
  non-likeness SVG under
  `public_site/assets/generated-appraiser-profiles/`.
- Generated directory artwork must identify itself as generated and not a
  likeness in its accessible title/description and visible artwork.
- Empty, placeholder, invalid, and failed provider image URLs are missing
  images. `InitialsAvatar` renders a deterministic, accessible initials
  fallback; placeholder files are not presented as portraits.
- Never reuse another provider's photograph or a random stock image as a
  fallback.
- Do not infer a first-party URL by stripping or replacing another provider's
  host.

## Publishing contract

`npm run build` validates the committed `public_site/` artifact. It does not
generate images or rewrite profile records. Image changes must be reviewed in
the public feeds and canonical static HTML, then promoted through the standard
VPS deploy helper.

## Adding an image

1. Confirm Appraisily may publish the image.
2. Store it at a stable, provider-specific first-party path. For a checked-in
   asset, use `public_site/assets/generated-appraiser-profiles/<slug>.svg`.
3. For an external first-party asset, verify status, MIME type, and non-empty
   bytes. For a checked-in SVG, verify its accessible labeling and that it
   makes no likeness claim.
4. Update `public_site/appraisers.json`, the matching entries in
   `public_site/locations.json`, and the reviewed profile/location HTML.
5. Run `npm run assets:check`, `npm run test:assets`,
   `npm run check:asset-references`, `npm run build`, and the relevant browser
   smoke checks.
