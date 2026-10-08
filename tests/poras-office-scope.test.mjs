import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const root = new URL('../', import.meta.url), origin = 'https://art-appraisers-directory.appraisily.com';
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const slugs = ['boston-poras-fine-arts-appraiser-meeting-all-your-fine-art-appraisal-needs',
  'new-york-poras-fine-arts-appraiser-meeting-all-your-fine-art-appraisal-needs',
  'poras-fine-arts-appraiser-meeting-all-your-fine-art-appraisal-needs'];
const row = slug => records.find(record => record.slug === slug);
function document(file, fn) {
  const dom = new JSDOM(read(file)); try { fn(dom.window.document); } finally { dom.window.close(); }
}
function assertPractice(node, slug) {
  assert.equal(node['@type'], 'ProfessionalService'); assert.equal(node['@id'], `${origin}/appraiser/${slug}/#provider`);
  assert.equal(node.address, undefined); assert.equal(node.founder, undefined); assert.equal(node.worksFor, undefined);
  assert.equal(node.hasCredential, undefined); assert.equal(node.image, undefined);
  assert.deepEqual(node.sameAs, ['https://www.fineartsappraiser.com/']);
  assert.equal(node.dateModified, '2026-08-30'); assert.equal(node.name, row(slug).name);
}
for (const slug of slugs) test(`${slug}: limited practice record without an invented city office`, () => {
  const record = row(slug); assert.equal(record.publicationStatus, 'limited'); assert.equal(record.verifiedAt, '2026-08-30');
  assert.equal(record.fieldEvidence?.primary_location?.decision, 'omit');
  assert.equal(record.fieldEvidence.primary_location.checkedAt, '2026-10-08');
  assert.equal(record.fieldEvidence.qualification, undefined);
  document(`public_site/appraiser/${slug}/index.html`, doc => {
    assert.equal(providerSchemas(doc).length, 1); assertPractice(providerSchemas(doc)[0], slug);
    assert.doesNotMatch(doc.title, /Art Appraiser in|Local Appraisal|Boston|New York|Fargo/);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /E\. Linda Poras/);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /coverage|office/);
    assert.match(doc.querySelector('[data-provider-field-review]').textContent, /October 8, 2026/);
    assert.equal(doc.querySelector('[data-gtm-cta="website"]').getAttribute('href'), record.sourceUrl);
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]'), null);
    assert.equal(doc.querySelector('nav a[href="/appraiser/"]').textContent.trim(), 'Appraisers');
    assert.deepEqual(inspectProviderFields(record, doc), { failures: [], reviewFlags: [], scopeFailures: [] });
  });
});
test('hubs, facets, feeds and indexing inventory consistently omit the three offices', () => {
  document('public_site/appraiser/index.html', doc => {
    for (const slug of slugs) {
      const li = doc.querySelector(`a[href="/appraiser/${slug}/"]`).closest('[data-browse-item]');
      assert.equal(li.dataset.browseFacet, 'Location not listed');
      assert.equal(li.querySelector('.browse-meta').textContent, 'Primary office not listed');
    }
    const facets = new Set([...doc.querySelectorAll('[data-browse-item]')].map(li => li.dataset.browseFacet).filter(Boolean));
    assert.deepEqual(new Set([...doc.querySelectorAll('select[data-browse-facet] option')].map(option => option.value).filter(Boolean)), facets);
  });
  document('public_site/location/index.html', doc => {
    for (const slug of slugs) assert.equal(doc.querySelector(`a[href="/appraiser/${slug}/"]`).textContent, `${row(slug).name} — location not listed`);
  });
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const feed = JSON.parse(read(file)).appraisers; assert.equal(feed.length, 209);
    for (const slug of slugs) { const provider = feed.find(p => p.slug === slug); assert.equal(provider.address, undefined); assert.equal(provider.source.verifiedAt, '2026-08-30'); }
  }
  const index = JSON.parse(read('public_site/indexing-manifest.json')).profiles;
  for (const slug of slugs) { const provider = index.find(p => p.slug === slug); assert.equal(provider.city, ''); assert.equal(provider.region, ''); }
  const overlays = JSON.parse(read('data/fair-overlay-matches.json')).overlays;
  assert.ok(!overlays.some(record => slugs.includes(record.slug)));
});
test('negative fixtures reject borrowed offices, cross-record FAIR equivalence and practitioner substitution', () => {
  for (const slug of slugs) document(`public_site/appraiser/${slug}/index.html`, doc => {
    const node = providerSchemas(doc)[0];
    for (const mutation of [wrong => { wrong.address = { '@type': 'PostalAddress', addressLocality: 'Boston' }; },
      wrong => { wrong.sameAs.push('https://fairappraisers.org/appraisers/poras-fine-arts-appraisal-serving-n-e-brooklyn-ny/'); },
      wrong => { wrong['@type'] = 'Person'; wrong.name = 'E. Linda Poras'; }, wrong => { wrong.dateModified = '2026-10-08'; }]) {
      const wrong = structuredClone(node); mutation(wrong); assert.throws(() => assertPractice(wrong, slug));
    }
    const script = doc.querySelector('script[type="application/ld+json"]'), nodes = JSON.parse(script.textContent);
    nodes[0].address = { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY' };
    script.textContent = JSON.stringify(nodes);
    assert.ok(inspectProviderFields(row(slug), doc).failures.some(finding => finding.code === 'omitted-location-still-published'));
  });
});
test('all four unpublished variants remain excluded and without new field scope', () => {
  const unpublished = records.filter(record => /poras/i.test(record.slug) && !slugs.includes(record.slug));
  assert.equal(unpublished.length, 4);
  const assertUnpublished = record => {
    assert.equal(record.publicationStatus, 'under_review'); assert.equal(record.sourceUrl, '');
    assert.deepEqual(record.claimScope, []); assert.equal(record.fieldEvidence, undefined);
  };
  for (const record of unpublished) {
    assertUnpublished(record); assert.ok(!read('public_site/sitemap.xml').includes(record.previousUrl));
    const revived = structuredClone(record); revived.publicationStatus = 'limited';
    assert.throws(() => assertUnpublished(revived), 'An unpublished Poras variant cannot silently regain eligibility');
  }
});
