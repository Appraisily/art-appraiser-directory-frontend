import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/provider-publication-manifest.json', root)));
const selected = [
  ['allison-gee-fine-art-appraisals', 'provider:allison-gee-fine-art-appraisals', 'https://fineart.services/services', ['Fine art appraisals'], ['Art appraisal services', 'Insurance appraisals', 'Estate and donation appraisals']],
  ['anderson-fine-art-appraisals', 'provider:anderson-fine-art-appraisals', 'https://www.art-appraisals.net/', ['Fine art appraisals', 'Estate valuations', 'Insurance appraisals', 'Donation appraisals'], ['Art appraisal services', 'Insurance appraisals', 'Estate and donation appraisals']],
  ['art-appraisals-of-new-england', 'provider:art-appraisals-of-new-england', 'https://www.artappraisalsne.com/01', ['Fine art appraisals', 'Estate valuations', 'Insurance appraisals', 'Donation appraisals'], ['Art appraisal services', 'Insurance appraisals', 'Estate and donation appraisals']],
  ['victoria-shaw-art-appraisals-advisory', 'provider:victoria-shaw-art-appraisals-and-advisory', 'https://www.artappraiser.co/services', ['Fine art appraisals', 'Art advisory', 'Estate valuations', 'Insurance appraisals'], ['Art appraisal services', 'Estate and insurance appraisals', 'Donation appraisals', 'Collection advisory']],
];
const record = slug => manifest.providers.find(row => row.slug === slug);
function profile(slug, run) {
  const dom = new JSDOM(fs.readFileSync(new URL(`public_site/appraiser/${slug}/index.html`, root), 'utf8'));
  try { run(dom.window.document); } finally { dom.window.close(); }
}
for (const [slug, id, source, specialties, services] of selected) {
  for (const [field, values] of [['specialties', specialties], ['appraisal_use_cases', services]]) {
    test(`${slug}: ${field} has exact separately dated provider-attributed evidence`, () => {
      const row = record(slug), evidence = row.fieldEvidence?.[field];
      assert.ok(evidence, `Missing ${field} evidence`);
      assert.equal(row.publicationStatus, 'limited'); assert.equal(row.verifiedAt, '2026-08-30');
      assert.equal(row.canonicalProviderId, id); assert.ok(row.claimScope.includes(field));
      assert.equal(evidence.checkedAt, '2026-10-08'); assert.equal(evidence.sourceUrl, source);
      assert.equal(evidence.evidenceScope, 'provider_attributed_existing_service_labels');
      assert.equal(evidence.independentCredentialVerification, false); assert.deepEqual(evidence.value, values);
      assert.match(evidence.note, /not.*(?:qualification|credential)/);
      assert.equal(evidence.sourceSnapshots[0].sourceUrl, source);
      for (const snapshot of evidence.sourceSnapshots) {
        assert.match(snapshot.retrievedAt, /^2026-10-08T/); assert.match(snapshot.bodySha256, /^[a-f0-9]{64}$/);
        assert.equal(new URL(snapshot.sourceUrl).hostname.replace(/^www\./, ''), new URL(row.sourceUrl).hostname.replace(/^www\./, ''));
      }
      profile(slug, document => {
        const result = inspectProviderFields(row, document);
        assert.deepEqual(result.failures, []); assert.equal(result.scopeFailures.some(finding => finding.field === field), false);
        for (const kind of ['absent', 'foreign', 'unscoped', 'invalid-date']) {
          const invalid = structuredClone(row);
          if (kind === 'absent') delete invalid.fieldEvidence[field];
          if (kind === 'foreign') invalid.fieldEvidence[field].sourceUrl = 'https://fairappraisers.org/';
          if (kind === 'unscoped') invalid.claimScope = invalid.claimScope.filter(value => value !== field);
          if (kind === 'invalid-date') invalid.fieldEvidence[field].checkedAt = '';
          assert.ok(inspectProviderFields(invalid, document).scopeFailures.some(finding => finding.field === field), `${kind} must retain the missing-scope finding`);
        }
        const changed = structuredClone(row); changed.fieldEvidence[field].value = ['Unsupported extra service'];
        assert.ok(inspectProviderFields(changed, document).failures.some(finding => finding.code === 'visible-service-or-specialty-evidence-mismatch' && finding.field === field));
      });
    });
  }
}
test('service support never attests an office, current credential or inspection format', () => {
  for (const [slug] of selected) {
    const row = record(slug);
    assert.equal(row.fieldEvidence?.primary_location, undefined);
    assert.equal(row.fieldEvidence?.qualification, undefined); assert.equal(row.fieldEvidence?.inspection, undefined);
    profile(slug, document => assert.ok(inspectProviderFields(row, document).scopeFailures.some(finding => finding.code === 'published-location-missing-field-evidence')));
  }
});
test('limited and reviewed inventory remains unchanged by service evidence', () => {
  assert.equal(manifest.providers.length, 866); assert.equal(new Set(manifest.providers.map(row => row.slug)).size, 866);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'verified').length, 14);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'limited').length, 195);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'under_review').length, 657);
});
