import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { assertOwnedHandoffArrival, assertProviderHandoff, captureProviderHandoff } from '../scripts/provider-handoff-contract.mjs';

const repo = path.resolve(import.meta.dirname, '..');
const origin = 'https://art-appraisers-directory.appraisily.com';
const provider = {slug: 'fixture', publicationStatus: 'limited', sourceUrl: 'https://provider.example/services'};
const html = `<link rel="stylesheet" href="/assets/directory-provider-handoff-20261007.css">
<div data-directory-provider-layout><div><h1>Fixture provider</h1><p data-provider-publication-status="limited">Limited listing.</p><p>Retained provider facts.</p></div>
<div data-directory-provider-contact><a data-gtm-cta="website" href="https://provider.example/services">Visit official website</a><a href="https://appraisily.com/start?utm_source=partner">Appraisily online appraisal</a></div></div>
<a data-provider-correction-link href="/get-listed/">Correct this listing</a>`;
function inspect(markup) {
  const dom = new JSDOM(markup, {url: origin});
  try { return captureProviderHandoff(dom.window.document, origin); }
  finally { dom.window.close(); }
}

test('all published provider actions identify their destination and keep provider-first limited layouts', () => {
  const providers = JSON.parse(fs.readFileSync(path.join(repo, 'data/provider-publication-manifest.json'), 'utf8')).providers
    .filter((row) => ['verified', 'limited'].includes(row.publicationStatus));
  assert.ok(providers.length > 0);
  for (const row of providers) {
    const markup = fs.readFileSync(path.join(repo, `public_site/appraiser/${row.slug}/index.html`), 'utf8');
    assertProviderHandoff(inspect(markup), row);
  }
});
test('explicit brand action and official provider link pass without changing acquisition parameters', () => {
  const state = inspect(html);
  assertProviderHandoff(state, provider);
  assert.equal(new URL(state.links.find((link) => link.ownedAction).href).searchParams.get('utm_source'), 'partner');
});
test('generic appraisal and screener actions fail, even outside the sidebar', () => {
  for (const label of ['Request an Appraisal', 'Request Appraisal', 'Start appraisal', 'Signed report', 'Free screener']) {
    assert.throws(() => assertProviderHandoff(inspect(html.replace('Appraisily online appraisal', label)), provider), /ambiguous Appraisily action/);
  }
  assert.throws(() => assertProviderHandoff(inspect(`${html}<a href="https://www.appraisily.com/screener">Free screener</a>`), provider), /ambiguous Appraisily action/);
});
test('substituting Appraisily for the provider website fails', () => {
  assert.throws(() => assertProviderHandoff(inspect(html.replace('href="https://provider.example/services"', 'href="https://appraisily.com/start"')), provider), /official native website/);
});
test('contact-first source order, lost desktop stylesheet and changed status fail', () => {
  const state = inspect(html);
  assert.throws(() => assertProviderHandoff({...state, layout: {...state.layout, firstContainsHeading: false}}, provider), /facts must precede/);
  assert.throws(() => assertProviderHandoff({...state, layout: {...state.layout, stylesheet: false}}, provider), /desktop column/);
  assert.throws(() => assertProviderHandoff({...state, status: 'verified'}, provider), /listing status changed/);
});
test('a provider-only reviewed page needs no Appraisily sales action', () => {
  const reviewed = {...provider, publicationStatus: 'verified'};
  assertProviderHandoff(inspect('<h1>Fixture provider</h1><p data-provider-publication-status="verified">Reviewed.</p><a data-gtm-cta="website" href="https://provider.example/services">Visit official website</a>'), reviewed);
});

const target = 'https://appraisily.com/start?utm_source=art_directory&utm_medium=decision_router&seo_site=art_directory&ref_path=%2Fappraiser%2Ffixture%2F&journey_id=11111111-1111-4111-8111-111111111111&appraisily_synthetic=synthetic_browser';
const arrived = {
  url: target.replace('&journey_id=11111111-1111-4111-8111-111111111111', ''),
  anonymousId: '11111111-1111-4111-8111-111111111111',
  qa: 'synthetic_browser', h1: 'Start your appraisal',
};
test('native arrival preserves campaign context and adopted identity after governed URL redaction', () => {
  assertOwnedHandoffArrival(target, arrived, {javascript: true});
  assertOwnedHandoffArrival(target, {...arrived, h1: 'Order your signed appraisal'}, {javascript: true});
  assertOwnedHandoffArrival(target, {...arrived, h1: 'Order an online signed appraisal'}, {javascript: true});
  assertOwnedHandoffArrival('https://appraisily.com/start', {url: 'https://appraisily.com/start'}, {javascript: false});
});
test('native arrival rejects a lost identity, acquisition context, QA marker or wrong destination', () => {
  assert.throws(() => assertOwnedHandoffArrival(target, {...arrived, anonymousId: 'different'}, {javascript: true}), /lost journey/);
  assert.throws(() => assertOwnedHandoffArrival(target, {...arrived, url: arrived.url.replace('utm_medium=decision_router', 'utm_medium=other')}, {javascript: true}), /lost utm_medium/);
  assert.throws(() => assertOwnedHandoffArrival(target, {...arrived, qa: null}, {javascript: true}), /lost synthetic/);
  assert.throws(() => assertOwnedHandoffArrival(target, {...arrived, h1: 'Loading'}, {javascript: true}), /form did not render/);
  assert.throws(() => assertOwnedHandoffArrival(target, {...arrived, url: arrived.url.replace('/start?', '/contact?')}, {javascript: true}), /changed path/);
});
