# Provider source/contact correction — October 8, 2026

This bounded factual correction addresses nine external sources previously
called provider-owned websites. It does not promote providers, certify
credentials, change canonical URLs, or establish that Google will index a page.

| Profile | Retained reference and scope |
| --- | --- |
| Alicia E Weaver (ISA CAPP) | Exact ISA individual profile 2647 replaces the generic ISA root. Existing name-only designation evidence, Person identity and Prestige relationship remain unchanged. |
| Janet L. Ross | Exact ISA individual profile 1361. The unrelated FAIR Alicia Weaver equivalence is removed. Locality remains a separate unresolved field finding. |
| Antique & Fine Art Appraisal | BBB business profile, not an owned website or endorsement. Blocked retrieval does not establish closure. |
| Antique & Fine Art Appraisals | Antiques.com dealer listing. Its native company-site pointer is not accepted as current ownership/office evidence after retrieval failure. |
| Case Antiques, Inc. Auctions & Appraisals | LiveAuctioneers auctioneer profile. Newly archived owned-site evidence distinguishes Knoxville headquarters from a Nashville appointment-only branch; synchronizing that broader office/contact model remains follow-up work. No headquarters inference is added here. |
| Connecticut Art Appraisals, LLC (Alizzandra Danker) | Explicitly unresolved association reference, not a named provider profile. The generic AAA root is removed from entity `sameAs`; its research flag remains open. No guessed domain, person bridge or borrowed association office. |
| Everard Auctions & Appraisals | LiveAuctioneers auctioneer profile. Archived owned appraisal/contact pages are a separate follow-up field packet; no credentials imported. |
| Houston Estate Sales & Appraisals | January 2020 sale-event reference. The event is removed from practice `sameAs`. A failed native company-link retrieval does not prove closure or current office. |
| Jason Preston Art Advisory & Appraisals | Retained AAA individual reference is not equated with the practice in schema. The unrelated Connecticut FAIR record is removed. A separately dated provider-published biography conflicts with Nashville; the unsupported office is omitted, not replaced with an inferred street or personal office. |

The dated source packets are under
`/srv/manager/seo/2026-10-07-art-directory-indexability-audit/`:
`batch-y-source-research.json`, `batch-z-source-research.json`, and
`batch-aa-fair-identity-evidence.json`. The latter includes actual named FAIR
H1/schema entities, not merely slug comparisons. Jason's omission cites the
archived biography body `00c4164f108a081e29d03550fb3a4bdd008fe54b7608eba904402041668ff794`
retrieved October 8 at 06:49:46.181 UTC. Retrieval alone does not approve every
claim on a page.

All nine original limited statuses, August 30 identity reviews, identifiers,
historical URLs and existing qualification evidence remain. `sourceType` and
`source_reference` describe the corrected publisher scope. The legacy
`website_backed_limited_publication` reason/actor describe the historical review;
they are not new provider-website verification. This source correction is dated
separately here, not backdated into that review.

Public native source actions retain their existing event/CTA identifiers for
compatibility, but name the real destination before click. Explicit source-role
metadata agrees with the manifest. The Art feed omits unconfirmed `website`
values and carries the reference under `source.reference`; its existing
`source.type`, route and original review date remain. Unknown hosts are not
automatically certified as owned. Antique feed extraction/publication is unchanged.

`test:resources` includes twelve source/profile/feed regressions, all failing
before this correction, plus two focused URL-wrap regressions. The initial candidate
browser gate exposed pre-existing 425px horizontal overflow on the Antiques.com
listing at 390px and 320px. A private before/after comparison identifies its
visible source URL, not the new button label, as the cause. Only that native
source anchor gains `overflow-wrap:anywhere`; its destination and text remain.
The wider 320px matrix also exposed pre-existing 391px overflow on the BBB
profile's visible source URL. An old-artifact/candidate comparison in real JS and
no-JS modes confirms that the same anchor-only rule restores the 320px width
without changing source text or destination. Both added regressions fail before
their fixes and reject removal of the wrap rule; no sitewide overflow hiding is
introduced.
Negative fixtures restore misleading website wording;
exact-profile checks protect entity references and source-role agreement. Initial/settled metadata parity also
protects source-role tags. The full isolated browser gate now includes all nine
affected profiles among 48 routes, at 1365/390/320 with real JS and no-JS modes.
Candidate/live proof and the exact changed-artifact review are recorded in Batch AA.

Remaining primary-location, service, specialty and entity decisions are not
waived. The full 36-task acceptance contract and October 12/26, 14/28,
16/November 2 and 20/November 3 measurement gates remain unchanged. This is a
factual overlap, not a new content/link cohort or indexing result.
