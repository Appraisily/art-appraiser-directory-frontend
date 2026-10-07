import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { imageUrls, isNonProviderIdentityImage, providerIdentityImageFailures } from './provider-image-identity-contract.mjs';

const repo = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(repo, 'public_site');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const manifest = read(path.join(repo, 'data/provider-publication-manifest.json'));
const providers = manifest.providers.filter(row => ['verified', 'limited'].includes(row.publicationStatus));
const failures = [];
for (const provider of providers) {
  const file = path.join(publicDir, 'appraiser', provider.slug, 'index.html');
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  try {
    const url = dom.window.document.querySelector('link[rel="canonical"]').href;
    for (const image of providerIdentityImageFailures(dom.window.document, url)) failures.push(`${provider.slug}: provider schema uses nonprovider image ${image}`);
  } finally { dom.window.close(); }
}
function checkFeed(rows, file) {
  assert.ok(Array.isArray(rows), `${file}: provider rows missing`);
  for (const provider of rows) {
    for (const image of imageUrls(provider.image)) {
      if (isNonProviderIdentityImage(image)) failures.push(`${file}: ${provider.slug} uses nonprovider image ${image}`);
    }
  }
}
checkFeed(read(path.join(publicDir, 'appraisers.json')).appraisers, 'appraisers.json');
const locations = read(path.join(publicDir, 'locations.json')).locations;
for (const location of locations) {
  checkFeed(location.listedAppraisers, `locations.json:${location.slug}`);
  const file = `location/${location.slug}/index.json`;
  checkFeed(read(path.join(publicDir, file)).location.listedAppraisers, file);
}
const directory = read(path.join(publicDir, 'directory.json'));
checkFeed(directory.appraisers, 'directory.json');
for (const location of directory.locations) checkFeed(location.listedAppraisers, `directory.json:${location.slug}`);
assert.equal(failures.length, 0, `${failures.length} nonprovider image references; first ten:\n${failures.slice(0, 10).join('\n')}`);
console.log(`[provider-image-identity] PASS providers=${providers.length} locations=${locations.length}; known publisher/non-likeness images are not provider identities`);
