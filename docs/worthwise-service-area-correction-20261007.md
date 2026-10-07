# WorthWise / Denver: bounded factual correction

October 7, 2026. Existing provider and city URLs, unchanged eligibility. No new
office, provider, city, credential, fee, photo, rating or report-acceptance claim.

## Evidence and claim boundaries

- [Provider-owned fine-art page](https://worthwiseappraisers.com/art-appraisal-services-denver/): paintings, drawings, prints, sculpture and photography; official Denver-targeted page. The site describes Colorado Front Range service. This supports a regional option, not a Denver office or guaranteed inspection.
- [Provider-owned contact page](https://worthwiseappraisers.com/contact-appraisal-services/): inquiry inputs include the property's city/state and documentation; no confirmed office is given in the inspected content. Absence of an address does not prove that an office does not exist.
- [ISA individual record](https://www.isa-appraisers.org/find-an-appraiser/profile/3284/candace-a-hill): links WorthWise and lists an Arvada contact locality in the broader Boulder–Denver area. This is association-owned person evidence, not a provider-owned office page. Neither its street address nor a credential is imported.

The old profile asserted a Denver practice/address while the Denver city page
asserted that no reviewed provider was published. Both were visible in public
HTML. Simply adding the old profile's Denver address to the roster would have
preserved an unsupported office claim.

## Intended correction

The profile omits its unconfirmed office address, describes the documented
Colorado Front Range service area, and separates its original October 1 review
from the October 7 location/service-area check. Primary-location claim scope
records a checked omission; it does not certify an office. The original
`verifiedAt` and schema review date are preserved. `fieldEvidence` contains the
specific new decision and source date.

Denver lists exactly one accurately labeled regional option before general
guidance, with native provider-profile and official fine-art links. Its ItemList,
route feed, city decision and combined feeds must agree. The Art-only job and
existing Antique link remain intact. No other city is re-authored.
Only WorthWise's corresponding browse-hub labels and comparison-table locality
cell change for factual parity. The comparison change is an explicitly recorded
overlap with the October 6 resource experiment, not a new content treatment.

The Art consistency validator requires explicit provider-owned, dated
service-area evidence, an exact approved city, an existing reviewed identity and
an omitted office. An unknown address alone does not authorize city coverage.
The older Jeanie Craig mailing-locality exception is unchanged. Shared Antique
and FAIR eligibility rules are not changed.

## Verification and measurement

`tests/denver-service-area.test.mjs` fails on the pre-correction source. It covers
visible/schema/feed omission, original dates, exact roster parity, card ordering,
explicit regional labeling and negative scope/source/date/identity/office cases.
The full browser gate includes Denver and WorthWise at desktop/390/320, with and
without scripts, plus existing filter/print/privacy/handoff/terminal checks.
Full build/lint, registry/feed/route parity, isolated nginx, source/main backup,
immutable release and independent live checks remain mandatory.

This is a factual, overlapping intervention for T05/T09/T18, not a new T19 city
pilot or a completed T18 census. The protected October 2 Dallas/Portland/Atlanta
six-page cohort is not edited. Original October 12/26, October 14/28,
October 16/November 2 and October 20/November 3 measurement dates remain unchanged.
Public release proof is not evidence of Google crawling, inclusion or traffic.
