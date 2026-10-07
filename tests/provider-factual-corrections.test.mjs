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

const remainingQualificationCases = [
  { slug: 'alicia-e-weaver-isa-capp', originalDate: '2026-08-30', status: 'limited',
    scope: 'credential_body_public_listing', independent: true,
    sources: ['https://www.isa-appraisers.org/find-an-appraiser/profile/2647/alicia-weaver'], field: 'name' },
  { slug: 'jennifer-l-stoots-aaa-certified-phototgraphy-and-art-appraiser', originalDate: '2026-10-02', status: 'verified',
    scope: 'provider_attributed', independent: false,
    sources: ['https://photostoots.com/', 'https://photostoots.com/appraisals/'], field: 'name' },
  { slug: 'dudley-certified-appraisers-art-antiques-and-estates', originalDate: '2026-08-30', status: 'limited',
    scope: 'provider_business_name', independent: false,
    sources: ['https://www.dudleyanddudley.com/'], field: 'name' },
  { slug: 'joette-pierce-and-associates', originalDate: '2026-10-01', status: 'verified',
    scope: 'provider_attributed', independent: false,
    sources: ['https://www.joettepierceappraisals.com/', 'https://www.joettepierceappraisals.com/about'], field: 'about' },
];
for (const entry of remainingQualificationCases) {
  test(`${entry.slug}: reviewed qualification scope does not promote the provider or generalize credentials`, () => {
    const record = manifest.providers.find(provider => provider.slug === entry.slug);
    const evidence = record.fieldEvidence?.qualification;
    assert.ok(evidence, 'Reviewed claim requires its individual evidence record');
    assert.equal(record.verifiedAt, entry.originalDate);
    assert.equal(record.publicationStatus, entry.status);
    assert.ok(record.claimScope.includes('qualification'));
    assert.equal(evidence.checkedAt, '2026-10-07');
    assert.equal(evidence.evidenceScope, entry.scope);
    assert.equal(evidence.independentCredentialVerification, entry.independent);
    assert.equal(evidence.sourceUrl, entry.sources[0]);
    assert.deepEqual(evidence.sourceUrls, entry.sources);
    assert.deepEqual(evidence.sourceSnapshots.map(source => source.sourceUrl), entry.sources);
    for (const source of evidence.sourceSnapshots) {
      assert.match(source.bodySha256, /^[a-f0-9]{64}$/);
      assert.match(source.retrievedAt, /^2026-10-07T/);
    }
    const dom = new JSDOM(read(`public_site/appraiser/${entry.slug}/index.html`));
    try {
      const expected = entry.field === 'name' ? record.name
        : dom.window.document.querySelector('[data-provider-specific-about]').textContent.replace(/\s+/g, ' ').trim();
      assert.equal(evidence.value, expected);
      assert.ok(evidence.note.length > 100, 'The qualification support needs an explicit scope boundary');
      const result = inspectProviderFields(record, dom.window.document);
      assert.ok(!result.scopeFailures.some(finding => finding.code === 'published-designation-missing-field-evidence'));
      assert.ok(!result.reviewFlags.some(finding => finding.code === 'qualification-wording-requires-primary-source-review'));
      const without = { ...record, fieldEvidence: { ...record.fieldEvidence } };
      delete without.fieldEvidence.qualification;
      const missing = inspectProviderFields(without, dom.window.document);
      assert.ok([...missing.scopeFailures, ...missing.reviewFlags].some(finding => /designation|qualification/.test(finding.code)));
      if (entry.independent) {
        assert.equal(evidence.verificationBoundary, 'Designation displayed on the credential body public profile on the checked date only');
      }
    } finally { dom.window.close(); }
  });
}

