# Directory image and fallback policy

The Art Appraiser Directory does not generate or upload profile images during validation or deployment.

## Canonical sources

- The reviewed public feeds, `public_site/appraisers.json` and
  `public_site/locations.json`, are the browser-facing image source of truth.
- A provider entity/feed image must actually depict that provider and have
  recorded source/permission evidence. Omit the field when this is unknown.
- A checked-in non-likeness SVG under
  `public_site/assets/generated-appraiser-profiles/` may be a labeled page
  illustration, not a provider entity/feed identity image. Appraisily branding
  belongs to the publisher/site, not to the listed provider.
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
4. Edit the individual reviewed profile HTML directly. Only authentic,
   evidence-backed provider imagery belongs in its provider schema; keep
   non-likeness artwork separate as a page illustration. Refresh generated
   feeds through `npm run build:llm-feeds` and verify that no unrelated fields
   or source-review dates change.
5. Run `npm run assets:check`, `npm run test:assets`,
   `npm run check:asset-references`, `npm run build`, and the relevant browser
   smoke checks.
   `npm run test:provider-images` is also a blocking static-build check; it
   rejects known publisher/non-likeness images in provider identity fields,
   but does not replace source/permission review for other assets.
