import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { captureDocument, assertDocumentParity } from '../scripts/settled-document-contract.mjs';

const origin = 'https://art-appraisers-directory.appraisily.com';
const official = 'https://www.capitalartgroup.com/';
const source = 'https://www.capitalartgroup.com/about';
const fair = 'https://fairappraisers.org/appraisers/ms-maria-tarrence-asa-arm-new-york-ny/';
const fairCompany = `${fair}#professionalservice`;
const fairPerson = `${fair}#person`;
const company = 'capital-art-group-art-appraisals-personal-property-appraisals-appraisal-reviews-expert-wit';
const person = 'maria-tarrence';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const providers = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const record = slug => providers.find(provider => provider.slug === slug);
function document(file, action) {
  const dom = new JSDOM(read(file), { url: `${origin}/${file.replace(/^public_site\//, '').replace(/index\.html$/, '')}` });
  try { action(dom.window.document); } finally { dom.window.close(); }
}
const primary = doc => providerSchemas(doc)[0];

test('Capital firm has a sourced New York base, not Maria as its sameAs identity', () => {
  document(`public_site/appraiser/${company}/index.html`, doc => {
    const entity = primary(doc);
    assert.equal(providerSchemas(doc).length, 1);
    assert.equal(entity['@type'], 'ProfessionalService');
    assert.equal(entity['@id'], `${origin}/appraiser/${company}/#provider`);
    assert.deepEqual(entity.address, { '@type': 'PostalAddress', addressLocality: 'New York', addressRegion: 'NY', addressCountry: 'US' });
    assert.deepEqual(entity.sameAs, [official, fairCompany]);
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]').content, fairCompany);
    assert.equal(doc.querySelector(`a[href="${fairCompany}"]`).textContent, 'FAIR public registry');
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /New York City-based.*Maria Tarrence.*founder and principal/);
    assert.doesNotMatch(doc.documentElement.outerHTML, /Fort Worth/);
    assert.equal(doc.querySelector('[data-provider-relationship-link]').getAttribute('href'), `/appraiser/${person}/`);
    assert.deepEqual(inspectProviderFields(record(company), doc), { failures: [], reviewFlags: [], scopeFailures: [] });
  });
  assert.equal(JSON.parse(read('data/fair-overlay-matches.json')).overlays.find(row => row.slug === company).fairUrl, fairCompany);
});

test('Maria is a distinct person with a sourced firm role and no inferred personal office', () => {
  document(`public_site/appraiser/${person}/index.html`, doc => {
    const entity = primary(doc);
    assert.equal(providerSchemas(doc).length, 1);
    assert.equal(entity['@type'], 'Person');
    assert.equal(entity['@id'], `${origin}/appraiser/${person}/#provider`);
    assert.equal(entity.address, undefined);
    assert.equal(entity.serviceType, undefined);
    assert.equal(entity.jobTitle, 'Founder and principal appraiser');
    assert.deepEqual(entity.worksFor, { '@type': 'Organization', '@id': `${origin}/appraiser/${company}/#provider`, name: 'Capital Art Group', url: `${origin}/appraiser/${company}/` });
    assert.deepEqual(entity.sameAs, [fairPerson]);
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]').content, fairPerson);
    assert.equal(doc.querySelector('[data-provider-relationship-link]').getAttribute('href'), `/appraiser/${company}/`);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /does not establish a separate personal office or address/);
    assert.equal(doc.querySelector('[data-gtm-cta="website"]').getAttribute('href'), official);
    assert.doesNotMatch(doc.title, /Art Appraiser in New York|Expert/);
    assert.deepEqual(inspectProviderFields(record(person), doc), { failures: [], reviewFlags: [], scopeFailures: [] });
    const snapshot = captureDocument(doc, origin);
    assert.equal(snapshot.businesses.length, 1);
    assertDocumentParity(snapshot, snapshot, `${origin}/appraiser/${person}/`);
  });
});

