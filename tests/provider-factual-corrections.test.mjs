import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const manifest = JSON.parse(read('data/provider-publication-manifest.json'));
const feed = JSON.parse(read('public_site/appraisers.json')).appraisers;
const profile = slug => new JSDOM(read(`public_site/appraiser/${slug}/index.html`)).window.document;
const schema = document => [...document.querySelectorAll('script[type="application/ld+json"]')]
  .flatMap(node => [JSON.parse(node.textContent)].flat()).find(node => node['@type'] === 'ProfessionalService');

test('ASA is not published as a local service; historical removal is explicit', () => {
  const slug = 'american-society-of-appraisers-asa';
  const record = manifest.providers.find(p => p.slug === slug);
  assert.equal(record.publicationStatus, 'under_review');
  assert.equal(record.fieldEvidence.entity_kind.value, 'association');
  assert.equal(record.retirementDecision.terminalStatus, 404);
  assert.ok(!feed.some(p => p.slug === slug));
  assert.ok(!read('public_site/sitemap.xml').includes(`/appraiser/${slug}/`));
  assert.equal(schema(profile(slug)), undefined);
  const ledger = JSON.parse(read('data/historical-url-retirement-ledger.json')).urls.find(p => p.url.endsWith(`/appraiser/${slug}/`));
  assert.equal(ledger.terminalStatus, 404);
  assert.equal(ledger.outcome, 'known_excluded_nonprovider');
});
test('A&A locality agrees with official contact evidence without full-review promotion', () => {
  const slug = 'a-and-a-art-appraisals-naples-fl';
  const record = manifest.providers.find(p => p.slug === slug);
  const document = profile(slug);
  assert.equal(record.publicationStatus, 'limited');
  assert.equal(record.fieldEvidence.primary_location.sourceUrl, 'https://aaartappraisals.com/contact');
  assert.equal(schema(document).address.addressLocality, 'Naples');
  assert.equal(feed.find(p => p.slug === slug).address.city, 'Naples');
  assert.equal(document.querySelector('[data-provider-locality]').textContent, 'Naples, FL');
  assert.doesNotMatch(document.documentElement.outerHTML, /Pensacola/);
  assert.ok(document.body.textContent.includes('2026-10-07'));
  assert.equal(record.verifiedAt, '2026-08-30', 'Old identity-review date is not rewritten as a full new review');
});
test('Manhattan has no invented locality or provider likeness', () => {
  const slug = 'manhattan-fine-art-appraisers';
  const document = profile(slug);
  const provider = feed.find(p => p.slug === slug);
  assert.doesNotMatch(document.documentElement.outerHTML, /350 5th Ave|Art Appraiser in|Art Appraisers in New York/);
  assert.equal(schema(document).address, undefined);
  assert.equal(schema(document).image, undefined);
  assert.equal(provider.address, undefined);
  assert.equal(provider.image, undefined);
  assert.equal(document.querySelector('[data-provider-locality]'), null);
});
test('every provider filter option has a real static row and every row is selectable', () => {
  const document = new JSDOM(read('public_site/appraiser/index.html')).window.document;
  const rows = [...document.querySelectorAll('[data-browse-item]')];
  const facets = new Set(rows.map(row => row.dataset.browseFacet).filter(Boolean));
  const options = [...document.querySelectorAll('select[data-browse-facet] option')].map(option => option.value).filter(Boolean);
  assert.equal(options.length, new Set(options).size);
  assert.deepEqual(new Set(options), facets);
  assert.equal(rows.length, feed.length);
  assert.ok(!options.includes('Washington, NY') && !options.includes('Remote, NY') && !options.includes('350 5th Ave, NY'));
});
