import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { assertProviderHandoff, captureProviderHandoff } from '../scripts/provider-handoff-contract.mjs';
const root = new URL('../', import.meta.url), origin = 'https://art-appraisers-directory.appraisily.com';
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const definitions = [
  { slug: 'case-antiques-inc-auctions-appraisals', owned: 'https://caseantiques.com/contact-new/', reference: 'https://www.liveauctioneers.com/auctioneer/525/case-antiques-inc-auctions-and-appraisals', city: 'Knoxville', region: 'TN', role: 'headquarters' },
  { slug: 'everard-auctions-appraisals', owned: 'https://www.everard.com/auction/contact-3/', reference: 'https://www.liveauctioneers.com/auctioneer/4098/everard-auctions-and-appraisals', city: 'Savannah', region: 'GA', role: 'practice_contact' },
];
function withDocument(file, fn) { const dom = new JSDOM(read(file), { url: origin }); try { fn(dom.window.document); } finally { dom.window.close(); } }
for (const definition of definitions) {
  const { slug, owned, reference, city, region, role } = definition;
  test(`${slug}: owned contact, secondary marketplace and old review are distinct`, () => {
    const record = records.find(row => row.slug === slug);
    assert.equal(record.sourceUrl, owned); assert.equal(record.sourceType, 'official_website');
    assert.equal(record.publicationStatus, 'limited'); assert.equal(record.verifiedAt, '2026-08-30');
    assert.ok(record.claimScope.includes('website')); assert.ok(record.claimScope.includes('primary_location'));
    assert.ok(!record.claimScope.includes('qualification'));
    assert.deepEqual(record.sourceReferences, [{ url: reference, type: 'auction_marketplace' }]);
    const evidence = record.fieldEvidence.primary_location;
    assert.equal(evidence.sourceUrl, owned); assert.equal(evidence.checkedAt, '2026-10-08');
    assert.equal(evidence.locationRole, role); assert.equal(evidence.independentCredentialVerification, false);
    assert.deepEqual(evidence.value, { city, region, country: 'US' });
    assert.equal(evidence.sourceSnapshots.length, 1);
    assert.equal(evidence.sourceSnapshots[0].sourceUrl, owned);
    assert.match(evidence.sourceSnapshots[0].bodySha256, /^[a-f0-9]{64}$/);
    assert.equal(evidence.sourceSnapshots[0].retrievedAt.slice(0, 10), '2026-10-08');
    withDocument(`public_site/appraiser/${slug}/index.html`, doc => {
      assert.equal(doc.querySelector('meta[name="appraisily:provider-source"]').content, owned);
      assert.equal(doc.querySelector('meta[name="appraisily:provider-source-type"]').content, 'official_website');
      assert.equal(doc.querySelector('[data-gtm-cta="website"]').href, owned);
      assert.match(doc.querySelector('[data-gtm-cta="website"]').textContent, /provider contact/i);
      const secondary = doc.querySelector('a[data-provider-source-reference]');
      assert.equal(secondary.href, reference); assert.equal(secondary.dataset.providerSourceReferenceType, 'auction_marketplace');
      assert.match(secondary.textContent, /LiveAuctioneers auctioneer profile/);
      assert.doesNotMatch(secondary.textContent, /official website/);
      assert.equal(secondary.getAttribute('data-gtm-cta'), null);
      const node = providerSchemas(doc)[0]; assert.equal(providerSchemas(doc).length, 1);
      assert.equal(node['@type'], 'ProfessionalService'); assert.equal(node.name, record.name);
      assert.equal(node.dateModified, '2026-08-30');
      assert.deepEqual(node.address, { '@type': 'PostalAddress', addressLocality: city, addressRegion: region, addressCountry: 'US' });
      assert.match(doc.querySelector('[data-provider-field-review]').textContent, /October 8, 2026/);
      assert.doesNotMatch(doc.title, /Expert Art Valuation/);
      assert.deepEqual(inspectProviderFields(record, doc), { failures: [], reviewFlags: [], scopeFailures: [] });
      assertProviderHandoff(captureProviderHandoff(doc, origin), record);
    });
  });
  test(`${slug}: both canonical feeds preserve owned contact plus reference`, () => {
    for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
      const rows = JSON.parse(read(file)).appraisers; assert.equal(rows.length, 209);
      const row = rows.find(value => value.slug === slug);
      assert.equal(row.website, owned); assert.deepEqual(row.source.reference, { url: reference, type: 'auction_marketplace' });
      assert.equal(row.source.verifiedAt, '2026-08-30'); assert.equal(row.address.city, city); assert.equal(row.address.region, region);
    }
  });
}
test('Case company headquarters and appointment-only Nashville branch do not become two providers', () => {
  const definition = definitions[0], record = records.find(row => row.slug === definition.slug);
  assert.equal(record.fieldEvidence.office_branches.checkedAt, '2026-10-08');
  assert.equal(record.fieldEvidence.office_branches.sourceUrl, definition.owned);
  assert.deepEqual(record.fieldEvidence.office_branches.value, [{ city: 'Nashville', region: 'TN', country: 'US', appointmentOnly: true }]);
  withDocument(`public_site/appraiser/${definition.slug}/index.html`, doc => {
    const node = providerSchemas(doc)[0];
    assert.deepEqual(node.location, { '@type': 'Place', name: 'Nashville office — by appointment', address: { '@type': 'PostalAddress', addressLocality: 'Nashville', addressRegion: 'TN', addressCountry: 'US' } });
    assert.match(doc.querySelector('[data-provider-office-summary]').textContent, /Headquarters: Knoxville, TN.*Nashville office: by appointment/);
    assert.equal(doc.querySelector('nav a[href="/location/knoxville/"]'), null);
    assert.equal(doc.querySelector('nav a[href="/location/nashville/"]'), null);
    assert.equal(doc.querySelector('nav a[href="/appraiser/"]').textContent.trim(), 'Art appraisers');
    assert.doesNotMatch(doc.querySelector('[data-provider-specific-about]').textContent, /retained as a directory record/);
    const script = doc.querySelector('script[type="application/ld+json"]'); const nodes = JSON.parse(script.textContent);
    nodes[0].address.addressLocality = 'Nashville'; script.textContent = JSON.stringify(nodes);
    assert.ok(inspectProviderFields(record, doc).failures.some(row => row.code === 'primary-location-evidence-mismatch'));
  });
  assert.equal(fs.existsSync(new URL('public_site/location/knoxville/index.html', root)), false);
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) assert.match(JSON.parse(read(file)).appraisers.find(row => row.slug === definition.slug).description, /Knoxville.*Nashville.*appointment/i);
});
test('hub facets and names carry company office roles without changing the 209-profile inventory', () => {
  withDocument('public_site/appraiser/index.html', doc => {
    const slug = definitions[0].slug, item = doc.querySelector(`a[href="/appraiser/${slug}/"]`).closest('[data-browse-item]');
    assert.equal(item.dataset.browseFacet, 'Knoxville, TN'); assert.match(item.textContent, /Headquarters: Knoxville, TN.*Nashville office by appointment/);
    assert.match(item.dataset.browseSearch, /Knoxville.*Nashville/);
    assert.equal([...doc.querySelectorAll('option')].filter(node => node.value === 'Knoxville, TN').length, 1);
    assert.equal(doc.querySelectorAll('[data-browse-item]').length, 209);
  });
  withDocument('public_site/location/index.html', doc => {
    const slug = definitions[0].slug, anchor = doc.querySelector(`a[href="/appraiser/${slug}/"]`);
    assert.match(anchor.textContent, /Knoxville headquarters.*Nashville office by appointment/);
    const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(node => node['@type'] === 'CollectionPage');
    assert.equal(collection.mainEntity.itemListElement.find(row => row.url === `${origin}/appraiser/${slug}/`).name, anchor.textContent);
  });
});
test('missing locality provenance cannot pass simply because the owned website exists', () => {
  for (const definition of definitions) withDocument(`public_site/appraiser/${definition.slug}/index.html`, doc => {
    const record = structuredClone(records.find(row => row.slug === definition.slug));
    delete record.fieldEvidence.primary_location;
    assert.ok(inspectProviderFields(record, doc).scopeFailures.some(row => row.code === 'published-location-missing-field-evidence'));
  });
});
