import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

const root = new URL('../', import.meta.url);
const origin = 'https://art-appraisers-directory.appraisily.com';
const official = 'https://prestigeestateservices.com/';
const team = `${official}appraisals/meet-our-appraisers/`;
const alicia = `${official}appraiser/alicia-weaver/`;
const elizabeth = `${official}appraiser/elizabeth-lovett/`;
const isa = 'https://www.isa-appraisers.org/find-an-appraiser/profile/2647/alicia-weaver';
const fairPerson = 'https://fairappraisers.org/appraisers/alicia-e-weaver-boulder-co/#person';
const slugs = ['alicia-e-weaver-isa-capp', 'alicia-weaver', 'edward-kitson', 'elizabeth-lake-lovett', 'elizabeth-lovett', 'stephanie-calman'];
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const record = slug => records.find(row => row.slug === slug);
const sameAs = slug => slug === slugs[0] ? [alicia, isa, fairPerson] : slug === slugs[1] ? [alicia] : [slugs[3], slugs[4]].includes(slug) ? [elizabeth] : [];
const sourceReviewFlags = slug => slug === slugs[0] ? [
  { code:'source-provenance-third-party-recorded-as-provider-website', slug,
    sourceUrl:'https://www.isa-appraisers.org/', sourceRole:'credential_body_registry', sourceType:'official_website' },
  { code:'source-provenance-third-party-labelled-as-provider-website', slug,
    sourceUrl:'https://www.isa-appraisers.org/', sourceRole:'credential_body_registry',
    sources:['native:website', 'visible:publication-status'] },
  { code:'source-provenance-generic-credential-body-root', slug,
    sourceUrl:'https://www.isa-appraisers.org/', sourceRole:'credential_body_registry' },
] : [];
function document(file, action) {
  const dom = new JSDOM(read(file), { url: origin });
  try { action(dom.window.document); } finally { dom.window.close(); }
}
function assertPerson(node, slug) {
  assert.equal(node['@type'], 'Person');
  assert.equal(node['@id'], `${origin}/appraiser/${slug}/#provider`);
  assert.equal(node.address, undefined); assert.equal(node.serviceType, undefined);
  assert.equal(node.hasCredential, undefined); assert.equal(node.image, undefined);
  assert.deepEqual(node.sameAs || [], sameAs(slug));
  assert.deepEqual(node.worksFor, { '@type': 'Organization', '@id': `${official}#organization`, name: 'Prestige Estate Services', url: official });
}

for (const slug of slugs) {
  test(`${slug}: individual identity and provider-attributed affiliation, not a local business`, () => {
    document(`public_site/appraiser/${slug}/index.html`, doc => {
      const nodes = providerSchemas(doc);
      assert.equal(nodes.length, 1); assertPerson(nodes[0], slug);
      assert.equal(nodes[0].name, record(slug).name);
      assert.equal(nodes[0].dateModified, '2026-08-30');
      assert.doesNotMatch(doc.title, /Expert|Art Appraiser in|Dallas|Las Vegas|Palm Beach|Fort Worth/);
      assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /Prestige/);
      assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /individual|office|location|assignment/i);
      assert.match(doc.querySelector('[data-provider-relationship-review]').textContent, /October 8, 2026/);
      assert.equal(doc.querySelector('[data-provider-person-source]').getAttribute('href'), slug.startsWith('alicia') ? alicia : slug.startsWith('elizabeth') ? elizabeth : team);
      assert.equal(doc.querySelector('[data-gtm-cta="website"]').getAttribute('href'), record(slug).sourceUrl);
      assert.equal(doc.querySelector('[data-provider-publication-status]').getAttribute('data-provider-publication-status'), 'limited');
      assert.deepEqual(inspectProviderFields(record(slug), doc), { failures: [], reviewFlags: sourceReviewFlags(slug), scopeFailures: [] });
    });
  });
}

test('exact Alicia Person reference is retained; company FAIR records are removed from individuals', () => {
  const overlays = JSON.parse(read('data/fair-overlay-matches.json')).overlays;
  assert.equal(overlays.find(row => row.slug === slugs[0]).fairUrl, fairPerson);
  assert.equal(overlays.find(row => row.slug === slugs[0]).entityReview.entityType, 'Person');
  for (const slug of slugs) document(`public_site/appraiser/${slug}/index.html`, doc => {
    assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]')?.content, slug === slugs[0] ? fairPerson : undefined);
    assert.ok(!doc.documentElement.outerHTML.includes('prestige-estate-services-national-network-seattle-wa'));
    if (slug !== slugs[0]) assert.equal(overlays.find(row => row.slug === slug), undefined);
  });
});

