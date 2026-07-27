# Art directory SEO consultation context

This temporary context file summarizes fresh, read-only evidence collected on
2026-07-26. It is provided so an independent reviewer can challenge the
proposed remediation before an implementation task list is finalized.

## Current production and GSC state

- Target: `https://art-appraisers-directory.appraisily.com/`
- Active release:
  `20260725220154-4fdb51fa6ea6`
- Exact URL-prefix and `sc-domain:appraisily.com` properties are accessible.
- The trailing 90-day Art-property export has zero rows, impressions, and
  clicks.
- The current sitemap contains 13 URLs:
  - 9 are `Crawled - currently not indexed`;
  - 4 are `Discovered - currently not indexed`;
  - 0 are indexed.
- All nine crawled URLs report `INDEXING_ALLOWED`.
- Google selected the expected self-canonical for every crawled URL.
- The sitemap was last submitted on 2026-07-15, downloaded on 2026-07-23,
  reports 13 submitted and 0 indexed, and has zero errors or warnings.
- The fixed requested cohort was last crawled on 2026-07-16. The 2026-07-25
  release has therefore not yet been evaluated.

## Current content evidence

- Homepage: 63 visible words.
- Appraiser hub: 67 visible words.
- Location hub: 69 visible words.
- Five profile pages: 164–200 visible words.
- Five city pages: 54–57 visible words each.
- Every city page presents exactly one provider and repeats the same short
  one-listing template with entity names substituted.
- One current provider, Wilson Art Services, has a separate indexable,
  self-canonical profile on the Antique directory host.

## Crawl-graph evidence

- Active article corpus:
  - 3,211 files link to the Art host;
  - 4,703 Art-host link occurrences;
  - 4,612 point to the Art homepage;
  - 43 point to five retired Art city routes and now return 404.
- Active Antique directory:
  - 120 links from 60 files point to 60 retired Art city routes and return
    404.
- Total known broken cross-host links: 163.
- Googlebot followed `/location/atlanta/` and received 404 on 2026-07-26.
- Any arbitrary `/appraiser/<slug>/` returns HTTP 200 with a branded
  `noindex, nofollow` unavailable page and canonical to `/appraiser/`.
- A historical unavailable provider path was fetched by Googlebot during the
  same audit window.

## Competing Appraisily surface

The Antique directory produced 2,986 impressions and 233 clicks over the same
90-day period. Queries containing art-appraisal intent produced 737
impressions and 48 clicks. Matching Antique city pages received art-appraisal
impressions for Boston, Philadelphia, New York, and Los Angeles.

## Proposed remediation to challenge

1. Replace or remove all 163 links to retired Art routes.
2. Return real branded 404 responses for arbitrary provider slugs; use 301
   only for verified replacements and consider 410 for known retired URLs.
3. Remove the corpus-wide Art-directory article card/footer pattern, retaining
   a bounded set of genuinely contextual links.
4. Either add unique, source-backed local decision value to each city page or
   collapse the one-provider city pages into a stronger reviewed hub.
5. Select one canonical Appraisily home for every duplicated provider.
6. Add accurate per-URL lastmod only after meaningful changes, resubmit the
   final sitemap, and request indexing for the final useful cohort.
7. Run the fixed Day-14 checkpoint on 2026-07-29 and require post-2026-07-25
   crawl timestamps before judging the release.
8. If Google recrawls the repaired cohort and still indexes zero URLs, compare
   consolidation into the performing Antique/general directory with curated
   Art paths on the Appraisily apex. Do not expand this subdomain meanwhile.

The final task list must distinguish confirmed technical defects, content
quality hypotheses, measurement gates, and decisions requiring approval. It
must not promise indexation or treat word count as a ranking factor.
