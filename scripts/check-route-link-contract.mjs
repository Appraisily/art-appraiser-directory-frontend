#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(repoRoot, 'public_site');
const origin = 'https://art-appraisers-directory.appraisily.com';
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(publicDir, relativePath), 'utf8'));
const appraisers = readJson('appraisers.json').appraisers || [];
const locations = readJson('locations.json').locations || [];

const activeHtmlFiles = [
  'index.html',
  '404.html',
  'appraiser/index.html',
  'appraiser-unavailable.html',
  'location/index.html',
  'methodology/index.html',
  'get-listed/index.html',
  ...appraisers.map((appraiser) => `appraiser/${appraiser.slug}/index.html`),
  ...locations.map((location) => `location/${location.slug}/index.html`),
];

const allowedAppraiserSlugs = new Set(appraisers.map((appraiser) => appraiser.slug));
const allowedLocationSlugs = new Set(locations.map((location) => location.slug));
const failures = [];
let internalLinks = 0;

function routeExists(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/') return true;
  const relative = decoded.replace(/^\/+|\/+$/g, '');
  if (!relative) return true;
  return (
    fs.existsSync(path.join(publicDir, relative)) ||
    fs.existsSync(path.join(publicDir, `${relative}.html`)) ||
    fs.existsSync(path.join(publicDir, relative, 'index.html'))
  );
}

function checkUrl(rawUrl, context) {
  if (!rawUrl || /^(?:mailto:|tel:|javascript:|#)/i.test(rawUrl)) return;
  let url;
  try {
    url = new URL(rawUrl, origin);
  } catch {
    failures.push(`${context}: invalid URL ${rawUrl}`);
    return;
  }
  if (url.origin !== origin) return;

  internalLinks += 1;
  const locationMatch = url.pathname.match(/^\/location\/([^/]+)\/?$/);
  if (locationMatch && !allowedLocationSlugs.has(locationMatch[1])) {
    failures.push(`${context}: link targets unpublished location ${url.pathname}`);
    return;
  }
  const appraiserMatch = url.pathname.match(/^\/appraiser\/([^/]+)\/?$/);
  if (appraiserMatch && !allowedAppraiserSlugs.has(appraiserMatch[1])) {
    failures.push(`${context}: link targets unpublished appraiser ${url.pathname}`);
    return;
  }
  if (!routeExists(url.pathname)) {
    failures.push(`${context}: missing internal target ${url.pathname}`);
  }
}

for (const relativePath of activeHtmlFiles) {
  const absolutePath = path.join(publicDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath}: active HTML file is missing`);
    continue;
  }
  const document = new JSDOM(fs.readFileSync(absolutePath, 'utf8')).window.document;
  const currentLocationMatch = relativePath.match(/^location\/([^/]+)\/index\.html$/);
  for (const anchor of document.querySelectorAll('a[href]')) {
    if (currentLocationMatch) {
      const url = new URL(anchor.getAttribute('href'), origin);
      const normalizedPath = url.pathname.replace(/\/+$/, '');
      if (
        url.origin === origin &&
        normalizedPath === `/location/${currentLocationMatch[1]}` &&
        !url.hash
      ) {
        failures.push(
          `${relativePath}: current-page location must be static, not a self-link (${anchor.textContent.trim()})`
        );
      }
    }
    checkUrl(anchor.getAttribute('href'), relativePath);
  }
}

const sitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  checkUrl(match[1], 'sitemap.xml');
}

for (const appraiser of appraisers) {
  checkUrl(appraiser.url, `appraisers.json:${appraiser.slug}`);
}
for (const location of locations) {
  checkUrl(location.url, `locations.json:${location.slug}`);
  for (const appraiser of location.listedAppraisers || []) {
    checkUrl(appraiser.url, `locations.json:${location.slug}:${appraiser.slug}`);
  }
}

if (failures.length) {
  throw new Error(
    `[route-link-contract] ${failures.length} failure(s)\n${failures.join('\n')}`
  );
}

console.log(
  `[route-link-contract] PASS documents=${activeHtmlFiles.length} internalLinks=${internalLinks} providers=${appraisers.length} locations=${locations.length}`
);
