import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { imageLayoutFailures } from '../scripts/image-layout-contract.mjs';

const artwork = 'https://art-appraisers-directory.appraisily.com/assets/generated-appraiser-profiles/fixture.svg';
const logo = 'https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png';
const fixture = `<h1>Fixture provider</h1><div class="rounded-lg"><a href="https://provider.example/" aria-label="Visit Fixture provider's official website"><img src="${artwork}" class="w-full h-auto object-cover" width="1200" height="900" alt=""></a><p data-directory-illustration-label>Directory illustration for Fixture provider; not a provider likeness.</p></div>`;
function inspect(html) {
  const dom = new JSDOM(html);
  try { return imageLayoutFailures(dom.window.document); }
  finally { dom.window.close(); }
}
test('reserved decorative SVG retains a purpose-named native link and visible caption', () => {
  assert.deepEqual(inspect(fixture), []);
});
test('original SVG dimensions, provider alt and unnamed link fail', () => {
  const old = fixture.replace(' width="1200" height="900"', '').replace('alt=""', 'alt="Fixture provider - Art Appraiser in Boston"').replace(' aria-label="Visit Fixture provider\'s official website"', '');
  const failures = inspect(old);
  assert.ok(failures.some(row => row.includes('not reserved')));
  assert.ok(failures.some(row => row.includes('must be decorative')));
  assert.ok(failures.some(row => row.includes('accurate purpose')));
});
test('publisher card remains invalid even with dimensions and corrected alt', () => {
  assert.ok(inspect(fixture.replace(artwork, logo)).some(row => row.includes('oversized publisher')));
});
test('actual publisher header branding is allowed with reserved dimensions', () => {
  assert.deepEqual(inspect(`<img src="${logo}" width="48" height="48" alt="Appraisily Logo">`), []);
});
test('CSS-sized decorative below-fold cards retain native lazy loading', () => {
  const card = '<img src="/directory/assets/decision-router-report.png" alt="" loading="lazy" style="width:3.5rem;height:3.5rem;">';
  assert.deepEqual(inspect(card), []);
  assert.ok(inspect(card.replace(' loading="lazy"', '')).some(row => row.includes('not lazy-loaded')));
  assert.ok(inspect(card.replace('alt=""', 'alt="Get a report"')).some(row => row.includes('repeats offer text')));
});
test('above-fold SVG, mismatched dimensions and missing caption fail', () => {
  assert.ok(inspect(fixture.replace('width="1200"', 'loading="lazy" width="600"')).some(row => row.includes('lazy-loaded')));
  assert.ok(inspect(fixture.replace('width="1200"', 'width="600"')).some(row => row.includes('dimensions differ')));
  assert.ok(inspect(fixture.replace('not a provider likeness', 'portrait')).some(row => row.includes('caption')));
});
