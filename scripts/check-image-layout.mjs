import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { imageLayoutFailures } from './image-layout-contract.mjs';

const root = path.resolve(import.meta.dirname, '../public_site');
const routes = [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)];
const failures = [];
let images = 0;
for (const [, url] of routes) {
  const route = new URL(url).pathname;
  const dom = new JSDOM(fs.readFileSync(path.join(root, route, 'index.html'), 'utf8'));
  try {
    images += dom.window.document.images.length;
    failures.push(...imageLayoutFailures(dom.window.document).map(message => `${route}: ${message}`));
  } finally { dom.window.close(); }
}
assert.equal(failures.length, 0, `${failures.length} image-layout failures; first ten:\n${failures.slice(0, 10).join('\n')}`);
console.log(`[image-layout] PASS sitemap=${routes.length} images=${images}; reserved space, decorative alternatives and native link purposes`);
