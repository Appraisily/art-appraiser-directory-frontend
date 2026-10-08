# Original holding cohort: locality provenance

October 8, 2026. Source-only evidence and regression change. All 26 remaining
locality findings from the original forty-record holding cohort were checked
against their recorded source, followed by ten specific linked About/contact
requests where these could resolve a real ambiguity. No provider was contacted,
form submitted, access protection bypassed, public file regenerated or Google
state changed.

## Four supported existing fields

| Exact provider record | Supported value | Primary source and boundary |
| --- | --- | --- |
| `appraisals-miami-fl-estate-and-appraisal-services-inc` | Miami, FL, US | [Named business](https://www.jewelryandcoinbuyers.com/) publishes a Miami contact address. Fine-art appraisal scope and dealer/report independence remain unconfirmed; locality support does not approve this as an Art specialist. |
| `isabelle-m-weiss` | Detroit, MI, US | [CollectorAnonymous](https://collectoranonymous.com/) explicitly names Isabelle Weiss as Detroit-based, with an agreeing contact locality. Not a separately verified personal street office, person/company equivalence or walk-in promise. |
| `lena-s-appraisal-services` | San Diego, CA, US | [Named firm](https://www.assetsappraisalservices.com/) states a San Diego base and matching contact locality. Southern California work is not additional offices; authentication, qualification and retail-independence marketing is not imported. |
| `lindsey-m-owen` | Chicago, IL, US | [Practice process/FAQ](https://www.loappraisals.com/chicago-art-appraiser-the-appraisal-process) describes Chicago headquarters, appointments only and no public office. Mailing locality is not an inspection premise or personal street address; national clients are not national branches. |

Each manifest entry has a separately dated October 8 field check, exact source
URL, retrieval timestamp and raw-body SHA-256. `independentCredentialVerification`
is false. The older August 30 identity reviews, canonical identifiers, primary
source actions, publication reasons and limited statuses stay exact. Only
`primary_location` is added to each record's claim scope; no specialties, report
uses, qualifications, street, inspection method, availability or guarantee is
attested by this change.

## Deliberately unresolved

The other 22 original-cohort locality findings remain in the strict queue. A
company contact does not establish its employee's personal office. A title,
past employment, regional service, association footer or HTTP 200 does not
establish current primary locality. A blocked or failed source does not prove
closure. Specifically:

- Anne Kelly Lewis's current [About page](https://fineartappraisalllc.com/about)
  now establishes the named person's relationship to the practice. Fort Worth
  appears as past gallery employment; the linked contact page publishes no
  current office. This supersedes the earlier sparse-homepage research limitation,
  not the old source-review date. Do not execute the old conditional suppression
  recommendation merely because the homepage is sparse.
- Winter's retrieved [home](https://www.auctionsappraisers.com/) identifies the
  named business and publishes Plainville, Connecticut as its contact locality.
  The current directory label is Hartford. The contact request returns 202 with
  no useful HTML and the appraisal page 403 in this ordinary retrieval. These
  are source-access observations, not a Google incident or closure proof. A
  reviewed Plainville contact correction must synchronize public consumers and
  pass the standard candidate/live gates; no replacement office is published here.
- 812 Maplewood's About says where it was founded; its contact does not prove
  the published Aspen primary office. Do not replace Aspen with its historical
  founding city. Elise's project history does not confirm Ranchos De Taos.
- Janet Ross's exact ISA profile mixes historical Sacramento and later Surf
  City practice statements. The association's Schaumburg footer is unrelated.
  Neither it nor an old biography becomes a provider-owned current office claim.
- Shelley's retrieved page describes Portland as a base and Bend as an office.
  Keep the primary-locality ambiguity open; do not silently choose one city.
- The Fine Art Group lists several firm offices, without establishing the
  directory's Miami primary locality. Do not infer a primary US office from the
  first footer address or national service coverage.

## Verification and completion boundary

`tests/holding-profile-locality-provenance.test.mjs` has twelve focused tests. The
before run fails ten missing-evidence checks. After evidence is added, positive
checks and absent/foreign/unscoped/date/value negatives protect exact existing
values and scope boundaries. All 22 unsupported locality findings are retained
as explicit negative coverage. The test is part of the full static build.

Independent manager verification checks every public byte against both baseline
and active release, exact changes to only four of 866 manifest records, unchanged
remaining manifest fields, original forty records and original 36-task contract,
shared directory utility bytes and foreign work. The strict queue must decrease
by exactly four locality findings, with all other findings and flags unchanged.
Full build and lint are required before the canonical-main backup push.

Because no deployable byte changes, this is not a new static release. T05/T09/T15
and the full goal remain open. Meaningful person/company and provider-selection
decisions need their own sourced public changes; broad content/media/link work
and all dated Google readouts retain the original experiment gates.

Private captures and acceptance evidence:
`/srv/manager/seo/2026-10-07-art-directory-indexability-audit/BATCH-AC.md`.
