import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const read = (route) => new JSDOM(fs.readFileSync(new URL(`../public_site/${route}index.html`, import.meta.url), 'utf8')).window.document;
const home = read('');
assert.equal(home.querySelectorAll('.city-shortcuts a[data-gtm-event="directory_cta"]').length, 5);
assert.equal(home.querySelectorAll('[data-cta-kind="provider_profile"]').length, 5);
for (const city of ['boston', 'houston', 'los-angeles', 'new-york', 'philadelphia']) {
  const document = read(`location/${city}/`);
  const profile = document.querySelector('[data-cta-kind="provider_profile"]');
  const contact = document.querySelector('[data-cta-kind="provider_contact"]');
  const online = document.querySelector('[data-cta-kind="signed_report"]');
  assert.ok(profile && contact && online, city);
  for (const link of [profile, contact, online, document.querySelector('[data-cta-kind="sample_report"]')]) {
    assert.equal(link?.getAttribute('data-gtm-event'), 'directory_cta', city);
  }
  assert.ok(profile.compareDocumentPosition(online) & 4, `${city}: provider must precede general online guidance`);
  assert.match(document.body.textContent, /September 28, 2026/);
  assert.equal(new URL(online.href).searchParams.get('utm_source'), 'art_directory');
  assert.equal(new URL(online.href).searchParams.get('utm_campaign'), city);
  assert.equal(document.querySelector('script[type="module"]'), null, city);
}
console.log('Directory recovery cohort: five cities, early provider results, source dates, and existing click ownership passed.');
