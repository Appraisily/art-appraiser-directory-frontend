import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderSourceProvenance, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { captureProviderHandoff, assertProviderHandoff } from '../scripts/provider-handoff-contract.mjs';

const root = new URL('../', import.meta.url);
const origin = 'https://art-appraisers-directory.appraisily.com';
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const references = {
  'alicia-e-weaver-isa-capp': ['credential_body_registry', 'ISA individual profile'],
  'janet-l-ross': ['credential_body_registry', 'ISA individual profile'],
  'antique-and-fine-art-appraisal': ['business_registry', 'BBB business profile'],
  'antique-and-fine-art-appraisals': ['commercial_directory', 'Antiques.com dealer listing'],
  'case-antiques-inc-auctions-appraisals': ['auction_marketplace', 'LiveAuctioneers auctioneer profile'],
  'connecticut-art-appraisals-llc-alizzandra-danker': ['credential_body_registry', 'Association reference'],
  'everard-auctions-appraisals': ['auction_marketplace', 'LiveAuctioneers auctioneer profile'],
  'houston-houston-estate-sales-and-appraisals': ['sale_event_marketplace', 'Historical sale reference'],
  'jason-preston-art-advisory-appraisals': ['credential_body_registry', 'Appraisers Association profile'],
};

for (const [slug, [type, heading]] of Object.entries(references)) {
  test(`${slug}: external reference is not called a provider-owned website`, () => {
    const record = records.find(row => row.slug === slug);
    const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`), { url: origin });
    try {
      const doc = dom.window.document;
      assert.equal(record.sourceType, type);
      assert.equal(record.verifiedAt, '2026-08-30');
      assert.equal(record.publicationStatus, 'limited');
      assert.ok(!record.claimScope.includes('website'));
      assert.ok(record.claimScope.includes('source_reference'));
      assert.equal(doc.querySelector('meta[name="appraisily:provider-source"]').content, record.sourceUrl);
      assert.equal(doc.querySelector('meta[name="appraisily:provider-source-type"]').content, type);
      const contact = doc.querySelector('[data-gtm-cta="website"]');
      assert.equal(contact.href, record.sourceUrl);
      assert.equal(contact.closest('[data-directory-provider-contact]').querySelector('h3').textContent, heading);
      assert.doesNotMatch(contact.textContent, /official website/i);
      assert.doesNotMatch(doc.querySelector('[data-provider-publication-status]').textContent, /official website/i);
      assert.equal(contact.dataset.gtmEvent, 'directory_cta');
      assert.equal(contact.dataset.gtmAppraiserId, slug);
      assert.equal(providerSchemas(doc)[0].dateModified, '2026-08-30');
      assertProviderHandoff(captureProviderHandoff(doc, origin), record);
      const flags = inspectProviderSourceProvenance(record, doc);
      assert.deepEqual(flags.map(row => row.code), slug.startsWith('connecticut-') ? ['source-provenance-generic-credential-body-root'] : []);
      contact.textContent = 'Visit official website';
      assert.ok(inspectProviderSourceProvenance(record, doc).some(row => row.code.endsWith('labelled-as-provider-website')));
      assert.throws(() => assertProviderHandoff(captureProviderHandoff(doc, origin), record));
    } finally { dom.window.close(); }
  });
}

test('all nine feeds keep references separate from provider websites and original reviews', () => {
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const rows = JSON.parse(read(file)).appraisers;
    assert.equal(rows.length, 209);
    for (const [slug, [type]] of Object.entries(references)) {
      const record = records.find(row => row.slug === slug), row = rows.find(item => item.slug === slug);
      assert.equal(row.website, undefined);
      assert.deepEqual(row.source.reference, { url: record.sourceUrl, type });
      assert.equal(row.source.verifiedAt, '2026-08-30');
    }
  }
});

test('wrong FAIR records and non-entity association/event equivalences are absent', () => {
  const overlays = JSON.parse(read('data/fair-overlay-matches.json')).overlays;
  const forbidden = {
    'janet-l-ross': 'https://fairappraisers.org/appraisers/alicia-e-weaver-boulder-co/',
    'jason-preston-art-advisory-appraisals': 'https://fairappraisers.org/appraisers/connecticut-art-appraisals-llc-alizzandra-danker-hartford-ct/',
  };
  for (const [slug, url] of Object.entries(forbidden)) {
    assert.ok(!read(`public_site/appraiser/${slug}/index.html`).includes(url));
    assert.equal(overlays.find(row => row.slug === slug), undefined);
  }
  for (const slug of ['connecticut-art-appraisals-llc-alizzandra-danker', 'houston-houston-estate-sales-and-appraisals']) {
    const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`));
    try {
      const node = providerSchemas(dom.window.document)[0], source = records.find(row => row.slug === slug).sourceUrl;
      assert.ok(![node.sameAs].flat().includes(source));
    } finally { dom.window.close(); }
  }
});

