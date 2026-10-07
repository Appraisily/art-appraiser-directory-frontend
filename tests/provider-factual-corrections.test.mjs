import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { inspectProviderFields } from '/srv/repos/tools/directory-site-utils/provider-field-evidence.mjs';

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

test('Open names the current principal with a separate sourced field check', () => {
  const record = manifest.providers.find(p => p.slug === 'open-to-the-public');
  const document = profile(record.slug);
  assert.match(document.querySelector('[data-provider-specific-about]').textContent, /led by Kaycee Baron/);
  assert.match(document.querySelector('[data-provider-field-check="principal_name"]').textContent,
    /2026-10-07.*Kaycee Baron.*previously practiced as Kaycee Olsen/);
  assert.equal(record.fieldEvidence.principal_name.value, 'Kaycee Baron');
  assert.equal(record.fieldEvidence.principal_name.sourceUrl, 'https://opentothepublic.art/about/');
  assert.equal(record.fieldEvidence.principal_name.checkedAt, '2026-10-07');
  assert.doesNotMatch(document.body.textContent, /led by Kaycee Olsen|identifies Kaycee Olsen as/);
  assert.equal(record.verifiedAt, '2026-07-15');
  assert.equal(schema(document).dateModified, record.verifiedAt);
  assert.equal(record.publicationStatus, 'verified');
});

test('DeCarrera distinguishes its contact locality from service coverage', () => {
  const record = manifest.providers.find(p => p.slug === 'decarrera-fine-art');
  const document = profile(record.slug);
  assert.equal(schema(document).address.addressLocality, 'Newport Beach');
  assert.equal(schema(document).address.addressRegion, 'CA');
  assert.equal(document.querySelector('[data-provider-locality]').textContent,
    'Provider-published contact locality: Newport Beach, California. Service area: Los Angeles and Orange County.');
  const check = document.querySelector('[data-provider-field-check="primary_location"]');
  assert.match(check.textContent, /2026-10-07/);
  assert.equal(check.querySelector('a').href, 'https://dcfineart.com/contact/');
  assert.match(document.body.textContent, /Confirm appointment and inspection arrangements directly/);
  assert.equal(record.fieldEvidence.primary_location.sourceUrl, 'https://dcfineart.com/contact/');
  assert.equal(record.fieldEvidence.primary_location.checkedAt, '2026-10-07');
  assert.deepEqual(record.fieldEvidence.primary_location.value, {city: 'Newport Beach', region: 'CA', country: 'US'});
  assert.equal(record.verifiedAt, '2026-10-01');
  assert.equal(schema(document).dateModified, record.verifiedAt);
  assert.equal(record.publicationStatus, 'verified');
});

test('DeCarrera browse and comparison labels retain the contact/service boundary', () => {
  const browse = new JSDOM(read('public_site/appraiser/index.html')).window.document;
  const row = browse.querySelector('a[href="/appraiser/decarrera-fine-art/"]').closest('[data-browse-item]');
  assert.equal(row.dataset.browseFacet, 'Newport Beach, CA');
  assert.match(row.dataset.browseSearch, /Newport Beach.*Los Angeles.*Orange County/);
  assert.match(row.textContent, /Contact locality: Newport Beach, CA.*Service area: Los Angeles and Orange County/);
  const locations = new JSDOM(read('public_site/location/index.html')).window.document;
  assert.equal(locations.querySelector('a[href="/appraiser/decarrera-fine-art/"]').textContent,
    'DeCarrera Fine Art — Newport Beach contact locality; serves Los Angeles and Orange County');
  const collection = [...locations.querySelectorAll('script[type="application/ld+json"]')]
    .map(node => JSON.parse(node.textContent)).find(node => node['@type'] === 'CollectionPage');
  assert.equal(collection.mainEntity.itemListElement.find(node => node.url.endsWith('/decarrera-fine-art/')).name,
    locations.querySelector('a[href="/appraiser/decarrera-fine-art/"]').textContent);
  const comparison = new JSDOM(read('public_site/compare-art-appraisers/index.html')).window.document;
  const compared = comparison.querySelector('[data-provider-slug="decarrera-fine-art"]');
  assert.match(compared.textContent, /Contact locality: Newport Beach.*Service area: Los Angeles and Orange County/);
  assert.equal(compared.querySelector('time').getAttribute('datetime'), '2026-10-01');
  assert.match(compared.querySelector('[data-provider-field-check]').textContent, /2026-10-07/);
});

