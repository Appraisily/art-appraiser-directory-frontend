# Case and Everard contact correction — October 8, 2026

This bounded factual follow-up changes two limited listings, not their eligibility,
canonical identity, review status or August 30 review dates. Office/contact checks
are separately dated October 8. It does not establish independent credentials,
fees, availability, inspection format or acceptance for a legal appraisal purpose.

[Case's owned contact page](https://caseantiques.com/contact-new/) identifies
Knoxville, Tennessee as headquarters and Nashville as a company office. It requires
appointments for gallery/office visits. The existing listing remains one company:
the primary postal locality is Knoxville, and a named `Place` represents the
appointment-only Nashville branch. No street or geolocation is inferred, and the
single-locality feeds retain both offices in the description. This is not a full
branch inventory. The provider hub facet becomes Knoxville but searches retain
Nashville. The location-hub name and schema agree. The breadcrumb uses the existing
provider hub; no Knoxville city route or Nashville city pilot is introduced.

[Everard's owned contact page](https://www.everard.com/auction/contact-3/) publishes
the Savannah, Georgia contact location. Its primary locality remains Savannah;
headquarters, appointment rules and inspection formats are not inferred.

Both native primary actions say “Open provider contact page” and preserve existing
GTM identifiers. Explicitly tagged secondary links retain their exact named
LiveAuctioneers profiles. The shared Art feed extractor recognizes the tagged
publisher role and exports the existing `source.reference` beside the owned
`website`. External-primary precedence, unknown-host behavior and Antique extraction
remain unchanged; arbitrary `sameAs` links are not inferred as secondary references.

The two dated locality records and Case branch record cite the exact owned contact
URLs and archived snapshots in the manifest. Art's original 866 records, 209
published profiles, 78 cities and 292 sitemap URLs remain. Review dates are not
backdated or promoted. No new specialization or service evidence is created.

Evidence: `/srv/manager/seo/2026-10-07-art-directory-indexability-audit/`
contains `batch-ab-source-research.json` and the two `batch-ab-source-evidence/`
HTML snapshots. Case was retrieved at 09:07:02.089 UTC with body SHA-256
`f901e4dda33e456b7cbd8503ad73eca876599849f0e0b8c58b42663f63688f46`;
Everard at 09:07:04.013 UTC with
`5d34ff7190a2c4491af4d16b33f27689ee9240dd1c19151cebdadf6216c6ea44`.
Retrieval alone is not approval of every assertion on the source page.

`tests/case-everard-contacts.test.mjs` adds seven fail-before regressions for owned
contacts, marketplace separation, old review dates, office-role schema, missing
locality-ledger negatives, hub facets and both feeds. Shared real-CLI tests cover
secondary role matching, primary precedence, lookalikes and Antique isolation.
The strict field-scope audit remains failing directory-wide; this correction clears
only the two covered locality findings. Candidate/live proof and exact changed-byte
checks belong to the separate Batch AB manager receipts, not a build-success claim.

The original 36-task contract, broader city/profile/media decisions and October
12/26, 14/28, 16/November 2 and 20/November 3 readouts remain. This factual overlap
is not a new content cohort, Google inclusion result or indexing guarantee.
