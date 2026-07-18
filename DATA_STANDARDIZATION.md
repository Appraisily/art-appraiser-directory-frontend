# Directory Data Contract

The repository retains a wider standardized source corpus for audit and review, but that
corpus is not public inventory.

Public eligibility is controlled by:

- `data/provider-publication-manifest.json` — provider status and generated summary;
- `public_site/appraisers.json` — reviewed browser/feed provider records;
- `public_site/locations.json` — reviewed browser/feed city records;
- `public_site/indexing-manifest.json` and `public_site/sitemap.xml` — indexable routes;
- the provider allowlist in `nginx.conf` — provider-specific HTML delivery.

Do not copy hardcoded provider or city totals into documentation. Read current counts from
the manifest summary and verify parity with:

```bash
npm run check:remediation-contract
npm run build
```

Ratings and review counts are not part of the public contract. Public URLs are sanitized
at the data boundary, and missing or placeholder provider images use the shared initials
fallback.