test('corrected feeds preserve original review dates and provider eligibility', () => {
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const providers = JSON.parse(read(file)).appraisers;
    const decarrera = providers.find(p => p.slug === 'decarrera-fine-art');
    assert.equal(decarrera.address.city, 'Newport Beach');
    assert.equal(decarrera.source.verifiedAt, '2026-10-01');
    assert.equal(providers.find(p => p.slug === 'open-to-the-public').source.verifiedAt, '2026-07-15');
    assert.equal(providers.length, 209);
  }
  assert.equal([...read('public_site/sitemap.xml').matchAll(/<loc>/g)].length, 292);
});

test('field-evidence regression rejects restoring DeCarrera to a Los Angeles office', () => {
  const record = manifest.providers.find(p => p.slug === 'decarrera-fine-art');
  const document = profile(record.slug);
  assert.equal(inspectProviderFields(record, document).failures.length, 0);
  const node = document.querySelector('script[type="application/ld+json"]');
  const provider = JSON.parse(node.textContent);
  provider.address.addressLocality = 'Los Angeles';
  node.textContent = JSON.stringify(provider);
  assert.ok(inspectProviderFields(record, document).failures.some(failure =>
    failure.code === 'primary-location-evidence-mismatch' && failure.field === 'addressLocality'));
});

const qualificationSources = new Map([
  ['afp-art-consulting-llc-fine-art-consulting-appraisals-research-writing-and-collections-man', ['https://afpartconsulting.com/bio', 'https://afpartconsulting.com/art-consulting-services']],
  ['heidi-vaughan-ma-isa-am', ['https://heidivaughanfineart.com/about', 'https://heidivaughanfineart.com/gallery-team']],
  ['open-to-the-public', ['https://opentothepublic.art/about/']],
  ['sarah-ann-wilson-art-services', ['https://www.wilsonartservices.com/']],
  ['st-lifer-art-inc-international-art-appraiser', ['https://stliferart.com/about-the-appraiser/', 'https://stliferart.com/appraisals/appraisal-services/']],
]);
for (const [slug, sourceUrls] of qualificationSources) {
  test(`${slug}: qualification provenance preserves attribution, exact wording and original review`, () => {
    const record = manifest.providers.find(provider => provider.slug === slug);
    const evidence = record.fieldEvidence?.qualification;
    assert.ok(evidence, 'Visible qualifications need their own field-level provenance');
    assert.equal(evidence.checkedAt, '2026-10-07');
    assert.equal(evidence.evidenceScope, 'provider_attributed');
    assert.equal(evidence.independentCredentialVerification, false);
    assert.equal(evidence.sourceUrl, sourceUrls[0]);
    assert.deepEqual(evidence.sourceUrls, sourceUrls);
    assert.deepEqual(evidence.sourceSnapshots.map(source => source.sourceUrl).sort(), [...sourceUrls].sort());
    for (const source of evidence.sourceSnapshots) {
      assert.match(source.bodySha256, /^[a-f0-9]{64}$/);
      assert.match(source.retrievedAt, /^2026-10-07T/);
    }
    assert.ok(record.claimScope.includes('qualification'));
    assert.equal(record.verifiedAt, '2026-07-15');
    assert.equal(record.publicationStatus, 'verified');
    const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`));
    try {
      const document = dom.window.document;
      const heading = [...document.querySelectorAll('h2')].find(node => node.textContent.trim() === 'Verified qualifications');
      const visible = heading.closest('section').querySelector('p').textContent.replace(/\s+/g, ' ').trim();
      assert.equal(evidence.value, visible);
      assert.match(visible, /^The official website (?:states|identifies)/);
      assert.equal(schema(document).dateModified, '2026-07-15');
      const code = 'published-designation-missing-field-evidence';
      assert.ok(!inspectProviderFields(record, document).scopeFailures.some(finding => finding.code === code));
      const withoutEvidence = { ...record, fieldEvidence: { ...record.fieldEvidence } };
      delete withoutEvidence.fieldEvidence.qualification;
      assert.ok(inspectProviderFields(withoutEvidence, document).scopeFailures.some(finding => finding.code === code));
    } finally { dom.window.close(); }
  });
}
