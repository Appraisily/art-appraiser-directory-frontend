#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';

function parseArgs(argv) {
  const options = {
    publicDir: path.resolve(process.cwd(), 'public_site'),
    cities: null,
    requiredNonemptyCities: [],
  };

  const args = [...argv];
  while (args.length) {
    const token = args.shift();
    if (!token) continue;
    const [flag, inlineValue] = token.split('=');
    const readValue = () => (inlineValue !== undefined ? inlineValue : args.shift());

    switch (flag) {
      case '--public-dir':
        options.publicDir = path.resolve(process.cwd(), String(readValue() || ''));
        break;
      case '--cities':
        options.cities = String(readValue() || '')
          .split(',')
          .map(city => city.trim())
          .filter(Boolean);
        break;
      case '--required-nonempty-cities':
        options.requiredNonemptyCities = String(readValue() || '')
          .split(',')
          .map(city => city.trim())
          .filter(Boolean);
        break;
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function unique(values) {
  return [...new Set(values)];
}

function extractAssetPaths(html) {
  const paths = [];
  const assetPattern = /(?:href|src)=["']\/((?:directory\/)?assets\/[^"']+)["']/g;
  for (const match of html.matchAll(assetPattern)) {
    paths.push(match[1]);
  }
  return unique(paths);
}

function assertNoForbiddenAssetReferences({ html, htmlRelativePath, failures }) {
  const forbiddenAssets = [
    'index-DiakBm7O.js',
  ];

  for (const asset of forbiddenAssets) {
    if (html.includes(asset)) {
      failures.push(`${htmlRelativePath} -> references stale asset bundle ${asset}`);
    }
  }
}

function extractRelativeJsChunkPaths(js) {
  const chunks = [];
  const chunkPattern = /["']\.\/([^"'`]+?\.js)["']/g;
  for (const match of js.matchAll(chunkPattern)) {
    if (!match[1].startsWith('data/')) {
      chunks.push(match[1]);
    }
  }
  return unique(chunks);
}

function countProfileLinks(html) {
  const profileLinkPattern = /href=["']https:\/\/art-appraisers-directory\.appraisily\.com\/appraiser\/[^"']+["']/g;
  return [...html.matchAll(profileLinkPattern)].length;
}

function profileSlugFromHref(href = '') {
  const match = String(href).match(/\/appraiser\/([^/?#]+)\/?/);
  return match?.[1] || '';
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function assertActiveAssetsExist(publicDir, htmlRelativePaths) {
  const missing = [];
  const failures = [];
  const checkedJs = new Set();
  const requiredRootAssets = [
    'favicon.svg',
    'favicon.ico',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
  ];

  for (const relativeAssetPath of requiredRootAssets) {
    if (!(await exists(path.join(publicDir, relativeAssetPath)))) {
      missing.push(relativeAssetPath);
    }
  }

  for (const htmlRelativePath of htmlRelativePaths) {
    const html = await fs.readFile(path.join(publicDir, htmlRelativePath), 'utf8');
    assertNoForbiddenAssetReferences({ html, htmlRelativePath, failures });
    if (html.includes('href="/favicon.svg"') || html.includes("href='/favicon.svg'")) {
      missing.push(`${htmlRelativePath} -> references /favicon.svg instead of the deployed PNG icon`);
    }

    for (const assetPath of extractAssetPaths(html)) {
      const absoluteAssetPath = path.join(publicDir, assetPath);
      if (!(await exists(absoluteAssetPath))) {
        missing.push(`${htmlRelativePath} -> ${assetPath}`);
        continue;
      }

      if (!assetPath.endsWith('.js') || checkedJs.has(assetPath)) {
        continue;
      }

      checkedJs.add(assetPath);
      const js = await fs.readFile(absoluteAssetPath, 'utf8');
      const jsDir = path.dirname(absoluteAssetPath);
      for (const chunkPath of extractRelativeJsChunkPaths(js)) {
        const absoluteChunkPath = path.join(jsDir, chunkPath);
        if (!(await exists(absoluteChunkPath))) {
          missing.push(`${assetPath} -> ${chunkPath}`);
        }
      }
    }
  }

  if (missing.length) {
    throw new Error(`Missing active asset references:\n${missing.slice(0, 25).join('\n')}`);
  }

  if (failures.length) {
    throw new Error(`Forbidden active asset references:\n${failures.slice(0, 25).join('\n')}`);
  }
}

function buildProfileMap(appraisersFeed) {
  return new Map((appraisersFeed.appraisers || []).map(profile => [profile.slug, profile]));
}

function assertLocalListedAppraisers({ citySlug, listedAppraisers, profileMap, failures }) {
  for (const entry of listedAppraisers) {
    if (!entry?.slug) {
      failures.push(`${citySlug}: listed appraiser "${entry?.name || 'unknown'}" is missing a profile slug`);
      continue;
    }

    const profile = profileMap.get(entry.slug);
    if (!profile) {
      failures.push(`${citySlug}: listed appraiser "${entry.name || entry.slug}" points to missing profile ${entry.slug}`);
      continue;
    }

    const profileCitySlug = slugify(profile.address?.city);
    if (profileCitySlug !== citySlug) {
      failures.push(`${citySlug}: listed appraiser "${entry.name || entry.slug}" profile city "${profile.address?.city || 'unknown'}" does not match page city`);
    }
  }
}

function assertStaticHtmlMatchesCityFeed({ citySlug, html, routeListed, failures }) {
  const allowedSlugs = new Set(routeListed.map(entry => entry.slug).filter(Boolean));
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const staleLinks = [];
  const cardSlugs = [];
  const staleStructuredDataSlugs = [];

  for (const link of document.querySelectorAll('a[href*="/appraiser/"]')) {
    const slug = profileSlugFromHref(link.getAttribute('href') || '');
    if (!slug) continue;
    if (!allowedSlugs.has(slug)) {
      staleLinks.push(slug);
    } else {
      cardSlugs.push(slug);
    }
  }

  const uniqueStaleLinks = unique(staleLinks);
  if (uniqueStaleLinks.length) {
    failures.push(`${citySlug}: static HTML has stale appraiser links outside route JSON: ${uniqueStaleLinks.slice(0, 10).join(', ')}`);
  }

  const expectedCardSlugs = [...allowedSlugs].sort();
  const actualCardSlugs = unique(cardSlugs).sort();
  if (expectedCardSlugs.join('|') !== actualCardSlugs.join('|')) {
    failures.push(`${citySlug}: static HTML card slugs ${actualCardSlugs.join(', ') || '(none)'} != route JSON slugs ${expectedCardSlugs.join(', ') || '(none)'}`);
  }

  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed;
    try {
      parsed = JSON.parse(script.textContent || 'null');
    } catch {
      continue;
    }

    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    const structuredSlugs = JSON.stringify(nodes).match(/\/appraiser\/[^/?#"]+/g) || [];
    for (const urlPath of structuredSlugs) {
      const slug = profileSlugFromHref(urlPath);
      if (slug && !allowedSlugs.has(slug)) {
        staleStructuredDataSlugs.push(slug);
      }
    }

    for (const node of nodes) {
      if (node?.['@type'] !== 'CollectionPage') continue;
      const itemList = node.mainEntity?.['@type'] === 'ItemList' ? node.mainEntity : null;
      if (!itemList) continue;

      if (itemList.numberOfItems !== routeListed.length) {
        failures.push(`${citySlug}: JSON-LD numberOfItems ${itemList.numberOfItems} != route JSON count ${routeListed.length}`);
      }

      const jsonLdSlugs = (itemList.itemListElement || [])
        .map(item => profileSlugFromHref(item.url || item.item || ''))
        .filter(Boolean)
        .sort();
      if (jsonLdSlugs.join('|') !== expectedCardSlugs.join('|')) {
        failures.push(`${citySlug}: JSON-LD appraiser slugs ${jsonLdSlugs.join(', ') || '(none)'} != route JSON slugs ${expectedCardSlugs.join(', ') || '(none)'}`);
      }
    }
  }

  const uniqueStructuredDataSlugs = unique(staleStructuredDataSlugs);
  if (uniqueStructuredDataSlugs.length) {
    failures.push(`${citySlug}: JSON-LD has stale appraiser slugs outside route JSON: ${uniqueStructuredDataSlugs.slice(0, 10).join(', ')}`);
  }
}

async function assertCityFeeds(publicDir, citySlugs, requiredNonemptyCities) {
  const locationsFeed = await readJson(path.join(publicDir, 'locations.json'));
  const directoryFeed = await readJson(path.join(publicDir, 'directory.json'));
  const appraisersFeed = await readJson(path.join(publicDir, 'appraisers.json'));
  const locations = locationsFeed.locations || [];
  const directoryLocations = directoryFeed.locations || [];
  const profileMap = buildProfileMap(appraisersFeed);
  const requiredNonempty = new Set(requiredNonemptyCities);
  const failures = [];
  const summary = [];

  for (const citySlug of citySlugs) {
    const locationRecord = locations.find(location => location.slug === citySlug);
    const directoryLocation = directoryLocations.find(location => location.slug === citySlug);
    const routeJsonPath = path.join(publicDir, 'location', citySlug, 'index.json');
    const routeHtmlPath = path.join(publicDir, 'location', citySlug, 'index.html');
    const routeJson = await readJson(routeJsonPath);
    const routeLocation = routeJson.location || {};
    const routeListed = routeLocation.listedAppraisers || [];
    const html = await fs.readFile(routeHtmlPath, 'utf8');
    const profileLinkCount = countProfileLinks(html);

    if (!locationRecord) {
      failures.push(`${citySlug}: missing from locations.json`);
      continue;
    }

    if (!directoryLocation) {
      failures.push(`${citySlug}: missing from directory.json locations`);
    }

    if (locationRecord.numberOfListedAppraisers !== locationRecord.listedAppraisers?.length) {
      failures.push(`${citySlug}: locations.json count ${locationRecord.numberOfListedAppraisers} != listedAppraisers length ${locationRecord.listedAppraisers?.length}`);
    }

    if (routeLocation.numberOfListedAppraisers !== routeListed.length) {
      failures.push(`${citySlug}: route index.json count ${routeLocation.numberOfListedAppraisers} != listedAppraisers length ${routeListed.length}`);
    }

    if (locationRecord.numberOfListedAppraisers !== routeLocation.numberOfListedAppraisers) {
      failures.push(`${citySlug}: locations.json count ${locationRecord.numberOfListedAppraisers} != route index.json count ${routeLocation.numberOfListedAppraisers}`);
    }

    if (directoryLocation && directoryLocation.numberOfListedAppraisers !== locationRecord.numberOfListedAppraisers) {
      failures.push(`${citySlug}: directory.json count ${directoryLocation.numberOfListedAppraisers} != locations.json count ${locationRecord.numberOfListedAppraisers}`);
    }

    if (directoryLocation && directoryLocation.listedAppraisers?.length !== locationRecord.listedAppraisers?.length) {
      failures.push(`${citySlug}: directory.json listedAppraisers length ${directoryLocation.listedAppraisers?.length} != locations.json listedAppraisers length ${locationRecord.listedAppraisers?.length}`);
    }

    assertLocalListedAppraisers({
      citySlug,
      listedAppraisers: locationRecord.listedAppraisers || [],
      profileMap,
      failures,
    });

    assertLocalListedAppraisers({
      citySlug,
      listedAppraisers: routeListed,
      profileMap,
      failures,
    });

    assertStaticHtmlMatchesCityFeed({
      citySlug,
      html,
      routeListed,
      failures,
    });

    if (requiredNonempty.has(citySlug) && routeListed.length === 0) {
      failures.push(`${citySlug}: route index.json has zero listed appraisers`);
    }

    if (requiredNonempty.has(citySlug) && profileLinkCount === 0) {
      failures.push(`${citySlug}: route index.html has zero profile links`);
    }

    summary.push({
      citySlug,
      listedAppraisers: routeListed.length,
      profileLinksInHtml: profileLinkCount,
    });
  }

  if (failures.length) {
    throw new Error(`Directory city feed validation failed:\n${failures.join('\n')}`);
  }

  return summary;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const locationsFeed = await readJson(path.join(options.publicDir, 'locations.json'));
  const citySlugs = options.cities || (locationsFeed.locations || []).map(location => location.slug).filter(Boolean);
  const cityHtmlPaths = citySlugs.map(city => path.join('location', city, 'index.html'));

  await assertActiveAssetsExist(options.publicDir, ['index.html', ...cityHtmlPaths]);
  const citySummary = await assertCityFeeds(options.publicDir, citySlugs, options.requiredNonemptyCities);

  console.log(JSON.stringify({
    action: 'validated-directory-consistency',
    publicDir: options.publicDir,
    requiredNonemptyCities: options.requiredNonemptyCities,
    cities: citySummary,
  }, null, 2));
}

main().catch(error => {
  console.error('[check-directory-consistency] Failed:', error?.stack || error?.message || error);
  process.exit(1);
});
