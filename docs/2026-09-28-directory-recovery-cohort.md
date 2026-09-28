# September 28 directory recovery cohort

Operator-approved plan: `/srv/manager/seo/2026-09-28-directory-click-audit/README.md`.
Release/evidence record: the adjacent `IMPLEMENTATION.md`.

Scope: homepage, Boston/Houston/Los Angeles/New York/Philadelphia, and the five existing reviewed profiles. No provider eligibility, canonical, sitemap URL, or runtime allowlist changes. The indexing manifest's five word counts and shared route registry's artifact hash follow the reviewed HTML.

The homepage now exposes city choices early. City pages lead with the actual provider and sourced service scope instead of generic local-market paragraphs. Key static links use the existing `directory_cta` owner; do not add a second emitter. Profile online actions explicitly identify the separate paid Appraisily service and carry existing Art source tags. Full July profile/credential-review dates remain unchanged: this review rechecked service pages, not every credential.

Official service sources reviewed September 28, 2026:

- AFP: https://afpartconsulting.com/art-consulting-services — appraisal, research, advisory and collection inventory; intended-use examples.
- Heidi Vaughan: https://heidivaughanfineart.com/about — Houston/Upper Kirby gallery, advisory and fine-art appraisals.
- Open to the Public: https://opentothepublic.art/art-appraisals/ — photography, postwar/contemporary art and listed appraisal purposes.
- St. Lifer: https://stliferart.com/appraisals/appraisal-services/ — nineteenth through twenty-first century media and collection documentation.
- Wilson: https://www.wilsonartservices.com/ — Philadelphia fine-art appraisal, advisory, collection management and downsizing.

Observed pre-change defect: live homepage loaded the static telemetry bootstrap but had 15 anchors and zero `data-gtm-event="directory_cta"` markers. The fix is markup only. Validate first-party synthetic receipt, not production demand, in browser QA.

Incoming links checked live: `https://appraisily.com/art` links to the homepage; `https://appraisily.com/articles/fine-art-appraisal-near-me/` links directly to all five cities. No article/main-page deployment is required.

Limited-profile assessment: 812 Maplewood's body is mostly a limited/under-review disclaimer and generic decision links; A&A has source/location and short service lists, but little provider-specific decision detail. This is a two-page sample, not a census or proof of Google's indexing cause. Do not expand or change all 252 limited profiles/sitemap based on it. Observe the stronger five-provider cohort first.

Checks: `npm run build`, `node scripts/test-directory-recovery-cohort.mjs`, targeted ESLint, responsive public browser QA. Full `npm run lint` has three unchanged baseline no-unused-vars errors in `scripts/check-isolated-nginx-candidate.mjs` (registry, policyRoot, consolidated); this release does not alter that file.

Readouts: October 12 (new crawl dates), October 26 (indexing and impressions, qualified clicks/arrivals and canonical payments). No same-day improvement claim. Retain the separate Antique Chicago/Baltimore pilot gates.
