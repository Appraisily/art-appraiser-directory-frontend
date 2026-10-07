import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { hasReviewedManifestCityCoverage } from '../scripts/reviewed-service-area.mjs';

const read = file => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const slug = 'worthwise-art-and-antiques-appraisers';
const origin = 'https://art-appraisers-directory.appraisily.com';
const record = JSON.parse(read('data/provider-publication-manifest.json')).providers.find(row => row.slug === slug);
const feed = JSON.parse(read('public_site/appraisers.json')).appraisers.find(row => row.slug === slug);
const document = route => new JSDOM(read(`public_site/${route}/index.html`)).window.document;
const schemas = doc => [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent));

test('WorthWise location correction preserves the original review and omits an unverified office', () => {
  const doc = document(`appraiser/${slug}`);
  const provider = schemas(doc).find(node => node['@type'] === 'ProfessionalService');
  assert.equal(record.publicationStatus, 'verified');
  assert.equal(record.verifiedAt, '2026-10-01');
  assert.equal(record.fieldEvidence.primary_location.decision, 'omit');
  assert.equal(record.fieldEvidence.primary_location.checkedAt, '2026-10-07');
  assert.equal(provider.address, undefined);
  assert.equal(feed.address, undefined);
  assert.equal(provider.dateModified, '2026-10-01');
  assert.deepEqual(provider.areaServed, { '@type': 'Place', name: 'Colorado Front Range' });
  assert.ok(doc.body.textContent.includes('2026-10-07'));
  assert.ok(doc.body.textContent.includes('office location is not confirmed'));
  assert.doesNotMatch(doc.documentElement.outerHTML, /Denver practice|in Denver appraises|Devinney|80005/);
  assert.ok(doc.querySelector('[data-provider-publication-status="verified"]').textContent.includes('2026-10-01'));
  const hub = document('appraiser').querySelector(`a[href="/appraiser/${slug}/"]`).closest('li');
  assert.equal(hub.dataset.browseFacet, '');
  assert.ok(hub.textContent.includes('Service area: Colorado Front Range'));
  assert.ok(!hub.textContent.includes('Listed location: Denver'));
  const comparison = document('compare-art-appraisers').querySelector(`[data-provider-slug="${slug}"]`);
  assert.ok(comparison.textContent.includes('Colorado Front Range service area; office not confirmed'));
  assert.equal(comparison.querySelector('time').dateTime, '2026-10-01');
  const locations = document('location');
  assert.ok(locations.querySelector(`a[href="/appraiser/${slug}/"]`).textContent.includes('Colorado Front Range service area'));
  const entry = schemas(locations).flatMap(node => node.mainEntity?.itemListElement || []).find(item => item.url.endsWith(`/appraiser/${slug}/`));
  assert.ok(entry.name.includes('Colorado Front Range service area'));
});

test('Denver publishes one regional option consistently without claiming a Denver office', () => {
  const doc = document('location/denver');
  const collection = schemas(doc).find(node => node['@type'] === 'CollectionPage');
  const url = `${origin}/appraiser/${slug}/`;
  const links = [...doc.querySelectorAll('main a[href]')].filter(node => node.getAttribute('href') === `/appraiser/${slug}/`);
  assert.equal(links.length, 1);
  assert.equal(collection.mainEntity.numberOfItems, 1);
  assert.deepEqual(collection.mainEntity.itemListElement.map(item => item.url), [url]);
  const location = JSON.parse(read('public_site/locations.json')).locations.find(row => row.slug === 'denver');
  const route = JSON.parse(read('public_site/location/denver/index.json')).location;
  const combined = JSON.parse(read('public_site/directory.json')).locations.find(row => row.slug === 'denver');
  for (const row of [location, route, combined]) {
    assert.equal(row.numberOfListedAppraisers, 1);
    assert.deepEqual(row.listedAppraisers.map(item => item.slug), [slug]);
  }
  const decision = JSON.parse(read('data/city-publication-decisions.json')).cities.find(row => row.slug === 'denver');
  assert.equal(decision.providerSlug, slug);
  assert.equal(decision.providerRelationship, 'reviewed_regional_service_area');
  const card = doc.querySelector('[data-reviewed-regional-option]');
  assert.ok(card.textContent.includes('Colorado Front Range'));
  assert.ok(card.textContent.includes('Denver office is not confirmed'));
  assert.equal(card.querySelector('[data-cta-kind="provider_contact"]').href, 'https://worthwiseappraisers.com/art-appraisal-services-denver/');
  assert.equal(doc.querySelector('main section'), card, 'The real option must precede generic guidance and the online alternative');
  assert.doesNotMatch(doc.documentElement.outerHTML, /No official-source-reviewed fine-art specialist|future reviewed local listing|wait for a reviewed local listing/);
});

test('service-area evidence is explicit, scoped and dated separately from provider verification', () => {
  assert.ok(record.claimScope.includes('service_area'));
  assert.deepEqual(record.fieldEvidence.service_area.value, { label: 'Colorado Front Range', citySlugs: ['denver'] });
  assert.equal(record.fieldEvidence.service_area.checkedAt, '2026-10-07');
  assert.equal(record.fieldEvidence.service_area.sourceUrl, 'https://worthwiseappraisers.com/art-appraisal-services-denver/');
  assert.equal(record.fieldEvidence.primary_location.sourceUrl, 'https://worthwiseappraisers.com/contact-appraisal-services/');
});

test('regional-city exception fails closed on missing scope, unsupported source, date, identity and office claims', () => {
  assert.equal(hasReviewedManifestCityCoverage(feed, record, 'denver'), true);
  assert.equal(hasReviewedManifestCityCoverage(feed, record, 'boulder'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, record, ''), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, { ...record, publicationStatus: 'limited' }, 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, { ...record, claimScope: ['service_area'] }, 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, { ...record, slug: 'unrelated-provider' }, 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, { ...record, verifiedAt: '2026-10-07' }, 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage({ ...feed, address: { city: 'Denver' } }, record, 'denver'), false);
  const change = field => ({ ...record, fieldEvidence: { ...record.fieldEvidence, service_area: { ...record.fieldEvidence.service_area, ...field } } });
  assert.equal(hasReviewedManifestCityCoverage(feed, change({ checkedAt: '' }), 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, change({ checkedAt: '2026-02-30' }), 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, change({ sourceUrl: 'https://unreviewed.example/' }), 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, change({ sourceUrl: 'http://worthwiseappraisers.com/' }), 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, change({ value: { label: 'Colorado Front Range', citySlugs: 'denver' } }), 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, change({ value: { label: '', citySlugs: ['denver'] } }), 'denver'), false);
  assert.equal(hasReviewedManifestCityCoverage(feed, { ...record, fieldEvidence: { service_area: record.fieldEvidence.service_area } }, 'denver'), false);
});
