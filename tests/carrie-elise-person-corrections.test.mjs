import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields, providerSchemas } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';
import { assertProviderHandoff, captureProviderHandoff } from '../scripts/provider-handoff-contract.mjs';

const root = new URL('../', import.meta.url), origin = 'https://art-appraisers-directory.appraisily.com';
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const records = JSON.parse(read('data/provider-publication-manifest.json')).providers;
const unsupportedAboutClaims = /retained as a directory record|\b(?:accredited|ISA|USPAP|IRS|certified)\b/i;
const people = [
  { slug: 'carrie-young', name: 'Carrie Young', office: 'Addison', region: 'IL', source: 'https://leonardappraisal.com/', fair: 'https://fairappraisers.org/appraisers/carrie-young-addison-il/#person', contact: 'https://leonardappraisal.com/contact/', contactSha: '8ac244ead8b3d45a76caac7d9bc862e86b4ec58aae6e616739398443c4338fce' },
  { slug: 'elise-waters-olonia', name: 'Elise Waters Olonia', office: 'Ranchos De Taos', region: 'NM', source: 'https://www.fineartservices.info/', fair: 'https://fairappraisers.org/appraisers/elise-waters-olonia-ranchos-de-taos-nm/#person', contact: 'https://www.fineartservices.info/contact', contactSha: '1999208022f84d9267ee6a0e16985c9d5f22f1ec282f6f1ce94b52a3338aaaf4' },
];
const provider = person => records.find(row => row.slug === person.slug);
test('credential assertion tokens reject actual claims, not the letters inside appraisal', () => {
  assert.doesNotMatch('Confirm the appraisal scope and inspection arrangements.', unsupportedAboutClaims);
  for (const claim of ['ISA AM', 'USPAP compliant', 'IRS accepted', 'certified expert', 'accredited appraiser']) {
    assert.match(claim, unsupportedAboutClaims);
    for (const person of people) document(`public_site/appraiser/${person.slug}/index.html`, doc => {
      doc.querySelector('[data-provider-specific-about]').textContent = claim;
      assert.throws(() => assertPerson(doc, person));
    });
  }
});
function document(name, fn) {
  const dom = new JSDOM(read(name), { url: origin });
  try { fn(dom.window.document); } finally { dom.window.close(); }
}
function assertPerson(doc, person) {
  const nodes = providerSchemas(doc); assert.equal(nodes.length, 1);
  const node = nodes[0]; assert.equal(node['@type'], 'Person');
  assert.equal(node.name, person.name); assert.equal(node.dateModified, '2026-08-30');
  for (const key of ['address', 'serviceType', 'aggregateRating', 'image', 'hasCredential']) assert.equal(node[key], undefined);
  assert.deepEqual(node.sameAs, person.slug === 'carrie-young' ? [person.fair] : [person.source, person.fair]);
  if (person.slug === 'carrie-young') assert.deepEqual(node.worksFor, { '@type': 'Organization', name: 'Leonard Appraisal, LLC', url: person.source });
  else assert.equal(node.worksFor, undefined);
  const about = doc.querySelector('[data-provider-specific-about]'); assert.ok(about);
  assert.doesNotMatch(about.textContent, unsupportedAboutClaims);
  assert.match(about.textContent, /inspection/);
  assert.match(doc.querySelector('[data-provider-field-review]').textContent, /October 8, 2026/);
  assert.match(doc.querySelector('[data-provider-field-review]').textContent, /August 30, 2026/);
  assert.equal(doc.querySelector('meta[name="appraisily:fair-profile"]').content, person.fair);
  assert.equal(doc.querySelector('[data-gtm-cta="website"]').href, person.source);
  assert.equal(doc.querySelector('meta[name="appraisily:provider-source"]').content, person.source);
  assert.doesNotMatch(doc.title, /Addison|Ranchos De Taos|Expert Art Valuation/);
  assert.equal(doc.querySelector('nav a[href^="/location/"]'), null);
  assert.equal(doc.querySelector('nav a[href="/appraiser/"]').textContent.trim(), 'Art appraisers');
  const description = doc.querySelector('meta[name="description"]').content;
  assert.equal(node.description, description);
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) assert.equal(doc.querySelector(selector).content, description);
  for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) assert.equal(doc.querySelector(selector).content, doc.title);
  assertProviderHandoff(captureProviderHandoff(doc, origin), provider(person));
}
for (const person of people) {
  test(`${person.slug}: named identity/locality evidence does not promote old review`, () => {
    const row = provider(person), evidence = row.fieldEvidence?.primary_location;
    assert.equal(row.publicationStatus, 'limited'); assert.equal(row.verifiedAt, '2026-08-30');
    assert.equal(row.canonicalProviderId, `provider:${person.slug}`);
    assert.equal(row.previousUrl, `${origin}/appraiser/${person.slug}/`);
    assert.equal(row.sourceUrl, person.source);
    assert.equal(evidence?.decision, 'omit'); assert.equal(evidence.checkedAt, '2026-10-08');
    assert.equal(evidence.sourceUrl, person.contact); assert.equal(evidence.independentCredentialVerification, false);
    assert.equal(evidence.sourceSnapshots.find(row => row.sourceUrl === person.contact)?.bodySha256, person.contactSha);
    for (const source of evidence.sourceSnapshots) {
      assert.match(source.bodySha256, /^[a-f0-9]{64}$/); assert.match(source.retrievedAt, /^2026-10-08T/);
    }
    assert.deepEqual(row.claimScope, ['identity', 'website']);
  });
  test(`${person.slug}: authored Person, metadata, source note and handoff agree`, () => document(`public_site/appraiser/${person.slug}/index.html`, doc => {
    assertPerson(doc, person);
    assert.deepEqual(inspectProviderFields(provider(person), doc), { failures: [], reviewFlags: [], scopeFailures: [] });
  }));
  test(`${person.slug}: an old office, service node or borrowed identity fails`, () => {
    for (const mutate of [
      node => { node.address = { '@type': 'PostalAddress', addressLocality: person.office, addressRegion: person.region, addressCountry: 'US' }; },
      node => { node['@type'] = 'ProfessionalService'; },
      node => { node.sameAs = [person.fair.replace('#person', '#professionalservice')]; },
    ]) document(`public_site/appraiser/${person.slug}/index.html`, doc => {
      const script = doc.querySelector('script[type="application/ld+json"]'), nodes = JSON.parse(script.textContent);
      mutate(nodes[0]); script.textContent = JSON.stringify(nodes);
      assert.throws(() => assertPerson(doc, person));
      if (nodes[0].address) assert.ok(inspectProviderFields(provider(person), doc).failures.some(row => row.code === 'omitted-location-still-published'));
    });
  });
}
test('Carrie is a named team member, not Leonard company equivalence or its mailing office', () => {
  const evidence = provider(people[0]).fieldEvidence;
  assert.equal(evidence.company_relationship.value.name, 'Leonard Appraisal, LLC');
  assert.equal(evidence.company_relationship.sourceUrl, 'https://leonardappraisal.com/about/');
  assert.equal(evidence.company_relationship.sourceSnapshots.find(row => row.sourceUrl.endsWith('/about/')).bodySha256, 'd91ddd01f2bad97f6cfa7d9536d4bbe67b01e23c9058968732238702e07e4777');
  assert.match(evidence.primary_location.note, /mailing/);
  document('public_site/appraiser/carrie-young/index.html', doc => assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /team/));
});
test('Elise is the named person; a historical Taos project is not current office evidence', () => {
  const evidence = provider(people[1]).fieldEvidence;
  assert.equal(evidence.person_identity.value.name, 'Elise Waters Olonia');
  assert.equal(evidence.person_identity.sourceSnapshots[0].bodySha256, '494bf344d55e48185cad9d7f1fa2227c804c4a248dc48d692ffa78b2ddea39a9');
  assert.match(evidence.primary_location.note, /project history/);
  document('public_site/appraiser/elise-waters-olonia/index.html', doc => assert.match(doc.querySelector('[data-provider-specific-about]').textContent, /legacy.planning/));
});
test('provider hub facets derive only from the remaining published roster', () => document('public_site/appraiser/index.html', doc => {
  for (const person of people) {
    const row = doc.querySelector(`a[href="/appraiser/${person.slug}/"]`).closest('[data-browse-item]');
    assert.equal(row.dataset.browseFacet, 'Location not listed');
    assert.match(row.textContent, /Location not listed for this individual/);
    assert.doesNotMatch(row.dataset.browseSearch, /Addison|Ranchos De Taos/);
  }
  const facets = new Set([...doc.querySelectorAll('[data-browse-item]')].map(row => row.dataset.browseFacet).filter(Boolean));
  const options = new Set([...doc.querySelectorAll('select[data-browse-facet] option')].map(row => row.value).filter(Boolean));
  assert.deepEqual(options, facets);
}));
test('location hub visible labels and ItemList do not invent personal offices', () => document('public_site/location/index.html', doc => {
  const collection = [...doc.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(row => row['@type'] === 'CollectionPage');
  assert.equal(collection.mainEntity.numberOfItems, 209);
  for (const person of people) {
    const name = `${person.name} — location not listed`;
    assert.equal(doc.querySelector(`a[href="/appraiser/${person.slug}/"]`).textContent, name);
    assert.equal(collection.mainEntity.itemListElement.find(row => row.url === `${origin}/appraiser/${person.slug}/`).name, name);
  }
}));
for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) test(`${file}: both Person records retain source/review with unknown locality`, () => {
  const rows = JSON.parse(read(file)).appraisers; assert.equal(rows.length, 209);
  for (const person of people) {
    const row = rows.find(row => row.slug === person.slug);
    assert.equal(row.address, undefined); assert.equal(row.serviceType, undefined);
    assert.equal(row.source.verifiedAt, '2026-08-30'); assert.equal(row.website, person.source);
    assert.doesNotMatch(row.description, /Addison|Ranchos De Taos|Expert Art Valuation/);
  }
});
