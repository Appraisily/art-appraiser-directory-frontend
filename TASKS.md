# Accepted audit tasks

4 accepted tasks from 7 Claude candidates.

- [ ] **LOW — Unbounded regex lookahead can delete Antique-directory link lists during Articles Art-link remediation** (`repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs:91`)
  - Change: Match the <ul> content into a capture group and perform the Art-link check inside a replacer callback on the captured list content (returning the original match when the list has no Art links), instead of using a document-wide lookahead.
  - Regression test: Fixture unit test on transform(): given HTML with the intro paragraph, an antique-only <ul>, and an Art link elsewhere, assert the antique links survive; given a <ul> that does contain an Art city link, assert it is replaced.
  - Evidence: The document-wide lookahead is structurally unsafe, but a scan of all 13,638 baseline HTML files found zero documents with an antique-only matched list and a later Art location link. The frozen candidate therefore shows no evidence of this deletion; total Antique-host links increased from 12,747 to 14,019. Accept as future transformer hardening, downgraded from medium.
  - Verify: `rg -n If.you.want.an.in-person.inspection repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs`, `node baseline corpus scan for antique-only list plus later Art link`, `rg -o antique-appraiser-directory links in baseline and candidate`

- [ ] **LOW — Articles remediation aborts mid-run on unregistered route, leaving partially rewritten candidate with no receipt** (`repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs:117`)
  - Change: Treat unregistered routes as conflict records (like the existing baseline-mismatch path) and skip the file, or run transform over all files first and only write after the whole tree validates; always emit the receipt in a finally block.
  - Regression test: Integration test over a temp public dir with two files — one remediable, one containing an unregistered /appraiser/ Art link — asserting either no files are modified or a receipt/conflict record is emitted covering the modified file.
  - Evidence: The script can throw from canonicalTarget after earlier files have been atomically replaced and before the receipt is written. The current frozen run completed with its receipt and full validator, so this is a rerun/process-integrity hardening task rather than damage to the candidate.
  - Verify: `rg -n function.canonicalTarget.for.*filename.writeFile.rename.receipt repos/frontends/articles-static/scripts/remediate-art-directory-links.mjs`, `node check-art-directory-recovery-links.mjs --public-dir frozen-candidate`

- [ ] **LOW — Antique-side remediation lacks the atomic-write and baseline-conflict safeguards of its Articles counterpart** (`repos/frontends/antique-appraiser-directory-frontend/scripts/remediate-art-directory-links.mjs:39`)
  - Change: Reuse the Articles pattern: write to a sibling temp file and rename, and add an optional --baseline-dir hash gate; smallest fix is the temp+rename change.
  - Regression test: Unit test that stubs fs.writeFile to fail on the second file and asserts no file is left partially written (i.e., writes go through a temp+rename helper), plus a test asserting the script refuses to modify a file whose hash differs from a supplied baseline.
  - Evidence: The Antique transformer writes directly and does not bind inputs to an immutable baseline. Its completed current receipt and passing static contracts show no present corruption, but it should use detached atomic writes and a baseline hash gate before future reuse.
  - Verify: `rg -n writeFile.rename.baseline.beforeSha256.receipt repos/frontends/antique-appraiser-directory-frontend/scripts/remediate-art-directory-links.mjs`, `npm --prefix antique-appraiser-directory-frontend run check:static`

- [ ] **LOW — inject-related-guides --refresh inserts a duplicate section when only a legacy-format related-guides block exists** (`repos/agents/article-agent/scripts/inject-related-guides.mjs:489`)
  - Change: Before inserting, remove any block matched by the legacy patterns (or extend relatedSectionMatch to cover the legacy id/class forms) so refresh always replaces rather than appends.
  - Regression test: Extend test/relatedGuidesContract.test.mjs with a legacy-format fixture run under --refresh, asserting exactly one related-guides section exists in the output.
  - Evidence: The refresh path recognizes legacy sections in its skip gate but relatedSectionMatch cannot replace the legacy id-only form. Corpus inspection found 96 legacy-only documents, so a future --refresh can append a second block. Existing duplicate headings are already present in the immutable baseline and were not introduced by this Art-link candidate.
  - Verify: `sed -n 296,352p and 374,525p article-agent/scripts/inject-related-guides.mjs`, `node corpus scan for legacy-only related-guide documents`, `rg Related.Guides baseline and candidate sample`
