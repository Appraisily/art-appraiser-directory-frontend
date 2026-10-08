import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const origin = 'https://art-appraisers-directory.appraisily.com';
const official = 'https://jskfineartappraisals.com/';
const about = `${official}about/`;
const fair = 'https://fairappraisers.org/appraisers/jsk-fine-art-appraisals-solana-beach-ca/#professionalservice';
const isa = 'https://www.isa-appraisers.org/find-an-appraiser/profile/15874/jennifer-e-salvetti-kulla-ma';
const company = 'jsk-fine-art-appraisals';
const person = 'jennifer-e-salvetti-kulla-ma';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const record = slug => records.find(row => row.slug === slug);
function document(file, action) {
  const dom = new JSDOM(read(file), { url: `${origin}/${file.replace(/^public_site\//, '').replace(/index\.html$/, '')}` });
  try { action(dom.window.document); } finally { dom.window.close(); }
}
const primary = doc => providerSchemas(doc)[0];

test('JSK firm has a sourced Solana Beach base and exact company identity', () => {
  document(`public_site/appraiser/${company}/index.html`, doc => {
    const node = primary(doc);
    assert.equal(providerSchemas(doc).length, 1);
    assert.equal(node['@type'], 'ProfessionalService');
    assert.equal(node['@id'], `${origin}/appraiser/${company}/#provider`);
    assert.deepEqual(node.address, { '@type': 'PostalAddress', addressLocality: 'Solana Beach', addressRegion: 'CA', addressCountry: 'US' });
    assert.deepEqual(node.sameAs, [official, fair]);
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]').content, fair);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /Solana Beach.*Jennifer Salvetti-Kulla/);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /appointment/i);
    assert.doesNotMatch(doc.documentElement.outerHTML, /Temecula/);
    assert.equal(doc.querySelector('[data-provider-relationship-link]').getAttribute('href'), `/appraiser/${person}/`);
    assert.deepEqual(inspectProviderFields(record(company), doc), { failures: [], reviewFlags: [], scopeFailures: [] });
  });
});

test('Jennifer remains a Person with a sourced practice relationship, not another office', () => {
  document(`public_site/appraiser/${person}/index.html`, doc => {
    const node = primary(doc);
    assert.equal(providerSchemas(doc).length, 1);
    assert.equal(node['@type'], 'Person');
    assert.equal(node['@id'], `${origin}/appraiser/${person}/#provider`);
    assert.equal(node.address, undefined); assert.equal(node.serviceType, undefined);
    assert.equal(node.jobTitle, 'Appraiser at JSK Fine Art Appraisals');
    assert.deepEqual(node.worksFor, { '@type': 'Organization', '@id': `${origin}/appraiser/${company}/#provider`, name: 'JSK Fine Art Appraisals', url: `${origin}/appraiser/${company}/` });
    assert.deepEqual(node.sameAs, [isa]);
    assert.equal(doc.querySelector('[data-provider-relationship-link]').getAttribute('href'), `/appraiser/${company}/`);
    assert.equal(doc.querySelector('[data-provider-person-source]').getAttribute('href'), isa);
    assert.equal(doc.querySelector('[data-gtm-cta="website"]').getAttribute('href'), official);
    assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /not establish a separate personal office/);
    assert.doesNotMatch(doc.title, /Expert|Art Appraiser in Solana Beach/);
    assert.deepEqual(inspectProviderFields(record(person), doc), { failures: [], reviewFlags: [], scopeFailures: [] });
  });
});

test('FAIR company equivalence is not retained for the individual', () => {
  const overlay = JSON.parse(read('data/fair-overlay-matches.json')).overlays;
  assert.equal(overlay.find(row => row.slug === company).fairUrl, fair);
  assert.equal(overlay.find(row => row.slug === person), undefined);
  document(`public_site/appraiser/${person}/index.html`, doc => {
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]'), null);
    assert.equal(doc.querySelector('[data-gtm-cta="fair_registry"]'), null);
    assert.ok(!primary(doc).sameAs.includes(official));
    assert.ok(!primary(doc).sameAs.includes(fair));
  });
});