test('Jason office omission agrees across profile, hubs, facets, feeds and indexing metadata', () => {
  const slug = 'jason-preston-art-advisory-appraisals';
  const record = records.find(row => row.slug === slug);
  assert.equal(record.fieldEvidence.primary_location.decision, 'omit');
  const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`));
  try {
    const doc = dom.window.document;
    assert.doesNotMatch(doc.title, /Nashville|Expert/);
    assert.equal(providerSchemas(doc)[0].address, undefined);
    assert.doesNotMatch(doc.querySelector('[data-directory-provider-layout]').textContent, /Nashville/);
    assert.equal(doc.querySelector('nav a[href="/location/nashville/"]'), null);
  } finally { dom.window.close(); }
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    assert.equal(JSON.parse(read(file)).appraisers.find(row => row.slug === slug).address, undefined);
  }
  const hub = new JSDOM(read('public_site/appraiser/index.html'));
  try {
    const row = hub.window.document.querySelector(`a[href="/appraiser/${slug}/"]`).closest('[data-browse-item]');
    assert.equal(row.dataset.browseFacet, 'Location not listed');
    assert.doesNotMatch(row.textContent + row.dataset.browseSearch, /Nashville/);
  } finally { hub.window.close(); }
  const locations = new JSDOM(read('public_site/location/index.html'));
  try {
    assert.match(locations.window.document.querySelector(`a[href="/appraiser/${slug}/"]`).textContent, /location not listed/);
  } finally { locations.window.close(); }
});

test('the long Antiques.com source URL has an explicit native text-wrap contract', () => {
  const dom = new JSDOM(read('public_site/appraiser/antique-and-fine-art-appraisals/index.html'));
  try {
    const source = [...dom.window.document.querySelectorAll('main a[href]')].find(node => node.textContent.startsWith('https://www.antiques.com/'));
    const assertWrap = () => assert.equal(source.style.overflowWrap, 'anywhere');
    assertWrap();
    assert.equal(source.getAttribute('href'), 'https://www.antiques.com/dealers/35727/Antique-%26-Fine-Art-Appraisals');
    source.style.overflowWrap = '';
    assert.throws(assertWrap);
  } finally { dom.window.close(); }
});

test('the long BBB source URL has an explicit native text-wrap contract', () => {
  const dom = new JSDOM(read('public_site/appraiser/antique-and-fine-art-appraisal/index.html'));
  try {
    const source = [...dom.window.document.querySelectorAll('main a[href]')].find(node => node.textContent.startsWith('https://www.bbb.org/'));
    const assertWrap = () => assert.equal(source.style.overflowWrap, 'anywhere');
    assertWrap();
    assert.equal(source.getAttribute('href'), 'https://www.bbb.org/us/wa/seattle/profile/art-consultant/antique-fine-art-appraisal-service-1296-7048614');
    source.style.overflowWrap = '';
    assert.throws(assertWrap);
  } finally { dom.window.close(); }
});
