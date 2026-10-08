# Reviewed profiles: field provenance

October 8, 2026. This source-only change assesses all fourteen reviewed profiles
and records support for **36 existing fields: 26 service/specialty fields and ten
contact-locality fields**. It does not change public HTML, feeds, routes, schema,
eligibility, provider names/IDs or original provider-review dates. It does not
deploy a new static artifact or demonstrate a Google outcome.

## Accepted scope

Each added manifest entry contains the exact existing value, a provider-owned
source URL, a separately dated field check and raw-source SHA-256 snapshots.
The sources were retrieved October 7 and reviewed at field level October 8.
The selected DeCarrera appraisal capture has an explicitly batch-level timestamp;
it is not misrepresented as an individually timed request.
The new field date is not a new provider verification date. Service statements
are provider-attributed, not independent credential or report-acceptance checks.
Existing qualification, location-omission and service-area entries stay intact.

| Profile | Existing fields supported | Provider-owned sources |
| --- | --- | --- |
| AFP Art Consulting | Media/periods, appraisal/advisory services, Boston base | [Biography](https://afpartconsulting.com/bio), [services](https://afpartconsulting.com/art-consulting-services) |
| Brenda Simonson-Mohle | Own fine-art media, report uses, Dallas contact locality | [Appraisal](https://signetart.com/art-appraisal/), [private-client services](https://signetart.com/private-client-services/) |
| Heidi Vaughan Fine Art | Fine art/Texas artists, collection valuation, report uses, Houston contact locality | [About](https://heidivaughanfineart.com/about) |
| Jennifer L. Stoots | Own photographs/archives, contemporary/Northwest/artist-estate scope and services | [Home](https://photostoots.com/) |
| Open to the Public | Photography/postwar/contemporary media, appraisal/consulting services, Los Angeles base | [Appraisals](https://opentothepublic.art/art-appraisals/), [About](https://opentothepublic.art/about/), [home](https://opentothepublic.art/) |
| Wilson Art Services | Attributed art/research scope, collection/advisory services, Philadelphia base | [Official site](https://www.wilsonartservices.com/) |
| Spalding Nix Fine Art | Fine-art work within personal-property appraisal and acquisition/sale advisory | [Appraisals](https://www.spaldingnixfineart.com/appraisals), [advisory](https://www.spaldingnixfineart.com/art-advisory) |
| St. Lifer Art | Existing media, periods/regions, services and New York base | [Appraisal services](https://stliferart.com/appraisals/appraisal-services/), [home](https://stliferart.com/) |
| MIR Appraisal Services | Existing media/periods, research, appraisal/advisory services, Chicago contact locality | [Home](https://www.mirappraisal.com/), [items](https://www.mirappraisal.com/what-we-appraise), [reports](https://www.mirappraisal.com/appraisal-reports) |
| Jaynes Appraisals | Existing media, appraisal/inventory/collection services, Seattle base | [Appraisals](https://www.jaynesappraisals.com/appraisals), [home](https://www.jaynesappraisals.com/) |
| Jeanie Craig | Collection types/documentation, appraisal/management services, Mill Valley mailing locality | [Home](https://appraiserart.com/), [appraisals](https://appraiserart.com/appraisals/), [contact](https://appraiserart.com/contact/) |
| Joette Pierce & Associates | Newport Beach business base only | [Home](https://www.joettepierceappraisals.com/) |
| WorthWise | Fine art/separate antiques and existing report uses | [Home](https://worthwiseappraisers.com/) |
| DeCarrera Fine Art | Existing periods, advisory and appraisal-network offering | [Home](https://dcfineart.com/), [appraisals](https://dcfineart.com/appraisals/) |

No provider marketing about fees, turnaround, membership, tax qualifications or
universal insurer/court/IRS acceptance is imported. A colleague/network service
does not become the named person's expertise. Jeanie Craig's mailing address is
not a walk-in office; service coverage is not another location. The existing
WorthWise omission and DeCarrera contact/coverage distinction remain unchanged.

## Explicitly unresolved

- Jennifer Stoots' Portland locality appears in a dated 2025 CV. The current
  [contact page](https://photostoots.com/contact/) does not establish a current
  primary office; the locality finding remains.
- Spalding Nix's sources establish Atlanta/Southeast work and gallery context.
  A selected October 8 [contact retrieval](https://www.spaldingnixfineart.com/contact)
  exposes address/map headings without a static address. Coverage, birth or
  employment history does not clear the primary-office finding.
- Joette Pierce's existing certification wording is not a medium. Neither of
  its two service/specialty fields is attested here. Its current Open Graph and
  business-schema descriptions repeat unqualified firm-accreditation marketing;
  the primary meta description already attributes the claim to the firm. A separate bounded public
  correction must attribute or omit that wording across every affected surface,
  with regression, synchronization and normal release/live gates. Existing
  provider-attributed qualification evidence is not independent accreditation.

These four remaining reviewed-profile findings are not the whole directory's
remaining debt. T05, T09 and T20 stay open. Provider-specific selection/process
enhancements still require the original cohort readouts; no content experiment
or protected measurement date is changed by this evidence ledger.

## Verification

`tests/reviewed-profile-field-provenance.test.mjs` fails on missing provenance,
checks original identity reviews, exact public field values and source/date
boundaries, and rejects foreign-source, unscoped and mismatched-value fixtures.
It deliberately retains the two uncertain localities and Joette service gaps.
The repository resource-test gate includes the regression. Independent private
checks compare every public byte, all original manifest fields, the exact audit
delta and unrelated shared repository state. An ordinary passing build does not
waive the strict audit's remaining findings or prove indexing.

Private source captures, decisions and acceptance evidence are in
`/srv/manager/seo/2026-10-07-art-directory-indexability-audit/`.
