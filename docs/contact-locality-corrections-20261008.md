# Anderson and New England: contact-locality corrections

Field check: October 8, 2026. Original listing review: August 30, 2026.
Both historical URLs/IDs and limited statuses are retained. This is a factual
correction, not a new reviewed-provider cohort, credential approval or assurance
that Google has indexed a page.

## Decisions and primary evidence

- Anderson Fine Art Appraisals: replace unsupported Anaheim with the
  provider-published Beverly Hills, CA **appointment-only contact locality**.
  The owned [contact page](https://www.art-appraisals.net/contact) explicitly
  labels its address "By Appointment Only". No street, walk-in office, additional
  branch or guaranteed inspection premises is published by this correction.
  Ask where the inspection would occur and how to arrange an appointment.
- Art Appraisals of New England: replace unsupported Boston with
  **provider-published Cape Neddick, ME locality**. Its owned
  [contact footer](https://www.artappraisalsne.com/01/contact/) identifies the
  named practice and Cape Neddick, Maine; the
  [homepage](https://www.artappraisalsne.com/01) corroborates this and describes
  southern Maine coverage. Historical clients elsewhere do not establish
  additional offices. Confirm current coverage and inspection/report scope.
  The contact text references the 2020–2022 standards edition; this does not
  establish current USPAP compliance and no compliance claim is imported.

Fresh captures, exact response hashes, retrieval timestamps and full source
text are archived in the manager audit folder as `batch-ah-source-captures.json`
and the four `batch-ah-*-source.html`/`.json` pairs. The separately dated
manifest `primary_location` entries bind the relevant contact snapshots.
The earlier eight-field service ledger and its historical notes remain unchanged;
these newer locality decisions supersede only the old public location facts.

## Public and regression scope

The two authored profiles, metadata/schema, native provider rows/filter facets,
location-hub labels and typed feeds must agree. Breadcrumbs use the provider hub;
no new city route is created. Existing Beverly Hills guidance remains unchanged
and is not promoted to a reviewed local roster. Boston city guidance and all
other provider/city content remain outside this factual correction.

`tests/contact-locality-corrections.test.mjs` protects exact source hashes,
contact roles, old reviews/status/IDs, own ProfessionalService identity, absence
of streets/coordinates/credentials, native handoffs, metadata/feed/facet parity,
and negative stale-locality/missing-evidence/foreign-source fixtures. Both routes
are in the desktop/390/320 initial/settled/actual-no-JS browser gate. Full build,
lint, candidate and live verification are mandatory before calling it released.
