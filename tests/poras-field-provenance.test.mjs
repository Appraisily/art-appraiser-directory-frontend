import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const manifest = JSON.parse(read('data/provider-publication-manifest.json'));
const slugs = [
  'boston-poras-fine-arts-appraiser-meeting-all-your-fine-art-appraisal-needs',
  'new-york-poras-fine-arts-appraiser-meeting-all-your-fine-art-appraisal-needs',
  'poras-fine-arts-appraiser-meeting-all-your-fine-art-appraisal-needs',
];
const values = {
  specialties: ['Fine art appraisals', 'Estate valuations'],
  appraisal_use_cases: ['Art appraisal services', 'Insurance appraisals', 'Estate and donation appraisals'],
};
const snapshots = {
  'https://fineartsappraiser.com/': 'e04389c941e7823100a51e0c5778a2a98d3d743b3e499e843e0cb6a7779d6e96',
  'https://fineartsappraiser.com/insurance': 'f14e02bcdaf4a29f70b156b2af121b5cd02af362459d01e156022aacb669431a',
  'https://fineartsappraiser.com/donation': '79be380af46fe4335ac675d48fcfa5ce6f54265d518183e8727dc41819638625',
  'https://fineartsappraiser.com/estate': '8c61d70b0a1394f7529ee1129aca73e5d4d0e822a85cb3df5b733e0d40a273c4',
};
function withProfile(slug, fn) {
  const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`));
  try { fn(dom.window.document); } finally { dom.window.close(); }
}
for (const slug of slugs) {
  test(`${slug}: separately dated, provider-attributed evidence for existing service labels`, () => {
    const row = manifest.providers.find(record => record.slug === slug);
    assert.equal(row.publicationStatus, 'limited'); assert.equal(row.verifiedAt, '2026-08-30');
    assert.equal(row.sourceUrl, 'https://www.fineartsappraiser.com/');
    assert.equal(row.fieldEvidence?.primary_location, undefined);
    assert.equal(row.fieldEvidence?.qualification, undefined);
    for (const [field, value] of Object.entries(values)) {
      const evidence = row.fieldEvidence?.[field]; assert.ok(evidence, `Missing ${field} provenance`);
      assert.ok(row.claimScope.includes(field)); assert.deepEqual(evidence.value, value);
      assert.equal(evidence.checkedAt, '2026-10-08'); assert.equal(evidence.sourceUrl, 'https://fineartsappraiser.com/');
      assert.equal(evidence.evidenceScope, 'provider_attributed_existing_service_labels');
      assert.equal(evidence.independentCredentialVerification, false);
      assert.match(evidence.note, /office|location/); assert.match(evidence.note, /historical|equivalence/);
      assert.equal(evidence.sourceSnapshots.length, field === 'specialties' ? 2 : 4);
      for (const snapshot of evidence.sourceSnapshots) {
        assert.equal(snapshot.bodySha256, snapshots[snapshot.sourceUrl]);
        assert.ok(snapshot.retrievedAt.startsWith('2026-10-08T'));
      }
    }
    withProfile(slug, doc => {
      const fields = inspectProviderFields(row, doc);
      assert.deepEqual(fields.failures, []); assert.deepEqual(fields.reviewFlags, []);
      assert.equal(fields.scopeFailures.length, 1, 'The unsupported locality remains explicitly open');
      assert.equal(fields.scopeFailures[0].code, 'published-location-missing-field-evidence');
    });
  });
}
test('source changes, stale scope and mismatched label values cannot clear the checker', () => {
  for (const slug of slugs) withProfile(slug, doc => {
    const original = manifest.providers.find(row => row.slug === slug);
    const missing = structuredClone(original); delete missing.fieldEvidence;
    assert.equal(inspectProviderFields(missing, doc).scopeFailures.length, 3);
    for (const field of Object.keys(values)) {
      const foreign = structuredClone(original);
      foreign.fieldEvidence[field].sourceUrl = 'https://fairappraisers.org/';
      assert.ok(inspectProviderFields(foreign, doc).scopeFailures.some(row => row.field === field));
      const wrong = structuredClone(original); wrong.fieldEvidence[field].value = ['Unsupported scope'];
      assert.ok(inspectProviderFields(wrong, doc).failures.some(row => row.code === 'visible-service-or-specialty-evidence-mismatch'));
      const unscoped = structuredClone(original); unscoped.claimScope = unscoped.claimScope.filter(scope => scope !== field);
      assert.ok(inspectProviderFields(unscoped, doc).scopeFailures.some(row => row.field === field));
    }
  });
});
test('all four unpublished Poras variants retain their original suppression', () => {
  const unpublished = manifest.providers.filter(row => /poras/i.test(row.slug) && !slugs.includes(row.slug));
  assert.equal(unpublished.length, 4);
  for (const row of unpublished) {
    assert.equal(row.publicationStatus, 'under_review'); assert.equal(row.sourceUrl, '');
    assert.deepEqual(row.claimScope, []); assert.equal(row.fieldEvidence, undefined);
    assert.ok(!read('public_site/sitemap.xml').includes(row.previousUrl));
  }
});
