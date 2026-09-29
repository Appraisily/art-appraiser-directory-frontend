# Browse hubs — September 29, 2026

Approved scope: /srv/manager/seo/2026-09-29-directory-next-pass/README.md.
Release and measurement evidence: /srv/manager/seo/2026-09-29-directory-next-pass/IMPLEMENTATION.md.

The canonical static appraiser and location hub HTML now loads directory-browse-v1.js and directory-browse-v1.css. The assets are hub-only: do not add them to city/profile pages or a global injection. Static links remain visible with JavaScript disabled; controls progressively appear when filtering is available. Filters do not change URLs or send search text to analytics. directory_cta uses the existing directory_static_bootstrap owner.

The 257 provider links are grouped into five source-reviewed and 252 limited listings. The 78-city hub retains all 257 provider destinations in a collapsible static list. Provider statuses, city documents, homepage, sitemap and canonical routes are unchanged. Asset-reference validation now includes the two hub entry documents. Regenerate the shared Art route registry artifact hash after public_site changes; do not regenerate city/profile documents to update hubs.

Run npm run build and npm run lint. scripts/test-directory-browse.mjs checks static inventory, labels, unique destinations, schema counts, statuses, location parity, search, facets, reset, empty state and search privacy. Browser QA must also cover all four hubs at 390/320/1365 pixels, including bottom actions. The Art full-lint baseline has three unrelated unused-variable errors in unchanged check-isolated-nginx-candidate.mjs; changed-script lint passes.

Do not overwrite the September 28 experiment pages or their October 5/12/26 measurement gates. Hub-assisted traffic is an overlapping acquisition treatment even when destination documents are unchanged. Separate direct search landings from hub-assisted journeys; no uplift claim at deployment.
