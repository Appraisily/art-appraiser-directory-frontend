import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const root = path.resolve(import.meta.dirname, '..');
const origin = 'https://art-appraisers-directory.appraisily.com';
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const pages = JSON.parse(read('data/directory-resource-pages.json'));
const manifest = JSON.parse(read('data/provider-publication-manifest.json'));
const reviewed = manifest.providers.filter((provider) => provider.publicationStatus === 'verified');
const open = (route) => new JSDOM(read(`public_site/${route.replace(/^\//, '')}index.html`));

test('comparison contains exactly the source-reviewed cohort with original dates and official sources', () => {
  const dom = open('/compare-art-appraisers/');
  try {
    const rows = [...dom.window.document.querySelectorAll('tr[data-provider-slug]')];
    assert.deepEqual(rows.map((row) => row.dataset.providerSlug).sort(), reviewed.map((provider) => provider.slug).sort());
    for (const provider of reviewed) {
      const row = rows.find((entry) => entry.dataset.providerSlug === provider.slug);
      assert.equal(row.querySelector('[data-official-source]').getAttribute('href'), provider.sourceUrl, provider.slug);
      assert.equal(row.querySelector('time').getAttribute('datetime'), provider.verifiedAt, provider.slug);
      assert.equal(row.querySelector('[data-cta-kind="provider_profile"]').getAttribute('href'), `/appraiser/${provider.slug}/`);
      assert.equal(row.querySelectorAll('td[data-label]').length, 3, 'mobile retains every comparison field');
      for (const link of row.querySelectorAll('a')) assert.equal(link.dataset.gtmEvent, 'directory_cta');
    }
    assert.match(dom.window.document.body.textContent, /Mill Valley mailing locality/);
    assert.match(dom.window.document.body.textContent, /not recommendations or a ranking/);
    assert.equal(dom.window.document.querySelector('[itemprop="aggregateRating"]'), null);
  } finally { dom.window.close(); }
});

test('both resources have first-response content, self-canonicals and distinct indexable sitemap entries', () => {
  const sitemap = read('public_site/sitemap.xml');
  const indexing = JSON.parse(read('public_site/indexing-manifest.json'));
  for (const page of pages) {
    const dom = open(page.path);
    try {
      const document = dom.window.document;
      assert.equal(document.title, page.title);
      assert.equal(document.querySelector('link[rel="canonical"]').href, origin + page.path);
      assert.equal(document.querySelector('meta[name="robots"]').content, 'index, follow');
      assert.equal(document.querySelectorAll('h1').length, 1);
      assert.ok(document.querySelector('meta[name="description"]').content.length >= 40);
      assert.ok(document.querySelectorAll('main section').length <= 6);
      for (const script of document.querySelectorAll('script[type="application/ld+json"]')) JSON.parse(script.textContent);
      assert.equal(document.querySelector('script[type="module"]'), null);
      assert.ok(sitemap.includes(`<loc>${origin + page.path}</loc>`));
      assert.ok(indexing.resources.some((resource) => resource.url === origin + page.path));
    } finally { dom.window.close(); }
  }
});

test('homepage coverage and contextual resource links stay aligned with the manifest', () => {
  const home = open('/');
  try {
    const text = home.window.document.body.textContent;
    assert.ok(text.includes(`${manifest.summary.verified} source-reviewed profiles`));
    assert.ok(text.includes(`${manifest.summary.limited} website-backed limited listings`));
    assert.equal(home.window.document.querySelectorAll('[data-cta-kind="provider_profile"]').length, 5, 'original focal providers stay unchanged');
  } finally { home.window.close(); }
  for (const route of ['/', '/appraiser/', '/methodology/']) {
    const dom = open(route);
    try {
      for (const page of pages) assert.ok(dom.window.document.querySelector(`main a[href="${page.path}"]`), `${route} links to ${page.path}`);
    } finally { dom.window.close(); }
  }
});

test('worksheet opens native print once and collects no customer information', () => {
  const dom = open('/art-appraisal-inquiry-worksheet/');
  try {
    const document = dom.window.document;
    assert.equal(document.querySelector('form, input, textarea, iframe'), null);
    assert.match(document.body.textContent, /artwork details and completed notes are not collected or submitted by this worksheet/);
    assert.ok(document.querySelectorAll('.writing-line').length >= 5);
    let printCalls = 0;
    dom.window.print = () => { printCalls += 1; };
    const button = document.querySelector('[data-print-worksheet]');
    // Execute the actual small print owner against this document without network or page scripts.
    new Function('document', 'window', read('public_site/assets/directory-worksheet-20261006.js'))(document, dom.window);
    button.click();
    assert.equal(printCalls, 1);
    assert.equal(button.dataset.gtmEvent, 'directory_cta');
    const css = read('public_site/assets/directory-resources-20261006.css');
    assert.match(css, /@media print/);
    assert.match(css, /header, footer, \.skip-link, \.no-print/);
    assert.match(css, /td::before \{ content: attr\(data-label\)/);
  } finally { dom.window.close(); }
});
