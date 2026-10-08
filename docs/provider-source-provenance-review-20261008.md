# Recorded-source provenance review

October 8, 2026, UTC. Scope: source-audit detection and exact-record research,
not a public content release or a Google indexing result.

## Finding and boundary

Nine published limited profiles record an external registry or marketplace URL
as `sourceType: official_website` and label the native source action as the
official website. The source banner repeats that implication. Two URLs are
generic association homepages. A named association profile may be useful for
identity or its expressly reviewed designation; it is not a provider-owned
website. A historical sale page does not establish a current primary office.

`inspectProviderSourceProvenance` in the shared directory utilities reports
separate review leads for the recorded type, the visible source label and a
generic credential-body root. It does not change eligibility, declare a false
provider, rewrite a source, borrow a credential or resolve missing fields.
Unknown hosts remain unassessed. Host/date consistency in an existing field
ledger is not proof of provider ownership or factual approval.

## Exact affected records and next checks

| Existing route slug | Recorded source role | Narrow follow-up |
| --- | --- | --- |
| `alicia-e-weaver-isa-capp` | ISA association homepage | Keep the existing separately dated exact ISA designation and Prestige individual identity evidence; review which specific biography/profile should be the labeled source. Do not import a company office into the person. |
| `janet-l-ross` | Exact ISA member profile | Label the external profile accurately. Distinguish current contact evidence from the biography's historical Sacramento work; do not infer a new personal office. |
| `connecticut-art-appraisals-llc-alizzandra-danker` | AAA association homepage | Research the exact person/practice source before replacing the generic root. Do not borrow AAA's office, credentials or services. |
| `jason-preston-art-advisory-appraisals` | AAA member profile | Review exact identity and publisher scope. Retrieval was blocked; do not treat that as closure or unsupported identity. |
| `antique-and-fine-art-appraisal` | BBB business profile | Use an honest BBB/source label. Identity, locality and services need their own evidence; a blocked request proves none of those false. |
| `antique-and-fine-art-appraisals` | Antiques.com dealer directory | The retrieved record names the business and points to a separate website. Treat that link as a research lead, not proof of current ownership, office or services. |
| `case-antiques-inc-auctions-appraisals` | LiveAuctioneers auctioneer profile | Review the independently located provider appraisal/contact pages and distinguish headquarters from branch/service coverage. Do not infer an office from the auction marketplace. |
| `everard-auctions-appraisals` | LiveAuctioneers auctioneer profile | Seek an exact provider-owned appraisal/contact source; label the retained marketplace reference honestly. |
| `houston-houston-estate-sales-and-appraisals` | EstateSales.NET sale event | The retained URL describes a January 23–25, 2020 sale. Do not present it as the current company website or a provider office. Its native company link remains a lead requiring exact current-identity review. |

## Regression and release requirements

The focused shared suite has 75 tests: 62 existing field/description fixtures
plus thirteen source-provenance fixtures. The canonical utility `check` command
includes the new regressions. The Alicia identity regression now expects the
three exact source findings instead of incorrectly asserting no review debt;
its Person, affiliation, omitted-office and designation checks remain intact.

Current source/active audits report 288 field-scope findings unchanged, plus
twenty provenance review findings across nine profiles: nine recorded-type,
nine visible-label and two generic-root findings. Antique's 936 field findings
and twelve existing review flags remain unchanged. These figures describe an
audit, not the number of false claims or Google crawl blockers.

Before public correction, synchronize source type/URL, visible source action and
banner, provider schema and existing machine feeds as applicable. Keep native
links and governed tracking intact, preserve original review dates unless that
particular review is renewed, and do not change publication status by inference.
Run focused negatives and full build/lint, inspect the exact artifact delta,
then follow the immutable canonical-main release flow and independent live
proof. Keep the original cohort measurement dates; no new GSC submissions,
Indexing API jobs, automated dashboard actions or collectors are implied.

## Evidence and primary publisher-role references

The private dated field inventory, raw response hashes, failed retrievals,
command receipts, full task contract and source-only acceptance are maintained
in `/srv/manager/seo/2026-10-07-art-directory-indexability-audit/`.
Fifteen bounded source requests include eight HTTP 200 responses and seven
403 responses. Retrieval alone is not content approval; the Antiques.com
business appears in body text despite its generic page title. BBB CSS parsing
diagnostics during private extraction are not browser/rendering proof.

Publisher-role references: [ISA About](https://www.isa-appraisers.org/about),
[AAA About](https://appraisersassociation.org/about-us),
[BBB About](https://www.bbb.org/about),
[Antiques.com dealer search](https://www.antiques.com/dealer_search.php),
[LiveAuctioneers About](https://www.liveauctioneers.com/about), and
[EstateSales.NET](https://www.estatesales.net/).
AAA and LiveAuctioneers role text was accessible through search/browser cache
but direct raw retrieval returned 403; those access paths are not interchangeable.
