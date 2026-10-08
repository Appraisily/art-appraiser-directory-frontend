# Carrie Young and Elise Waters Olonia: Person and office-scope corrections

Reviewed October 8, 2026. This is a bounded factual correction for two existing
limited profiles, not a provider promotion, new city cohort or Google outcome.

## Primary evidence and decisions

| Existing profile | Primary provider evidence | Supported decision and boundary |
| --- | --- | --- |
| Carrie Young | [Leonard About](https://leonardappraisal.com/about/) names Carrie on the appraisal team and identifies Leonard Appraisal, LLC; [Contact](https://leonardappraisal.com/contact/) explicitly labels the Chicago address as mailing | Person with a sourced `worksFor` relationship; the firm is not her `sameAs`. Omit the unconfirmed Addison personal-office locality. Do not substitute the Chicago mailing address or import collective services/credentials. |
| Elise Waters Olonia | [Provider home](https://www.fineartservices.info/) names Elise and describes fine-art consultation, valuation and legacy planning; [Contact](https://www.fineartservices.info/contact) publishes no office; [Ted Egri project](https://www.fineartservices.info/journal/blog-post-title-one-4yyjn) is project history | Person without an inferred separate company or office. Omit the unconfirmed Ranchos de Taos locality. Provider-attributed work supports useful questions about assignment/report scope, not independently verified qualifications or recipient acceptance. |

The six provider snapshots and two FAIR records were retrieved successfully at
13:02 UTC on October 8. Their source URL, retrieval time and body SHA-256 are in
the separately dated `fieldEvidence` entries and manager
`/srv/manager/seo/2026-10-07-art-directory-indexability-audit/batch-af-source-captures.json`.
No provider contact, form submission, credential import or permission request
was made. The evidence records explicitly retain
`independentCredentialVerification: false`.

Both FAIR records contain multiple entity nodes. Only the exact matching Person
identifier is an entity equivalence:

- `https://fairappraisers.org/appraisers/carrie-young-addison-il/#person`
- `https://fairappraisers.org/appraisers/elise-waters-olonia-ranchos-de-taos-nm/#person`

The ordinary visible registry link may open the parent record; the typed metadata
and schema identify the matching Person. A shared parent URL is not equivalence
with the record's ProfessionalService node. FAIR supplies no imported office,
credential, verification status or service-scope evidence.

## Synchronized artifact contract

The two individually reviewed authored profiles use Person schemas, useful
provider-attributed summaries and visible dated field/source notes. Titles and
descriptions no longer promise an unconfirmed office or generic expert valuation.
Schema descriptions match metadata; unknown address/serviceType is omitted.
Breadcrumbs lead to the provider hub rather than a presumed local office.

Native provider-hub rows and filter facets say location not listed. Obsolete
location options are removed only when no other roster row uses them. The
location hub's visible labels and 209-entry ItemList agree. Metadata-only
maintenance and both public feed representations preserve the same unknown
locality and source facts. No city HTML or new route is introduced.

Both profiles retain their existing slug, canonical provider ID, primary source,
limited status, August 30 review and `claimScope: [identity, website]`. New
October 8 field checks do not replace that original identity review or establish
new art specialties, personal availability, credentials, report use or office.
Provider/Appraisily native destinations and governed attribution remain.

## Tests and broader task scope

`tests/carrie-elise-person-corrections.test.mjs` protects original status/date/ID,
evidence snapshots, Person identity, supported relationship, exact FAIR fragments,
metadata/source notes, handoffs, breadcrumbs, hubs/facets and both feeds. Negative
fixtures restore the old office, service entity and wrong FAIR entity identifier.
The suite is included in `test:resources` and the blocking static build.
Both routes are added to the existing initial/settled/real-no-JS browser matrix;
no previous route, timeout, wait, assertion or retry policy is removed or relaxed.

The holding-locality fixture now retains eighteen unresolved original-cohort
localities; these two have their own stronger omission/reintroduction negatives.
That does not reduce the original forty-record useful-disposition task, the
67-city requirement or any protected measurement date. T05/T09/T15 remain open
until their full requirements are met. Candidate/source success is not live
release or Google inclusion proof; those are recorded separately in manager
Batch AF evidence after their respective gates pass.