test('JSK evidence preserves original limited reviews, names, routes and three suppressed variants', () => {
  for (const slug of [company, person]) {
    const row = record(slug);
    assert.equal(row.publicationStatus, 'limited');
    assert.equal(row.verifiedAt, '2026-08-30');
    assert.equal(row.reason, 'website_backed_limited_publication_2026-08-30');
    assert.equal(row.fieldEvidence.company_relationship.checkedAt, '2026-10-08');
    assert.equal(row.fieldEvidence.company_relationship.sourceUrl, about);
    assert.ok(!row.claimScope.includes('qualification'));
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      assert.equal(primary(doc).name, row.name);
      assert.equal(primary(doc).dateModified, '2026-08-30');
      assert.match(doc.querySelector('[data-provider-relationship-review]').textContent, /October 8, 2026/);
    });
  }
  assert.equal(record(person).name, 'Jennifer E Salvetti-Kulla, MA');
  for (const slug of ['los-angeles-jsk-fine-art-appraisals', 'san-diego-jsk-fine-art-appraisals', 'solana-beach-jennifer-e-salvetti-kulla-ma']) {
    assert.equal(record(slug).publicationStatus, 'under_review');
    assert.deepEqual(record(slug).claimScope, []);
    assert.ok(!read('public_site/sitemap.xml').includes(`/appraiser/${slug}/`));
  }
});

test('existing JSK service labels have exact provider-attributed scope, not credential approval', () => {
  const row = record(company);
  assert.deepEqual(row.fieldEvidence.specialties.value, ['Fine art appraisals', 'Estate valuations', 'Insurance appraisals', 'Donation appraisals']);
  assert.deepEqual(row.fieldEvidence.appraisal_use_cases.value, ['Art appraisal services', 'Insurance appraisals', 'Estate and donation appraisals']);
  for (const field of ['specialties', 'appraisal_use_cases']) {
    assert.equal(row.fieldEvidence[field].sourceUrl, official);
    assert.equal(row.fieldEvidence[field].checkedAt, '2026-10-08');
    assert.equal(row.fieldEvidence[field].independentCredentialVerification, false);
    assert.match(row.fieldEvidence[field].note, /recipient acceptance/i);
  }
  document(`public_site/appraiser/${company}/index.html`, doc => {
    const missing = structuredClone(row); delete missing.fieldEvidence.specialties;
    assert.ok(inspectProviderFields(missing, doc).scopeFailures.some(failure => failure.field === 'specialties'));
    const mismatch = structuredClone(row); mismatch.fieldEvidence.appraisal_use_cases.value = ['Guaranteed IRS acceptance'];
    assert.ok(inspectProviderFields(mismatch, doc).failures.some(failure => failure.code === 'visible-service-or-specialty-evidence-mismatch'));
  });
});

test('JSK hub facets and ItemLists distinguish company base from the person', () => {
  document('public_site/appraiser/index.html', doc => {
    const firm = doc.querySelector(`a[href="/appraiser/${company}/"]`).closest('[data-browse-item]');
    const individual = doc.querySelector(`a[href="/appraiser/${person}/"]`).closest('[data-browse-item]');
    assert.equal(firm.dataset.browseFacet, 'Solana Beach, CA');
    assert.match(firm.textContent, /Provider-published company base: Solana Beach, CA/);
    assert.equal(individual.dataset.browseFacet, 'Location not listed');
    assert.match(individual.textContent, /Location not listed for this individual/);
    assert.ok(![...doc.querySelectorAll('[data-browse-facet-control] option, select option')].some(option => option.textContent === 'Temecula, CA'), 'the removed JSK location must not leave an empty filter option');
  });
  document('public_site/location/index.html', doc => {
    const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(node => node['@type'] === 'CollectionPage');
    for (const slug of [company, person]) assert.equal(collection.mainEntity.itemListElement.find(row => row.url === `${origin}/appraiser/${slug}/`).name, doc.querySelector(`a[href="/appraiser/${slug}/"]`).textContent);
  });
});

test('JSK feeds preserve identity reviews and official links, with firm-only base', () => {
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const rows = JSON.parse(read(file)).appraisers;
    assert.equal(rows.length, 209);
    assert.equal(rows.find(row => row.slug === company).address.city, 'Solana Beach');
    assert.equal(rows.find(row => row.slug === person).address, undefined);
    assert.equal(rows.find(row => row.slug === person).serviceType, undefined);
    for (const slug of [company, person]) {
      const row = rows.find(provider => provider.slug === slug);
      assert.equal(row.website, official); assert.equal(row.source.verifiedAt, '2026-08-30');
      assert.match(row.description, /JSK Fine Art Appraisals/);
    }
  }
});

test('JSK negative fixtures reject the old firm base and invented individual office', () => {
  for (const [slug, city, expected] of [[company, 'Temecula', 'primary-location-evidence-mismatch'], [person, 'Solana Beach', 'omitted-location-still-published']]) {
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      const script = doc.querySelector('script[type="application/ld+json"]');
      const nodes = JSON.parse(script.textContent);
      nodes[0].address = { '@type': 'PostalAddress', addressLocality: city, addressRegion: 'CA', addressCountry: 'US' };
      script.textContent = JSON.stringify(nodes);
      assert.ok(inspectProviderFields(record(slug), doc).failures.some(failure => failure.code === expected));
    });
  }
});
