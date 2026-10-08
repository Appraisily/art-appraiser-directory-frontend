import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { assertDocumentParity, assertHandoffAttribution, assertProviderEvidence, assertReviewedInventory, assertUnpublishedDocumentParity, captureDocument } from '../scripts/settled-document-contract.mjs';

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
    for (const field of ['mainText', 'about', 'businesses', 'title', 'descriptions', 'socialDescriptions', 'robots']) {
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

test('handoff allows only the governed generic-directory UTM normalization', () => {
  const url = `${origin}/appraiser/manhattan-fine-art-appraisers/`;
  const original = 'https://appraisily.com/start?utm_source=directory&utm_medium=decision_router&utm_campaign=provider#details';
  const target = new URL(original);
  target.searchParams.set('utm_source', 'art_directory');
  target.searchParams.set('seo_site', 'art_directory');
  target.searchParams.set('ref_path', new URL(url).pathname);
  target.searchParams.set('journey_id', 'qa-journey');
  target.searchParams.set('appraisily_synthetic', 'synthetic_browser');
  assertHandoffAttribution({ handoffs: [original] }, { handoffs: [target.href] }, url);
  const campaignChanged = new URL(target);
  campaignChanged.searchParams.set('utm_campaign', 'other');
  assert.throws(() => assertHandoffAttribution({ handoffs: [original] }, { handoffs: [campaignChanged.href] }, url));
  const destinationChanged = new URL(target);
  destinationChanged.pathname = '/screener';
  assert.throws(() => assertHandoffAttribution({ handoffs: [original] }, { handoffs: [destinationChanged.href] }, url));
  const explicit = original.replace('utm_source=directory', 'utm_source=partner');
  assert.throws(() => assertHandoffAttribution({ handoffs: [explicit] }, { handoffs: [target.href] }, url));
});

test('authored-body parity ignores only the identified shared chat controls', () => {
  const route = '/appraiser/manhattan-fine-art-appraisers/';
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'public_site', route, 'index.html'), 'utf8'), { url: origin + route });
  try {
    const document = dom.window.document;
    assert.equal(document.querySelector('main'), null, 'Fixture must exercise the authored-body fallback');
    const initial = captureDocument(document, origin);
    const controls = [
      ['button', 'data-appraisily-chat-trigger', '💬'],
      ['button', 'data-appraisily-chat-close', '✕'],
      ['div', 'data-appraisily-chat-backdrop', ''],
      ['div', 'data-appraisily-chat-wrap', 'Loading chat…'],
    ];
    for (const [tag, attribute, text] of controls) {
      const node = document.createElement(tag);
      node.setAttribute(attribute, '1');
      node.textContent = text;
      document.body.append(node);
    }
    assertDocumentParity(initial, captureDocument(document, origin), origin + route);
    const unrelated = document.createElement('button');
    unrelated.textContent = 'Unrelated added content';
    document.body.append(unrelated);
    assert.throws(() => assertDocumentParity(initial, captureDocument(document, origin), origin + route), /authored mainText/);
    unrelated.remove();
    document.querySelector('h1').textContent = 'Lost provider identity';
    assert.throws(() => assertDocumentParity(initial, captureDocument(document, origin), origin + route), /authored h1/);
  } finally { dom.window.close(); }
});

test('scripting-mode parser differences normalize only the hidden owned GTM fallback', () => {
  const url = `${origin}/compare-art-appraisers/`;
  const markup = `<title>Comparison</title><meta name="description" content="Comparison"><link rel="canonical" href="${url}"><meta name="robots" content="index, follow"><body><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PSLHDGM" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript><h1>Compare providers</h1><p>Retained provider facts.</p><a href="/get-listed/">Correct a listing</a></body>`;
  const initial = new JSDOM(markup, {url});
  const scripting = new JSDOM(markup, {url, runScripts: 'outside-only'});
  // JSDOM's outside-only parser uses the no-script tree. Reproduce Chrome's
  // scripting-enabled raw-text noscript node without executing any scripts.
  const fallbackNode = scripting.window.document.querySelector('noscript');
  fallbackNode.textContent = fallbackNode.innerHTML;
  try {
    assertDocumentParity(captureDocument(initial.window.document, origin), captureDocument(scripting.window.document, origin), url);
    for (const fragment of [
      '<noscript>Important fallback guidance</noscript>',
      '<noscript><iframe src="https://other.example/" height="0" width="0" style="display:none;visibility:hidden"></iframe>Retained fallback guidance</noscript>',
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PSLHDGM" height="0" width="0" style="display:none;visibility:hidden"></iframe>Important fallback guidance</noscript>',
    ]) {
      const fallback = new JSDOM(markup.replace(/<noscript>[\s\S]*?<\/noscript>/, fragment), {url});
      try {
        assert.match(captureDocument(fallback.window.document, origin).mainText, /fallback guidance/);
      } finally {fallback.window.close();}
    }
    scripting.window.document.querySelector('p').remove();
    assert.throws(() => assertDocumentParity(captureDocument(initial.window.document, origin), captureDocument(scripting.window.document, origin), url), /authored mainText/);
  } finally {initial.window.close(); scripting.window.close();}
});

