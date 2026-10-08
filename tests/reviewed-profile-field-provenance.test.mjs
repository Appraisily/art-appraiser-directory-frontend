import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('data/provider-publication-manifest.json', root), 'utf8'));
const reviewed = [
  ['afp-art-consulting-llc-fine-art-consulting-appraisals-research-writing-and-collections-man', '2026-07-15', 'https://afpartconsulting.com/bio', 'https://afpartconsulting.com/art-consulting-services'],
  ['brenda-simonson-mohle', '2026-10-02', 'https://signetart.com/private-client-services/', 'https://signetart.com/art-appraisal/'],
  ['heidi-vaughan-ma-isa-am', '2026-07-15', 'https://heidivaughanfineart.com/about', 'https://heidivaughanfineart.com/about'],
  ['jennifer-l-stoots-aaa-certified-phototgraphy-and-art-appraiser', '2026-10-02', 'https://photostoots.com/', 'https://photostoots.com/'],
  ['open-to-the-public', '2026-07-15', 'https://opentothepublic.art/art-appraisals/', 'https://opentothepublic.art/art-appraisals/'],
  ['sarah-ann-wilson-art-services', '2026-07-15', 'https://www.wilsonartservices.com/', 'https://www.wilsonartservices.com/'],
  ['spalding-nix-fine-art', '2026-10-02', 'https://www.spaldingnixfineart.com/appraisals', 'https://www.spaldingnixfineart.com/appraisals'],
  ['st-lifer-art-inc-international-art-appraiser', '2026-07-15', 'https://stliferart.com/appraisals/appraisal-services/', 'https://stliferart.com/appraisals/appraisal-services/'],
  ['mir-appraisal-services', '2026-09-30', 'https://www.mirappraisal.com/', 'https://www.mirappraisal.com/'],
  ['jaynes-appraisals', '2026-09-30', 'https://www.jaynesappraisals.com/appraisals', 'https://www.jaynesappraisals.com/appraisals'],
  ['jeanie-craig-art-appraisals', '2026-09-30', 'https://appraiserart.com/', 'https://appraiserart.com/'],
  ['worthwise-art-and-antiques-appraisers', '2026-10-01', 'https://worthwiseappraisers.com/', 'https://worthwiseappraisers.com/'],
  ['decarrera-fine-art', '2026-10-01', 'https://dcfineart.com/', 'https://dcfineart.com/'],
];
const localities = [
  [reviewed[0][0], 'Boston', 'MA', 'https://afpartconsulting.com/bio'],
  ['brenda-simonson-mohle', 'Dallas', 'TX', 'https://signetart.com/art-appraisal/'],
  ['heidi-vaughan-ma-isa-am', 'Houston', 'TX', 'https://heidivaughanfineart.com/about'],
  ['open-to-the-public', 'Los Angeles', 'CA', 'https://opentothepublic.art/'],
  ['sarah-ann-wilson-art-services', 'Philadelphia', 'PA', 'https://www.wilsonartservices.com/'],
  ['st-lifer-art-inc-international-art-appraiser', 'New York', 'NY', 'https://stliferart.com/'],
  ['mir-appraisal-services', 'Chicago', 'IL', 'https://www.mirappraisal.com/'],
  ['jaynes-appraisals', 'Seattle', 'WA', 'https://www.jaynesappraisals.com/'],
  ['jeanie-craig-art-appraisals', 'Mill Valley', 'CA', 'https://appraiserart.com/contact/'],
  ['joette-pierce-and-associates', 'Newport Beach', 'CA', 'https://www.joettepierceappraisals.com/'],
];
const provider = slug => manifest.providers.find(row => row.slug === slug);
const preservedIds = {
  [reviewed[0][0]]: 'provider:afp-art-consulting',
  [reviewed[2][0]]: 'provider:heidi-vaughan-ma-am',
  [reviewed[3][0]]: 'provider:jennifer-l-stoots',
  'sarah-ann-wilson-art-services': 'provider:wilson-art-services',
  'st-lifer-art-inc-international-art-appraiser': 'provider:st-lifer-fine-art',
};
test('field provenance cannot duplicate or promote the provider inventory', () => {
  assert.equal(manifest.providers.length, 866);
  assert.equal(new Set(manifest.providers.map(row => row.slug)).size, 866);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'verified').length, 14);
  assert.equal(manifest.providers.filter(row => row.publicationStatus === 'limited').length, 195);
});
function profile(slug, run) {
  const dom = new JSDOM(fs.readFileSync(new URL(`public_site/appraiser/${slug}/index.html`, root), 'utf8'));
  try { run(dom.window.document); } finally { dom.window.close(); }
}
function provenance(record, field, sourceUrl, scope) {
  const evidence = record.fieldEvidence?.[field];
  assert.ok(evidence, `${record.slug}: missing ${field}`);
  assert.equal(evidence.checkedAt, '2026-10-08');
  assert.equal(evidence.sourceUrl, sourceUrl); assert.ok(record.claimScope.includes(field));
  assert.equal(evidence.evidenceScope, scope); assert.equal(evidence.independentCredentialVerification, false);
  assert.ok(evidence.note.length > 40); assert.ok(evidence.sourceSnapshots.length >= 1);
  assert.equal(evidence.sourceSnapshots[0].sourceUrl, sourceUrl);
  for (const snapshot of evidence.sourceSnapshots) {
    assert.match(snapshot.bodySha256, /^[a-f0-9]{64}$/);
    assert.match(snapshot.retrievedAt, /^2026-10-07T/);
    assert.equal(new URL(snapshot.sourceUrl).hostname.replace(/^www\./, ''), new URL(record.sourceUrl).hostname.replace(/^www\./, ''));
  }
  return evidence;
}
for (const [slug, originalReview, specialtySource, serviceSource] of reviewed) {
  test(`${slug}: exact existing service labels have separately dated primary provenance`, () => {
    const record = provider(slug); assert.equal(record.verifiedAt, originalReview); assert.equal(record.publicationStatus, 'verified');
    assert.equal(record.canonicalProviderId, preservedIds[slug] || `provider:${slug}`);
    for (const [field, source] of [['specialties', specialtySource], ['appraisal_use_cases', serviceSource]]) {
      provenance(record, field, source, 'provider_attributed_existing_service_labels');
      profile(slug, document => {
        const result = inspectProviderFields(record, document);
        assert.deepEqual(result.failures, []);
        assert.equal(result.scopeFailures.some(row => row.field === field), false);
        const absent = structuredClone(record); delete absent.fieldEvidence[field];
        assert.ok(inspectProviderFields(absent, document).scopeFailures.some(row => row.field === field));
        const foreign = structuredClone(record); foreign.fieldEvidence[field].sourceUrl = 'https://fairappraisers.org/';
        assert.ok(inspectProviderFields(foreign, document).scopeFailures.some(row => row.field === field));
        const changed = structuredClone(record); changed.fieldEvidence[field].value = ['Unsupported scope'];
        assert.ok(inspectProviderFields(changed, document).failures.some(row => row.code === 'visible-service-or-specialty-evidence-mismatch'));
        const unscoped = structuredClone(record); unscoped.claimScope = unscoped.claimScope.filter(value => value !== field);
        assert.ok(inspectProviderFields(unscoped, document).scopeFailures.some(row => row.field === field));
      });
    }
  });
}
for (const [slug, city, region, source] of localities) {
  test(`${slug}: supported contact locality is not an inspection or walk-in guarantee`, () => {
    const record = provider(slug);
    const evidence = provenance(record, 'primary_location', source, 'provider_published_contact_locality');
    assert.deepEqual(evidence.value, { city, region, country: 'US' });
    assert.match(evidence.note, /walk-in|street|postal|office/);
    profile(slug, document => assert.deepEqual(inspectProviderFields(record, document).failures, []));
  });
}
test('unconfirmed locality is not cleared using old CV, coverage, history or an empty contact map', () => {
  for (const slug of [reviewed[3][0], 'spalding-nix-fine-art']) {
    const record = provider(slug); assert.equal(record.fieldEvidence?.primary_location, undefined);
    profile(slug, document => assert.ok(inspectProviderFields(record, document).scopeFailures.some(row => row.code === 'published-location-missing-field-evidence')));
  }
});
test('Joette certification wording is not attested as a medium or independent accreditation', () => {
  const record = provider('joette-pierce-and-associates');
  assert.equal(record.verifiedAt, '2026-10-01'); assert.equal(record.publicationStatus, 'verified');
  assert.equal(record.fieldEvidence.specialties, undefined); assert.equal(record.fieldEvidence.appraisal_use_cases, undefined);
  assert.equal(record.fieldEvidence.qualification.independentCredentialVerification, false);
  profile(record.slug, document => assert.equal(inspectProviderFields(record, document).scopeFailures.filter(row => row.code === 'published-service-or-specialty-missing-field-evidence').length, 2));
});
test('mailing locality, regional coverage and existing omitted offices retain their boundaries', () => {
  assert.match(provider('jeanie-craig-art-appraisals').fieldEvidence.primary_location.note, /mailing.*not a verified walk-in office/);
  assert.equal(provider('worthwise-art-and-antiques-appraisers').fieldEvidence.primary_location.decision, 'omit');
  assert.equal(provider('worthwise-art-and-antiques-appraisers').fieldEvidence.primary_location.checkedAt, '2026-10-07');
  assert.equal(provider('decarrera-fine-art').fieldEvidence.primary_location.checkedAt, '2026-10-07');
  assert.deepEqual(provider('decarrera-fine-art').fieldEvidence.primary_location.value, { city: 'Newport Beach', region: 'CA', country: 'US' });
});