test('six original reviews and routes remain; identity checks do not add qualifications', () => {
  for (const slug of slugs) {
    const row = record(slug);
    assert.equal(row.publicationStatus, 'limited'); assert.equal(row.verifiedAt, '2026-08-30');
    assert.equal(row.reason, 'website_backed_limited_publication_2026-08-30');
    assert.equal(row.previousUrl, `${origin}/appraiser/${slug}/`);
    assert.equal(row.fieldEvidence.primary_location.decision, 'omit');
    assert.equal(row.fieldEvidence.company_relationship.checkedAt, '2026-10-08');
    assert.equal(row.fieldEvidence.company_relationship.independentCredentialVerification, false);
    assert.ok(read('public_site/sitemap.xml').includes(row.previousUrl));
    if (slug !== slugs[0]) {
      assert.equal(row.fieldEvidence.qualification, undefined);
      assert.ok(!row.claimScope.includes('qualification'));
    }
  }
  const q = record(slugs[0]).fieldEvidence.qualification;
  assert.equal(q.checkedAt, '2026-10-07'); assert.equal(q.sourceUrl, isa);
  assert.equal(q.credentialClaim.profileId, '2647'); assert.equal(q.credentialClaim.designation, 'ISA CAPP');
  assert.equal(q.sourceSnapshots[0].bodySha256, 'd5204f9ec624a05ed40a80d9775846fc04124efcd9d16ff460562dd8406c0f5b');
  assert.equal(record(slugs[0]).canonicalProviderId, 'provider:alicia-e-weaver');
});

test('hubs and machine feeds omit the same six unsupported personal locations', () => {
  document('public_site/appraiser/index.html', doc => {
    for (const slug of slugs) {
      const row = doc.querySelector(`a[href="/appraiser/${slug}/"]`).closest('[data-browse-item]');
      assert.equal(row.dataset.browseFacet, 'Location not listed');
      assert.match(row.textContent, /Location not listed for this individual/);
    }
    const facets = new Set([...doc.querySelectorAll('[data-browse-item]')].map(row => row.dataset.browseFacet).filter(Boolean));
    const options = [...doc.querySelectorAll('select[data-browse-facet] option')].map(option => option.value).filter(Boolean);
    assert.ok(options.length, 'The real provider filter must be exercised');
    assert.deepEqual(new Set(options), facets);
  });
  document('public_site/location/index.html', doc => {
    const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(node => node['@type'] === 'CollectionPage');
    for (const slug of slugs) {
      const anchor = doc.querySelector(`a[href="/appraiser/${slug}/"]`);
      assert.equal(anchor.textContent, `${record(slug).name} — location not listed`);
      assert.equal(collection.mainEntity.itemListElement.find(row => row.url === `${origin}/appraiser/${slug}/`).name, anchor.textContent);
    }
  });
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const rows = JSON.parse(read(file)).appraisers; assert.equal(rows.length, 209);
    for (const slug of slugs) {
      const row = rows.find(provider => provider.slug === slug);
      assert.equal(row.address, undefined); assert.equal(row.serviceType, undefined);
      assert.equal(row.website, record(slug).sourceUrl); assert.equal(row.source.verifiedAt, '2026-08-30');
      assert.match(row.description, /Prestige/);
    }
  }
});

test('negative fixtures reject borrowed offices, company identity and unsupported credentials', () => {
  for (const slug of slugs) document(`public_site/appraiser/${slug}/index.html`, doc => {
    const node = providerSchemas(doc)[0];
    for (const mutation of [n => { n.address = { '@type': 'PostalAddress', addressLocality: 'Las Vegas' }; }, n => { n.sameAs = [official]; }, n => { n.hasCredential = { '@type': 'EducationalOccupationalCredential', name: 'ASA' }; }]) {
      const wrong = structuredClone(node); mutation(wrong); assert.throws(() => assertPerson(wrong, slug));
    }
    const script = doc.querySelector('script[type="application/ld+json"]'), nodes = JSON.parse(script.textContent);
    nodes[0].address = { '@type': 'PostalAddress', addressLocality: 'Las Vegas' }; script.textContent = JSON.stringify(nodes);
    assert.ok(inspectProviderFields(record(slug), doc).failures.some(row => row.code === 'omitted-location-still-published'));
  });
});
