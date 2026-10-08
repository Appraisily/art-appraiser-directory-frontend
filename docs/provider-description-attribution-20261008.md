# Provider-description attribution

October 8, 2026. Joette Pierce & Associates' primary meta description and visible
summary already attribute the firm's ASA accreditation assertion. Its Open Graph
and provider-schema descriptions did not. They now use the existing attributed
primary description; both generated provider feeds derive the same description.

The official homepage was reviewed again on October 8. Its assertion is provider
marketing, not an independently verified firm credential. This correction does
not say that the assertion is false, attest certification or blanket report
acceptance, add an office, or change the October 1 source-review date. Provider
identity, URL, source, publication status and existing location remain unchanged.
The two service/specialty field findings remain open; certification is not an
art medium. Any replacements or new selection guidance follow the original
content-cohort measurement gates.

The shared field-evidence validator now covers explicit accreditation and
certified-appraiser wording in primary/social descriptions, own provider-schema
descriptions and existing `appraisers.json`/`directory.json` descriptions. A
documented provider-attributed claim marked as not independently verified must
keep attribution in the sentence making the claim, or omit that assertion.
Losing attribution is a ledger contradiction. Missing or other evidence is a
review lead, not proof of a false credential. Supported exact business-name
wording does not exempt a separate assertion; name-only ISA evidence does not
verify broader prose. This is not a general credential or legal-use verifier.

Regression coverage: `tests/provider-description-attribution.test.mjs` checks
the actual profile and both feeds, original identity/review date and the two
still-open field findings. Shared positive/negative fixtures are in
`/srv/repos/tools/directory-site-utils/tests/provider-description-attribution.test.mjs`.
The complete dated evidence and release disposition are tracked in
`/srv/manager/seo/2026-10-07-art-directory-indexability-audit/BATCH-X.md`.
