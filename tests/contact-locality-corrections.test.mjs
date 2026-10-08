import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { assertProviderHandoff, captureProviderHandoff } from '../scripts/provider-handoff-contract.mjs';

const root = new URL('../', import.meta.url), origin = 'https://art-appraisers-directory.appraisily.com';
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const cases = [
  { slug: 'anderson-fine-art-appraisals', city: 'Beverly Hills', region: 'CA', oldCity: 'Anaheim', role: 'appointment_only_contact', sourceUrl: 'https://www.art-appraisals.net/contact', hash: '0a2889a0ab24031f3d74e2de03652de105172010cb5948bdc3ced7d262bdb46d', hub: 'Provider contact: Beverly Hills, CA (appointment only)', locationLabel: 'Anderson Fine Art Appraisals — Beverly Hills contact, CA (appointment only)' },
  { slug: 'art-appraisals-of-new-england', city: 'Cape Neddick', region: 'ME', oldCity: 'Boston', role: 'provider_published_locality', sourceUrl: 'https://www.artappraisalsne.com/01/contact/', hash: '5cddb263baa8160716190eeea95e90055c7597c07ba3b02b7e74c27d84f2adca', hub: 'Provider-published locality: Cape Neddick, ME', locationLabel: 'Art Appraisals of New England — Cape Neddick, ME' },
];
const record = slug => records.find(row => row.slug === slug);
function document(file, fn) {
  const dom = new JSDOM(read(file), { url: origin });
  try { fn(dom.window.document); } finally { dom.window.close(); }
}
for (const c of cases) {
  test(`${c.slug}: location evidence is separately dated and exact, without promotion`, () => {
    const row = record(c.slug), evidence = row.fieldEvidence?.primary_location;
    assert.equal(row.publicationStatus, 'limited'); assert.equal(row.verifiedAt, '2026-08-30');
    assert.equal(row.canonicalProviderId, `provider:${c.slug}`); assert.equal(row.previousUrl, `${origin}/appraiser/${c.slug}/`);
    assert.deepEqual(evidence?.value, { city: c.city, region: c.region, country: 'US' });
    assert.equal(evidence.checkedAt, '2026-10-08'); assert.equal(evidence.locationRole, c.role);
    assert.equal(evidence.sourceUrl, c.sourceUrl); assert.equal(evidence.independentCredentialVerification, false);
    assert.ok(row.claimScope.includes('primary_location')); assert.ok(!row.claimScope.includes('qualification'));
    assert.equal(evidence.sourceSnapshots.find(s => s.sourceUrl === c.sourceUrl)?.bodySha256, c.hash);
    for (const s of evidence.sourceSnapshots) { assert.equal(s.retrievedAt.slice(0, 10), evidence.checkedAt); assert.match(s.bodySha256, /^[a-f0-9]{64}$/); }
    assert.equal(row.fieldEvidence.specialties.checkedAt, '2026-10-08');
    assert.equal(row.fieldEvidence.appraisal_use_cases.checkedAt, '2026-10-08');
  });
  test(`${c.slug}: own entity, metadata and native links keep truthful contact scope`, () => document(`public_site/appraiser/${c.slug}/index.html`, doc => {
    const row = record(c.slug), node = providerSchemas(doc)[0]; assert.equal(providerSchemas(doc).length, 1);
    assert.equal(node['@type'], 'ProfessionalService'); assert.equal(node.name, row.name); assert.equal(node.dateModified, '2026-08-30');
    assert.deepEqual(node.address, { '@type': 'PostalAddress', addressLocality: c.city, addressRegion: c.region, addressCountry: 'US' });
    assert.equal(node.address.streetAddress, undefined); assert.equal(node.geo, undefined); assert.equal(node.hasCredential, undefined);
    assert.equal(doc.querySelector('[data-provider-publication-status]').dataset.providerPublicationStatus, 'limited');
    assert.equal(doc.querySelector('[data-gtm-cta="website"]').href, row.sourceUrl);
    assert.equal(doc.querySelector('meta[name="appraisily:provider-source"]').content, row.sourceUrl);
    assert.equal(doc.querySelector('nav a[href="/appraiser/"]').textContent.trim(), 'Art appraisers');
    assert.equal(doc.querySelector('nav a[href^="/location/"]'), null);
    const about = doc.querySelector('[data-provider-specific-about]').textContent;
    assert.match(about, /inspection arrangements|where an inspection/); assert.ok(about.includes(c.city));
    assert.doesNotMatch(about, /\b(?:certified|accredited|USPAP|IRS)\b|retained as a directory record/i);
    assert.ok(!doc.title.includes(c.oldCity)); assert.ok(doc.title.includes(c.city));
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal(doc.querySelector(selector).content, doc.title);
    const description = doc.querySelector('meta[name="description"]').content; assert.equal(description, node.description);
    for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) assert.equal(doc.querySelector(selector).content, description);
    const review = doc.querySelector('[data-provider-field-review]'); assert.match(review.textContent, /October 8, 2026/); assert.match(review.textContent, /August 30, 2026/); assert.equal(review.querySelector('a').href, c.sourceUrl);
    assert.deepEqual(inspectProviderFields(row, doc), { failures: [], reviewFlags: [], scopeFailures: [] });
    assertProviderHandoff(captureProviderHandoff(doc, origin), row);
  }));
  test(`${c.slug}: stale location and missing or foreign evidence fail`, () => document(`public_site/appraiser/${c.slug}/index.html`, doc => {
    const row = structuredClone(record(c.slug)), script = doc.querySelector('script[type="application/ld+json"]'), nodes = JSON.parse(script.textContent);
    nodes[0].address.addressLocality = c.oldCity; script.textContent = JSON.stringify(nodes);
    assert.ok(inspectProviderFields(row, doc).failures.some(f => f.code === 'primary-location-evidence-mismatch'));
    delete row.fieldEvidence.primary_location;
    assert.ok(inspectProviderFields(row, doc).scopeFailures.some(f => f.code === 'published-location-missing-field-evidence'));
    row.fieldEvidence.primary_location = { ...record(c.slug).fieldEvidence.primary_location, sourceUrl: 'https://foreign.example/contact' };
    assert.ok(inspectProviderFields(row, doc).failures.some(f => f.code === 'primary-location-evidence-invalid'));
  }));
}
test('native provider/location hubs and exact facets agree with contact locations', () => {
  document('public_site/appraiser/index.html', doc => {
    for (const c of cases) { const row = doc.querySelector(`a[href="/appraiser/${c.slug}/"]`).closest('[data-browse-item]'); assert.equal(row.dataset.browseFacet, `${c.city}, ${c.region}`); assert.ok(row.textContent.includes(c.hub)); }
    assert.deepEqual(new Set([...doc.querySelectorAll('select[data-browse-facet] option')].map(n => n.value).filter(Boolean)), new Set([...doc.querySelectorAll('[data-browse-item]')].map(n => n.dataset.browseFacet).filter(Boolean)));
  });
  document('public_site/location/index.html', doc => {
    const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(n => JSON.parse(n.textContent)).find(n => n['@type'] === 'CollectionPage');
    for (const c of cases) { assert.equal(doc.querySelector(`a[href="/appraiser/${c.slug}/"]`).textContent, c.locationLabel); assert.equal(collection.mainEntity.itemListElement.find(n => n.url === `${origin}/appraiser/${c.slug}/`).name, c.locationLabel); }
  });
});
for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) test(`${file}: contact addresses and original reviews propagate`, () => {
  const rows = JSON.parse(read(file)).appraisers; assert.equal(rows.length, 209);
  for (const c of cases) { const row = rows.find(n => n.slug === c.slug); assert.deepEqual(row.address, { city: c.city, region: c.region, country: 'US' }); assert.equal(row.source.verifiedAt, '2026-08-30'); assert.ok(!row.description.includes(c.oldCity)); assert.ok(row.description.includes(c.city)); assert.equal(row.website, record(c.slug).sourceUrl); }
});
test('no new city page, walk-in guarantee, street address or compliance approval', () => {
  assert.equal(fs.existsSync(new URL('public_site/location/cape-neddick/index.html', root)), false);
  const cities = JSON.parse(read('data/city-publication-decisions.json')).cities;
  assert.equal(cities.find(c => c.slug === 'beverly-hills')?.status, 'retained');
  assert.equal(cities.find(c => c.slug === 'beverly-hills')?.providerSlug, '');
  for (const c of cases) document(`public_site/appraiser/${c.slug}/index.html`, doc => {
    const about = doc.querySelector('[data-provider-specific-about]').textContent;
    if (c.slug === cases[0].slug) { assert.match(about, /appointments only/); assert.match(about, /does not establish a walk-in office/); }
    else { assert.match(about, /southern Maine/); assert.match(about, /not evidence of an office in each city/); }
    assert.doesNotMatch(doc.querySelector('main').textContent, /468 N\.|Suite 200|\b2020-2022\b|guaranteed acceptance|current USPAP compliant/i);
  });
});
