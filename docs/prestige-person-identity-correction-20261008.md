# Prestige individual identity correction — October 8, 2026

Six existing limited listings are individual people, not separate local businesses:
`alicia-e-weaver-isa-capp`, `alicia-weaver`, `edward-kitson`,
`elizabeth-lake-lovett`, `elizabeth-lovett`, and `stephanie-calman`.

## Reviewed primary sources and boundaries

The [official team page](https://prestigeestateservices.com/appraisals/meet-our-appraisers/)
names Alicia Weaver, Edward Kitson, Elizabeth Lovett and Stephanie Calman among
Prestige's personal property appraisers. The
[Alicia biography](https://prestigeestateservices.com/appraiser/alicia-weaver/)
identifies her founder/Head of Appraisals role and project-based travel. The
[Elizabeth biography](https://prestigeestateservices.com/appraiser/elizabeth-lovett/)
uses both Elizabeth Lovett and Elizabeth Lake Lovett. ISA
[individual 2647](https://www.isa-appraisers.org/find-an-appraiser/profile/2647/alicia-weaver)
ties Alicia E Weaver to the same practice and short-name identity.

These sources establish the named individuals and provider-attributed affiliation;
they do not establish the previous Dallas, Las Vegas, Palm Beach or Fort Worth
personal-office assignments. Company addresses, image alt text, service regions and
company-wide assurances are not person-level office or qualification evidence.
No alternative city, portrait, provider offering, personal competency approval,
availability, report acceptance or new credential is inferred.

FAIR's Prestige national-network page has a company `ProfessionalService` entity
and no named `Person`. Five individuals' company equivalences are removed.
FAIR's Alicia page does have an exact named `Person`: the existing link is narrowed
to `https://fairappraisers.org/appraisers/alicia-e-weaver-boulder-co/#person`.
No FAIR business/address/portrait/offerings are imported.

## Exact changes

- Six profile primary nodes become stable `Person` entities with an external
  `worksFor` organization reference to Prestige. No published Art company record
  exists, so no company page or internal company ID is invented.
- Addresses and business-only `serviceType` are omitted. Metadata and breadcrumbs
  stop presenting unsupported local-business claims. Provider-attributed identity
  and role paragraphs replace generic holding copy; dated native primary-source
  links remain available without JavaScript.
- Person `sameAs` references use exact individual biographies; Alicia's full-name
  record also retains the ISA individual profile and typed FAIR Person. Edward and
  Stephanie have no guessed biography or company `sameAs` reference.
- Hub labels, facets, ItemLists and generated machine feeds reflect the same
  omitted individual locations. Empty facet options are removed only if no
  remaining row uses them.
- Original names, routes, IDs, limited status, August 30 reviews, reasons and
  official-website CTAs are preserved. Alicia's separately governed October 7
  ISA designation evidence is byte-for-byte unchanged; no credential is copied to
  the shorter Alicia record or another team member.

## Acceptance and deferred decisions

`tests/prestige-person-identity.test.mjs` covers all six records, hubs, feeds,
original reviews, FAIR entity types and negative office/company/credential
fixtures. `npm run test:resources` includes it; the settled-document browser suite
includes the six routes at desktop, 390px and 320px in actual JS/no-JS modes.

This is a bounded factual correction, not acceptance of all directory field debt,
all original holding profiles or T17's complete identity disposition. The Alicia
and Elizabeth short/full-name pairs are not two appraiser choices, but their URLs
remain until the useful-target, content, historical-URL, feed and one-hop routing
gates permit consolidation. The 24 suppressed Prestige variants are unchanged.
Protected October/November readouts remain unchanged. Source tests, a release and
independent public proof do not establish Google inclusion, ranking or revenue.

Private raw sources, hashes, retrieval times and batch acceptance live in
`/srv/manager/seo/2026-10-07-art-directory-indexability-audit/` under batch T.