const unpublished = [
  { file: 'get-listed/index.html', url: `${origin}/get-listed/`, canonical: `${origin}/get-listed/`, robots: 'noindex, follow' },
  { file: 'appraiser-unavailable.html', url: `${origin}/appraiser/__qa_unknown_provider__/`, canonical: null, robots: 'noindex, nofollow' },
];

for (const policy of unpublished) test(`${policy.file} has one static metadata/content owner`, () => {
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'public_site', policy.file), 'utf8'), { url: policy.url });
  try {
    const document = dom.window.document;
    assert.equal(document.querySelector('script[type="module"][src]'), null, 'Support/terminal HTML must not mount the legacy SPA');
    const snapshot = captureDocument(document, origin);
    assertUnpublishedDocumentParity(snapshot, snapshot, policy);
    assert.ok(snapshot.anchors.some((anchor) => /\/(get-listed|contact)(\/|$)/.test(new URL(anchor.destination).pathname)), 'Native correction/contact path missing');
    assert.ok(!input.sitemapUrls.includes(policy.url));
  } finally { dom.window.close(); }
});

test('unpublished parity rejects duplicate metadata, a provider entity and lost native contact', () => {
  const policy = unpublished[0];
  const dom = new JSDOM(fs.readFileSync(path.join(root, 'public_site', policy.file), 'utf8'), { url: policy.url });
  try {
    const initial = captureDocument(dom.window.document, origin);
    for (const field of ['canonicals', 'robots', 'descriptions']) {
      const duplicated = structuredClone(initial);
      duplicated[field].push(duplicated[field][0]);
      assert.throws(() => assertUnpublishedDocumentParity(initial, duplicated, policy), undefined, field);
    }
    assert.throws(() => assertUnpublishedDocumentParity(initial, { ...initial, businesses: [{ '@type': 'ProfessionalService' }] }, policy), /must not claim a provider/);
    assert.throws(() => assertUnpublishedDocumentParity(initial, { ...initial, anchors: [] }, policy), /native link disappeared/);
    assert.throws(() => assertUnpublishedDocumentParity(initial, { ...initial, mainText: 'Legacy replacement' }, policy), /authored mainText/);
    assert.throws(() => assertDocumentParity(initial, initial, policy.url), /must be indexable/, 'Support policy must not weaken the published gate');
    assert.throws(() => assertUnpublishedDocumentParity(initial, initial, { ...policy, robots: 'index, follow' }), /must require noindex/);
  } finally { dom.window.close(); }
});

test('person profiles retain one provider identity without treating worksFor as another business', () => {
  const url = `${origin}/appraiser/__qa_person__/`;
  const person = { '@type': 'Person', name: 'Example person', url, worksFor: {
    '@type': 'Organization', name: 'Example company', url: `${origin}/appraiser/__qa_company__/`,
  } };
  const dom = new JSDOM(`<title>Person profile</title><meta name="description" content="Person role"><link rel="canonical" href="${url}"><meta name="robots" content="index, follow"><h1>Example person</h1><p>Works for Example company.</p><script type="application/ld+json">${JSON.stringify(person)}</script>`, { url });
  try {
    const initial = captureDocument(dom.window.document, origin);
    assert.deepEqual(initial.businesses, [person]);
    assertDocumentParity(initial, initial, url);
    assert.throws(() => assertDocumentParity(initial, { ...initial, businesses: [] }, url), /one provider entity/);
    assert.throws(() => assertDocumentParity(initial, { ...initial, businesses: [person, person] }, url), /one provider entity/);
    assert.throws(() => assertDocumentParity(initial, { ...initial, businesses: [{ ...person, url: person.worksFor.url }] }, url), /schema URL must agree/);
    assert.throws(() => assertDocumentParity(initial, { ...initial, businesses: [{ ...person, '@type': 'ProfessionalService' }] }, url), /authored businesses/);
  } finally { dom.window.close(); }
});

test('no active document invokes the legacy React canonical helper', () => {
  const files = [
    ...input.sitemapUrls.map((url) => `${new URL(url).pathname.slice(1)}index.html`),
    'methodology/index.html', 'get-listed/index.html', 'appraiser-unavailable.html', '404.html', '410.html',
  ];
  for (const file of files) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, 'public_site', file), 'utf8'));
    try {
      assert.equal(dom.window.document.querySelector('script[type="module"][src*="/assets/index-"]'), null, `${file}: legacy SPA entry must remain inactive`);
    } finally { dom.window.close(); }
  }
});
