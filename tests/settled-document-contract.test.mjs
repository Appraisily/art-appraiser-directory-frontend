import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { assertDocumentParity, assertHandoffAttribution, assertProviderEvidence, assertReviewedInventory, captureDocument } from '../scripts/settled-document-contract.mjs';

const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://art-appraisers-directory.appraisily.com';
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const focal = readJson('scripts/fixtures/customer-qa-browser-matrix.json').expectedProviderLinks;
const resources = readJson('data/directory-resource-pages.json');
const input = {
  providers: readJson('data/provider-publication-manifest.json').providers,
  cities: readJson('data/city-publication-decisions.json').cities,
  resources,
  sitemapUrls: [...fs.readFileSync(path.join(root, 'public_site/sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
};

test('sitemap matches the full reviewed inventory, including declared resources', () => {
  assert.equal(assertReviewedInventory(input), input.sitemapUrls.length);
  assert.throws(() => assertReviewedInventory({ ...input, sitemapUrls: input.sitemapUrls.slice(0, -1) }), /differs from reviewed/);
  assert.throws(() => assertReviewedInventory({ ...input, sitemapUrls: [...input.sitemapUrls, input.sitemapUrls[0]] }), /duplicate/);
});

for (const route of focal) test(`${route} cannot replace authored facts with a legacy mount`, () => {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'public_site', route, 'index.html'), 'utf8'), { url: origin + route });
  try {
    const document = dom.window.document;
    assert.equal(document.querySelector('script[type="module"][src]'), null, 'Reviewed static provider must not mount the old SPA');
    const snapshot = captureDocument(document, origin);
    assertDocumentParity(snapshot, snapshot, origin + route);
    assertProviderEvidence(snapshot, input.providers.find((record) => route === `/appraiser/${record.slug}/`), origin + route);
    assert.equal(snapshot.about.length, 1);
    for (const section of ['Specialties', 'Services', 'Verification']) assert.ok(snapshot.mainText.includes(section), section);
  } finally { dom.window.close(); }
});

test('negative fixture rejects duplicate settled metadata and lost reviewed facts', () => {
  const route = focal[0];
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'public_site', route, 'index.html'), 'utf8'), { url: origin + route });
  try {
    const initial = captureDocument(dom.window.document, origin);
    const conflicting = structuredClone(initial);
    conflicting.canonicals.push((origin + route).replace(/\/$/, ''));
    conflicting.descriptions.push('Old feed description');
    conflicting.businesses.push({ ...initial.businesses[0], url: conflicting.canonicals[1] });
    assert.throws(() => assertDocumentParity(initial, conflicting, origin + route), /one self-canonical/);
    for (const field of ['mainText', 'about', 'businesses', 'title', 'descriptions', 'robots']) {
      const lost = structuredClone(initial);
      lost[field] = typeof lost[field] === 'string' ? 'Old feed replacement' : [];
      assert.throws(() => assertDocumentParity(initial, lost, origin + route), undefined, field);
    }
    const missingLink = structuredClone(initial);
    missingLink.anchors = [];
    assert.throws(() => assertDocumentParity(initial, missingLink, origin + route), /native link disappeared/);
    const record = input.providers.find((provider) => route === `/appraiser/${provider.slug}/`);
    assert.throws(() => assertProviderEvidence({ ...initial, mainText: 'No review date' }, record, origin + route), /source-review date missing/);
    assert.throws(() => assertProviderEvidence({ ...initial, anchors: [] }, record, origin + route), /official provider source link missing/);
    assert.throws(() => assertHandoffAttribution(initial, initial, origin + route), undefined, 'unstamped handoff must fail');
  } finally { dom.window.close(); }
});
