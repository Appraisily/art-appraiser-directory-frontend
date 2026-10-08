import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/provider-publication-manifest.json', root), 'utf8'));
const supported = [
  ['appraisals-miami-fl-estate-and-appraisal-services-inc', 'Miami', 'FL', 'https://www.jewelryandcoinbuyers.com/', 'provider_published_contact_locality', '2b06b82008c6a544c9acca59cfb68f946cf670750631ee28b0db0b32832df765'],
  ['isabelle-m-weiss', 'Detroit', 'MI', 'https://collectoranonymous.com/', 'provider_published_contact_locality', '7e9d7938407a5b1ad4862056ffc6d78f753e8e1c72ac58dd47ee9e3d2a457417'],
  ['lena-s-appraisal-services', 'San Diego', 'CA', 'https://www.assetsappraisalservices.com/', 'provider_published_contact_locality', '3b4436bd9a49d976db644045f8f265033b46bda91796d13a7e6f4ed43dd428c2'],
  ['lindsey-m-owen', 'Chicago', 'IL', 'https://www.loappraisals.com/chicago-art-appraiser-the-appraisal-process', 'provider_published_appointment_only_base', '411bdb7a720c32ece6181f4395dd0662bb26fe25b0fe56829871c8200dcb0843'],
];
const unresolved = [
  '812-maplewood', 'charles-barry-goldstein',
  'chris-ingalls', 'christine-guernsey', 'christine-h-anderson-isa-am',
  'connecticut-art-appraisals-llc-alizzandra-danker',
  'greg-c-brown', 'haney-appraisals-in-fine-art', 'heritage-fine-art-appraisers',
  'janet-l-ross', 'jessica-berger', 'kurt-shaw-company', 'lisa-austin-laa',
  'metropolitan-art-appraisers', 'shelley-hall-bend-art-appraisals',
  'the-fine-art-group', 'washington-fine-art-appraisers', 'williams-fine-art-gallery',
];
const provider = slug => manifest.providers.find(row => row.slug === slug);
function withProfile(slug, fn) {
  const dom = new JSDOM(fs.readFileSync(new URL(`public_site/appraiser/${slug}/index.html`, root), 'utf8'));
  try { fn(dom.window.document); } finally { dom.window.close(); }
}
for (const [slug, city, region, sourceUrl, scope, bodySha256] of supported) {
  test(`${slug}: separately dated evidence supports only the existing locality`, () => {
    const record = provider(slug), evidence = record.fieldEvidence?.primary_location;
    assert.ok(evidence, 'Missing primary-location evidence');
    assert.equal(record.publicationStatus, 'limited'); assert.equal(record.verifiedAt, '2026-08-30');
    assert.deepEqual(record.claimScope, ['identity', 'website', 'primary_location']);
    assert.deepEqual(Object.keys(record.fieldEvidence), ['primary_location']);
    assert.equal(evidence.checkedAt, '2026-10-08'); assert.equal(evidence.sourceUrl, sourceUrl);
    assert.deepEqual(evidence.value, { city, region, country:'US' });
    assert.equal(evidence.evidenceScope, scope); assert.equal(evidence.independentCredentialVerification, false);
    assert.ok(evidence.note.length > 100);
    assert.equal(evidence.sourceSnapshots.length, 1);
    assert.equal(evidence.sourceSnapshots[0].sourceUrl, sourceUrl);
    assert.equal(evidence.sourceSnapshots[0].bodySha256, bodySha256);
    assert.match(evidence.sourceSnapshots[0].retrievedAt, /^2026-10-08T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    withProfile(slug, document => {
      const result = inspectProviderFields(record, document);
      assert.deepEqual(result.failures, []);
      assert.equal(result.scopeFailures.some(row => row.code === 'published-location-missing-field-evidence'), false);
    });
  });
  test(`${slug}: absent, foreign, unscoped and changed locality evidence fail`, () => {
    const record = provider(slug); assert.ok(record.fieldEvidence?.primary_location);
    withProfile(slug, document => {
      const absent = structuredClone(record); delete absent.fieldEvidence.primary_location;
      assert.ok(inspectProviderFields(absent, document).scopeFailures.some(row => row.code === 'published-location-missing-field-evidence'));
      for (const mutate of [
        row => { row.fieldEvidence.primary_location.sourceUrl = 'https://fairappraisers.org/'; },
        row => { delete row.fieldEvidence.primary_location.checkedAt; },
        row => { row.claimScope = row.claimScope.filter(field => field !== 'primary_location'); },
      ]) {
        const changed = structuredClone(record); mutate(changed);
        assert.ok(inspectProviderFields(changed, document).failures.some(row => row.code === 'primary-location-evidence-invalid'));
      }
      const changed = structuredClone(record); changed.fieldEvidence.primary_location.value.city = 'Unsupported office';
      assert.ok(inspectProviderFields(changed, document).failures.some(row => row.code === 'primary-location-evidence-mismatch'));
    });
  });
}
test('Chicago appointment-only base is not a public inspection office or national branches', () => {
  const evidence = provider('lindsey-m-owen').fieldEvidence?.primary_location;
  assert.match(evidence?.note || '', /appointment-only/);
  assert.match(evidence.note, /no publicly accessible office/);
  assert.match(evidence.note, /mailing/);
  assert.match(evidence.note, /nationwide.*not.*offices/);
  assert.equal(evidence.value.street, undefined);
});
test('Miami contact support does not attest fine-art scope or dealer independence', () => {
  const record = provider(supported[0][0]);
  assert.match(record.fieldEvidence?.primary_location?.note || '', /fine-art.*unconfirmed/);
  assert.match(record.fieldEvidence.primary_location.note, /dealer/);
  assert.equal(record.fieldEvidence.specialties, undefined);
  assert.equal(record.fieldEvidence.appraisal_use_cases, undefined);
  assert.equal(record.fieldEvidence.qualification, undefined);
});
test('all 18 still-unsupported original-cohort localities retain strict findings', () => {
  assert.equal(unresolved.length, 18);
  for (const slug of unresolved) {
    const record = provider(slug);
    assert.equal(record.publicationStatus, 'limited'); assert.equal(record.verifiedAt, '2026-08-30');
    assert.equal(record.fieldEvidence?.primary_location, undefined, `${slug}: no evidence from outages, regional work, registry footer or company office`);
    withProfile(slug, document => assert.ok(inspectProviderFields(record, document).scopeFailures.some(row => row.code === 'published-location-missing-field-evidence'), slug));
  }
});
test('locality evidence does not change provider eligibility', () => {
  assert.equal(manifest.providers.length, 866);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'verified').length, 14);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'limited').length, 195);
});