test('Bailey omits unresolved name designations without changing identity, eligibility or review', () => {
  const slug = 'antique-appraisel-and-estate-sale-service-k-and-p-bailey-isa-capp-aaa';
  const name = 'Antique Appraisal and Estate Sale Service - K & P Bailey';
  const record = manifest.providers.find(provider => provider.slug === slug);
  const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`));
  try {
    const document = dom.window.document;
    assert.equal(record.name, name);
    assert.equal(record.nameCorrection.decision, 'omit_unverified_designations');
    assert.equal(record.nameCorrection.checkedAt, '2026-10-07');
    assert.equal(record.nameCorrection.previousName, `${name} ISA CAPP, AAA`);
    assert.equal(record.fieldEvidence?.qualification, undefined);
    assert.deepEqual(record.claimScope, ['identity', 'website']);
    assert.equal(record.publicationStatus, 'limited');
    assert.equal(record.verifiedAt, '2026-08-30');
    assert.equal(document.querySelector('h1').textContent, name);
    assert.doesNotMatch(document.body.textContent, /ISA CAPP|\bAAA\b|Appraisel/);
    const provider = schema(document);
    assert.equal(provider.name, name);
    assert.equal(provider.dateModified, '2026-08-30');
    assert.equal(provider.hasCredential, undefined);
    assert.equal(provider.url, record.previousUrl);
    assert.equal(document.querySelector('link[rel="canonical"]').href, record.previousUrl);
    assert.deepEqual(provider.sameAs, ['https://www.kbaileyantiques.net/',
      'https://fairappraisers.org/appraisers/antique-appraisel-and-estate-sale-service-k-and-p-bailey-isa-capp-aaa-seattle-wa/']);
    for (const node of [document.querySelector('title'), ...document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[name="twitter:title"],meta[name="twitter:description"]')]) {
      const value = node.getAttribute('content') || node.textContent;
      assert.ok(value.includes(name));
      assert.doesNotMatch(value, /ISA CAPP|\bAAA\b/);
    }
    for (const node of document.querySelectorAll('[data-gtm-appraiser-name]')) {
      assert.equal(node.getAttribute('data-gtm-appraiser-name'), name);
      assert.equal(node.getAttribute('data-gtm-appraiser-id'), slug);
    }
    const inspection = inspectProviderFields(record, document);
    const code = 'published-designation-missing-field-evidence';
    assert.ok(!inspection.scopeFailures.some(finding => finding.code === code));
    assert.ok(inspection.scopeFailures.some(finding => finding.code === 'published-location-missing-field-evidence'),
      'Name omission does not waive unrelated locality evidence');
    assert.ok(inspectProviderFields({ ...record, name: record.nameCorrection.previousName }, document)
      .scopeFailures.some(finding => finding.code === code), 'Restoring the old name remains detectable');
    const schemaNode = [...document.querySelectorAll('script[type="application/ld+json"]')][0];
    const values = JSON.parse(schemaNode.textContent);
    values.find(value => value['@type'] === 'ProfessionalService').name = record.nameCorrection.previousName;
    schemaNode.textContent = JSON.stringify(values);
    assert.ok(inspectProviderFields(record, document).scopeFailures.some(finding => finding.code === code),
      'Restoring only schema credentials remains detectable');
  } finally { dom.window.close(); }
  for (const file of ['public_site/appraisers.json', 'public_site/directory.json']) {
    const provider = JSON.parse(read(file)).appraisers.find(value => value.slug === slug);
    assert.equal(provider.name, name);
    assert.doesNotMatch(provider.description, /ISA CAPP|\bAAA\b/);
    assert.equal(provider.source.verifiedAt, '2026-08-30');
    assert.equal(provider.website, record.sourceUrl);
  }
  for (const file of ['public_site/appraiser/index.html', 'public_site/location/index.html']) {
    const browse = new JSDOM(read(file));
    try {
      const document = browse.window.document;
      const link = document.querySelector(`a[href="/appraiser/${slug}/"]`);
      assert.ok(link.textContent.includes(name));
      assert.doesNotMatch(link.closest('li').outerHTML, /ISA CAPP|\bAAA\b/);
      const list = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map(node => JSON.parse(node.textContent)).find(value => value['@type'] === 'CollectionPage');
      const item = list.mainEntity.itemListElement.find(value => value.url === record.previousUrl);
      assert.equal(item.name, link.textContent);
    } finally { browse.window.close(); }
  }
});

const correctedSummaries = [
  {
    slug: 'art-directives',
    summary: "Before booking with ART DIRECTIVES, confirm the artwork categories covered, inspection arrangements and the assigned appraiser's current qualifications directly with the business.",
    oldSummary: 'ART DIRECTIVES in San Diego, CA provides thorough art appraisals by unbiased, certified appraisers for art and antiques.',
    sourceUrl: 'https://www.artdirectives.com/',
  },
  {
    slug: 'art-fortune-llc',
    summary: "Art Fortune's website lists appraisal services for paintings, antiques and collectibles, with Elena Von Kohn leading its appraisal team. Confirm the report's intended use, the assigned appraiser's qualifications and inspection arrangements directly before engagement.",
    oldSummary: 'Art Fortune LLC provides certified art and antique appraisals in Scottsdale and the greater Phoenix area. Their certified appraisers ensure precise evaluations based on the most relevant information, providing clarity on the true market value.',
    sourceUrl: 'https://www.artfortune.com/',
  },
];

for (const entry of correctedSummaries) {
  test(`${entry.slug}: summary does not imply independent certification or a guaranteed value`, () => {
    const record = manifest.providers.find(provider => provider.slug === entry.slug);
    const dom = new JSDOM(read(`public_site/appraiser/${entry.slug}/index.html`));
    try {
      const document = dom.window.document;
      const summary = document.querySelector('[data-provider-specific-about="true"]');
      assert.equal(summary?.textContent, entry.summary);
      assert.doesNotMatch(summary.textContent, /certified|unbiased|precise evaluations|true market value/i);
      assert.equal(record.publicationStatus, 'limited');
      assert.equal(record.verifiedAt, '2026-08-30');
      assert.equal(record.sourceUrl, entry.sourceUrl);
      assert.equal(record.fieldEvidence?.qualification, undefined, 'Removal is not credential verification');
      assert.equal(schema(document).dateModified, '2026-08-30');
      assert.equal(schema(document).serviceType, 'Directory listing');
      assert.equal(feed.find(provider => provider.slug === entry.slug).source.verifiedAt, '2026-08-30');
      const inspect = () => inspectProviderFields(record, document);
      assert.ok(!inspect().reviewFlags.some(finding => finding.code === 'qualification-wording-requires-primary-source-review'));
      summary.textContent = entry.oldSummary;
      assert.ok(inspect().reviewFlags.some(finding => finding.code === 'qualification-wording-requires-primary-source-review'),
        'Restoring the original unsupported claim must restore its review lead');
      if (entry.slug === 'art-fortune-llc') {
        const evidence = record.fieldEvidence.provider_summary;
        assert.equal(evidence.value, entry.summary);
        assert.equal(evidence.sourceUrl, 'https://www.artfortune.com/services/appraisals/');
        assert.equal(evidence.checkedAt, '2026-10-07');
        assert.equal(evidence.evidenceScope, 'provider_attributed');
        assert.equal(evidence.independentCredentialVerification, false);
        assert.equal(evidence.sourceSnapshots.length, 1);
        assert.match(evidence.sourceSnapshots[0].bodySha256, /^[a-f0-9]{64}$/);
        const note = document.querySelector('[data-provider-field-check="provider_summary"]');
        assert.match(note?.textContent, /Provider-published service information checked October 7, 2026/);
        assert.equal(note.querySelector('a').href, evidence.sourceUrl);
        assert.ok(record.claimScope.includes('fine_art_services'));
      } else {
        assert.equal(record.fieldEvidence, undefined, 'Failed retrieval cannot create affirmative source evidence');
        assert.deepEqual(record.claimScope, ['identity', 'website']);
      }
    } finally { dom.window.close(); }
  });
}

for (const [slug, personName, designation, profileId] of [
  ['alicia-e-weaver-isa-capp', 'Alicia E Weaver', 'ISA CAPP', '2647'],
  ['christine-h-anderson-isa-am', 'Christine H Anderson', 'ISA AM', '17050'],
]) {
  test(`${slug}: credential-body designation evidence is exact and separate from provider identity`, () => {
    const record = manifest.providers.find(provider => provider.slug === slug);
    const evidence = record.fieldEvidence?.qualification;
    assert.equal(evidence?.credentialBody, 'International Society of Appraisers');
    assert.deepEqual({ ...evidence.credentialClaim, profileHeading: undefined },
      { personName, designation, profileId, profileHeading: undefined });
    assert.ok(evidence.credentialClaim.profileHeading.startsWith(`${personName}, ${designation}, `));
    assert.equal(evidence.evidenceScope, 'credential_body_public_listing');
    assert.equal(evidence.independentCredentialVerification, true);
    assert.equal(evidence.value, record.name);
    assert.equal(evidence.checkedAt, '2026-10-07');
    assert.ok(record.claimScope.includes('qualification'));
    assert.equal(record.verifiedAt, '2026-08-30');
    assert.equal(record.publicationStatus, 'limited');
    assert.equal(evidence.sourceSnapshots.length, 1);
    assert.equal(evidence.sourceSnapshots[0].sourceUrl, evidence.sourceUrl);
    assert.match(evidence.sourceSnapshots[0].bodySha256, /^[a-f0-9]{64}$/);
    assert.match(evidence.sourceSnapshots[0].retrievedAt, /^2026-10-07T/);
    if (slug === 'christine-h-anderson-isa-am') {
      assert.equal(record.sourceUrl, 'https://www.guardianfineart.com/');
      assert.equal(evidence.sourceUrl, 'https://www.isa-appraisers.org/find-an-appraiser/profile/17050/christine-h-anderson');
    }
    const dom = new JSDOM(read(`public_site/appraiser/${slug}/index.html`));
    try {
      const inspect = qualification => inspectProviderFields({ ...record, fieldEvidence: { qualification } }, dom.window.document);
      const code = 'published-designation-missing-field-evidence';
      assert.ok(!inspect(evidence).scopeFailures.some(row => row.code === code));
      for (const bad of [undefined, { ...evidence, credentialClaim: { ...evidence.credentialClaim, personName: 'Another Person' } },
        { ...evidence, sourceUrl: 'https://www.isa-appraisers.org/' }]) {
        assert.ok(inspect(bad).scopeFailures.some(row => row.code === code));
      }
    } finally { dom.window.close(); }
  });
}