test('typed FAIR references do not collapse the person and firm into one entity', () => {
  const overlay = JSON.parse(read('data/fair-overlay-matches.json')).overlays;
  assert.equal(overlay.find(row => row.slug === company).fairUrl, fairCompany);
  assert.equal(overlay.find(row => row.slug === person).fairUrl, fairPerson);
  document(`public_site/appraiser/${company}/index.html`, doc => {
    assert.ok(!primary(doc).sameAs.includes(fairPerson));
  });
  document(`public_site/appraiser/${person}/index.html`, doc => {
    assert.ok(!primary(doc).sameAs.includes(fairCompany));
    assert.ok(!primary(doc).sameAs.includes(official));
  });
});

test('Capital field evidence keeps original limited reviews, URLs and unpublished variants', () => {
  for (const slug of [company, person]) {
    const provider = record(slug);
    assert.equal(provider.publicationStatus, 'limited');
    assert.equal(provider.verifiedAt, '2026-08-30');
    assert.equal(provider.reason, 'website_backed_limited_publication_2026-08-30');
    assert.equal(provider.fieldEvidence.company_relationship.checkedAt, '2026-10-08');
    assert.equal(provider.fieldEvidence.company_relationship.sourceUrl, source);
    assert.ok(!provider.claimScope.includes('qualification'));
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      assert.equal(primary(doc).dateModified, '2026-08-30');
      assert.match(doc.querySelector('[data-provider-relationship-review]').textContent, /October 8, 2026/);
      assert.equal(doc.querySelector('[data-provider-relationship-review] a').getAttribute('href'), source);
    });
  }
  for (const slug of ['fort-worth-' + company, 'new-york-maria-tarrence']) {
    assert.equal(record(slug).publicationStatus, 'under_review');
    assert.deepEqual(record(slug).claimScope, []);
    assert.ok(!read('public_site/sitemap.xml').includes(`/appraiser/${slug}/`));
  }
});

test('Capital browse labels and ItemLists separate firm base from personal locality', () => {
  document('public_site/appraiser/index.html', doc => {
    const firm = doc.querySelector(`a[href="/appraiser/${company}/"]`).closest('[data-browse-item]');
    const individual = doc.querySelector(`a[href="/appraiser/${person}/"]`).closest('[data-browse-item]');
    assert.equal(firm.dataset.browseFacet, 'New York, NY');
    assert.match(firm.textContent, /Provider-published company base: New York, NY/);
    assert.equal(individual.dataset.browseFacet, 'Location not listed');
    assert.match(individual.textContent, /Location not listed for this individual/);
  });
  document('public_site/location/index.html', doc => {
    const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(node => node['@type'] === 'CollectionPage');
    for (const slug of [company, person]) {
      assert.equal(collection.mainEntity.itemListElement.find(row => row.url === `${origin}/appraiser/${slug}/`).name, doc.querySelector(`a[href="/appraiser/${slug}/"]`).textContent);
    }
  });
});

test('Capital feeds keep original reviews and own links, with firm-only base', () => {
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const appraisers = JSON.parse(read(file)).appraisers;
    assert.equal(appraisers.length, 209);
    assert.equal(appraisers.find(row => row.slug === company).address.city, 'New York');
    assert.equal(appraisers.find(row => row.slug === person).address, undefined);
    assert.equal(appraisers.find(row => row.slug === person).serviceType, undefined);
    for (const slug of [company, person]) {
      const row = appraisers.find(provider => provider.slug === slug);
      assert.equal(row.website, official);
      assert.equal(row.source.verifiedAt, '2026-08-30');
      assert.match(row.description, /founder and principal/);
    }
  }
});

test('Capital negative fixtures reject the old firm city or invented personal office', () => {
  for (const [slug, city, expected] of [[company, 'Fort Worth', 'primary-location-evidence-mismatch'], [person, 'New York', 'omitted-location-still-published']]) {
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      const node = doc.querySelector('script[type="application/ld+json"]');
      const schemas = JSON.parse(node.textContent);
      schemas[0].address = { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'NY', addressCountry: 'US' };
      node.textContent = JSON.stringify(schemas);
      assert.ok(inspectProviderFields(record(slug), doc).failures.some(failure => failure.code === expected));
    });
  }
});
