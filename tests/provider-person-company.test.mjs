import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { captureDocument, assertDocumentParity } from '../scripts/settled-document-contract.mjs';

const origin = 'https://art-appraisers-directory.appraisily.com';
const official = 'https://www.hollingsworthfinearts.com/';
const fair = 'https://fairappraisers.org/appraisers/lauren-k-stump-orlando-fl/';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const manifest = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const record = slug => manifest.find(provider => provider.slug === slug);
const companySlug = 'hollingsworth-fine-a', personSlug = 'lauren-k-stump';
function document(file, action) {
  const dom = new JSDOM(read(file), { url: `${origin}/${file.replace(/^public_site\//, '').replace(/index\.html$/, '')}` });
  try { action(dom.window.document); } finally { dom.window.close(); }
}
const primary = doc => providerSchemas(doc)[0];

test('Hollingsworth company has a sourced base, not an equivalent FAIR person', () => {
  document(`public_site/appraiser/${companySlug}/index.html`, doc => {
    const entity = primary(doc), provider = record(companySlug);
    assert.equal(providerSchemas(doc).length, 1);
    assert.equal(entity['@type'], 'ProfessionalService');
    assert.equal(entity['@id'], `${origin}/appraiser/${companySlug}/#provider`);
    assert.deepEqual(entity.address, { '@type': 'PostalAddress', addressLocality: 'Orlando', addressRegion: 'FL', addressCountry: 'US' });
    assert.deepEqual(entity.sameAs, [official]);
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]'), null);
    assert.equal(doc.querySelector(`a[href="${fair}"]`), null);
    assert.equal(doc.querySelector('[data-provider-relationship-link]').getAttribute('href'), `/appraiser/${personSlug}/`);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /based in Orlando.*owned and operated by Lauren Stump/);
    assert.doesNotMatch(doc.documentElement.outerHTML, /Pensacola/);
    assert.deepEqual(inspectProviderFields(provider, doc), { failures: [], reviewFlags: [], scopeFailures: [] });
  });
  assert.ok(!JSON.parse(read('data/fair-overlay-matches.json')).overlays.some(row => row.slug === companySlug));
});

test('Lauren is a separate person with a company relationship, not an inferred office', () => {
  document(`public_site/appraiser/${personSlug}/index.html`, doc => {
    const entity = primary(doc);
    assert.equal(providerSchemas(doc).length, 1);
    assert.equal(entity['@type'], 'Person');
    assert.equal(entity['@id'], `${origin}/appraiser/${personSlug}/#provider`);
    assert.equal(entity.address, undefined);
    assert.equal(entity.serviceType, undefined);
    assert.equal(entity.jobTitle, 'Owner and operator');
    assert.deepEqual(entity.worksFor, { '@type': 'Organization', '@id': `${origin}/appraiser/${companySlug}/#provider`, name: 'Hollingsworth Fine Arts', url: `${origin}/appraiser/${companySlug}/` });
    assert.deepEqual(entity.sameAs, [fair]);
    assert.equal(doc.querySelector('[data-provider-relationship-link]').getAttribute('href'), `/appraiser/${companySlug}/`);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /does not establish a separate personal office or address/);
    assert.equal(doc.querySelector('[data-gtm-cta="website"]').getAttribute('href'), official);
    assert.doesNotMatch(doc.title, /Art Appraiser in Orlando|Expert/);
    assert.deepEqual(inspectProviderFields(record(personSlug), doc), { failures: [], reviewFlags: [], scopeFailures: [] });
    const snapshot = captureDocument(doc, origin);
    assert.equal(snapshot.businesses.length, 1);
    assertDocumentParity(snapshot, snapshot, `${origin}/appraiser/${personSlug}/`);
  });
});

test('original identity reviews and suppressed variants survive field corrections', () => {
  for (const slug of [companySlug, personSlug]) {
    const provider = record(slug);
    assert.equal(provider.publicationStatus, 'limited');
    assert.equal(provider.verifiedAt, '2026-08-30');
    assert.equal(provider.reason, 'website_backed_limited_publication_2026-08-30');
    assert.equal(provider.fieldEvidence.company_relationship.checkedAt, '2026-10-08');
    assert.equal(provider.fieldEvidence.company_relationship.sourceUrl, official);
    assert.ok(!provider.claimScope.includes('qualification'));
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      assert.equal(primary(doc).dateModified, '2026-08-30');
      assert.match(doc.querySelector('[data-provider-relationship-review]').textContent, /October 8, 2026/);
    });
  }
  for (const slug of ['jacksonville-hollingsworth-fine-a', 'orlando-lauren-k-stump']) {
    assert.equal(record(slug).publicationStatus, 'under_review');
    assert.deepEqual(record(slug).claimScope, []);
    assert.ok(!read('public_site/sitemap.xml').includes(`/appraiser/${slug}/`));
  }
});

test('browse facets and ItemList distinguish company base from individual location', () => {
  document('public_site/appraiser/index.html', doc => {
    const company = doc.querySelector(`a[href="/appraiser/${companySlug}/"]`).closest('[data-browse-item]');
    const person = doc.querySelector(`a[href="/appraiser/${personSlug}/"]`).closest('[data-browse-item]');
    assert.equal(company.dataset.browseFacet, 'Orlando, FL');
    assert.match(company.textContent, /Provider-published company base: Orlando, FL/);
    assert.equal(person.dataset.browseFacet, 'Location not listed');
    assert.match(person.textContent, /Location not listed for this individual/);
  });
  document('public_site/location/index.html', doc => {
    const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(node => node['@type'] === 'CollectionPage');
    for (const slug of [companySlug, personSlug]) {
      const text = doc.querySelector(`a[href="/appraiser/${slug}/"]`).textContent;
      assert.equal(collection.mainEntity.itemListElement.find(row => row.url === `${origin}/appraiser/${slug}/`).name, text);
    }
  });
});

test('feeds keep corrected company base and omit personal address with old review dates', () => {
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const appraisers = JSON.parse(read(file)).appraisers;
    assert.equal(appraisers.length, 209);
    assert.equal(appraisers.find(row => row.slug === companySlug).address.city, 'Orlando');
    assert.equal(appraisers.find(row => row.slug === personSlug).address, undefined);
    for (const slug of [companySlug, personSlug]) {
      const row = appraisers.find(provider => provider.slug === slug);
      assert.equal(row.website, official);
      assert.equal(row.source.verifiedAt, '2026-08-30');
      assert.match(row.description, /owner and operator|owned and operated/);
    }
  }
});

test('negative location fixtures reject an old city or an invented personal office', () => {
  for (const [slug, city, expected] of [[companySlug, 'Pensacola', 'primary-location-evidence-mismatch'], [personSlug, 'Orlando', 'omitted-location-still-published']]) {
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      const node = doc.querySelector('script[type="application/ld+json"]');
      const schemas = JSON.parse(node.textContent);
      schemas[0].address = { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'FL', addressCountry: 'US' };
      node.textContent = JSON.stringify(schemas);
      assert.ok(inspectProviderFields(record(slug), doc).failures.some(failure => failure.code === expected));
    });
  }
});
