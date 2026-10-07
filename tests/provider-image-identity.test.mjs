import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { imageUrls, isNonProviderIdentityImage, providerIdentityImageFailures } from '../scripts/provider-image-identity-contract.mjs';

const profileUrl = 'https://art-appraisers-directory.appraisily.com/appraiser/fixture/';
const logo = 'https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png';
const artwork = 'https://art-appraisers-directory.appraisily.com/assets/generated-appraiser-profiles/fixture.svg';
const provider = { '@type': 'ProfessionalService', name: 'Fixture provider', url: profileUrl };
function inspect(schema) {
  const dom = new JSDOM(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
  try { return providerIdentityImageFailures(dom.window.document, profileUrl); }
  finally { dom.window.close(); }
}

test('publisher logo is not an image of the provider', () => {
  assert.deepEqual(inspect([{...provider, image: logo}]), [logo]);
  assert.equal(isNonProviderIdentityImage(`${logo}?size=small#preview`), true);
});
test('generated non-likeness artwork is not a provider identity, even when labeled on the page', () => {
  assert.deepEqual(inspect({...provider, image: artwork}), [artwork]);
  assert.equal(isNonProviderIdentityImage('/assets/generated-appraiser-profiles/fixture.svg'), true);
});
test('ImageObject and array representations cannot bypass the identity check', () => {
  const value = [{ '@type': 'ImageObject', contentUrl: artwork }, { url: logo }];
  assert.deepEqual(imageUrls(value), [artwork, logo]);
  assert.deepEqual(inspect({...provider, image: value}), [artwork, logo]);
});
test('graph and array-valued provider types are checked', () => {
  assert.deepEqual(inspect({'@graph': [{...provider, '@type': ['Organization', 'ProfessionalService'], image: logo}]}), [logo]);
});
test('publisher branding remains valid on the actual publisher and site entities', () => {
  assert.deepEqual(inspect([provider,
    {'@type': 'Organization', name: 'Appraisily', url: 'https://appraisily.com/', image: logo, logo},
    {'@type': 'WebSite', url: 'https://art-appraisers-directory.appraisily.com/', image: logo}]), []);
});
test('omitting unknown provider imagery is valid; another domain is not silently authenticated', () => {
  assert.deepEqual(inspect(provider), []);
  assert.equal(isNonProviderIdentityImage('https://provider.example/logo.png'), false);
  assert.equal(isNonProviderIdentityImage('https://provider.example/assets/generated-appraiser-profiles/photo.jpg'), false);
  assert.equal(isNonProviderIdentityImage('https://assets.appraisily.com.provider.example/logo-exploration/appraisily-logo-fake/photo.png'), false);
});
