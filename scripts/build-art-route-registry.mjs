#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public_site');
const DEFAULT_OUTPUT =
  '/srv/repos/tools/directory-site-utils/references/art-route-registry.json';
const ORIGIN = 'https://art-appraisers-directory.appraisily.com';

function parseArgs(argv) {
  const options = { output: DEFAULT_OUTPUT, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--check') options.check = true;
    else if (token === '--output') options.output = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${token}`);
  }
  return options;
}

async function walkFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

async function hashTree(directory) {
  const hash = crypto.createHash('sha256');
  for (const filename of await walkFiles(directory)) {
    const relative = path.relative(directory, filename).replaceAll(path.sep, '/');
    hash.update(relative);
    hash.update('\0');
    hash.update(await fs.readFile(filename));
    hash.update('\0');
  }
  return hash.digest('hex');
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1]);
}

function routeKind(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return 'home';
  if (pathname === '/appraiser/') return 'appraiser_hub';
  if (pathname === '/location/') return 'location_hub';
  if (/^\/appraiser\/[^/]+\/$/.test(pathname)) return 'provider';
  if (/^\/location\/[^/]+\/$/.test(pathname)) return 'city';
  throw new Error(`Unsupported sitemap route: ${url}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sitemap = await fs.readFile(path.join(PUBLIC_DIR, 'sitemap.xml'), 'utf8');
  const urls = sitemapUrls(sitemap);
  if (urls.length !== new Set(urls).size) throw new Error('Sitemap contains duplicate URLs');
  for (const value of urls) {
    const url = new URL(value);
    if (url.origin !== ORIGIN || url.search || url.hash) {
      throw new Error(`Noncanonical registry URL: ${value}`);
    }
  }

  const registry = {
    version: 1,
    generatedFrom: {
      sitemap: `${ORIGIN}/sitemap.xml`,
      sitemapSha256: crypto.createHash('sha256').update(sitemap).digest('hex'),
      artifactSha256: await hashTree(PUBLIC_DIR),
    },
    policy: {
      crawlableUrlsMustBeClean: true,
      unknownRoutes: 404,
      historicalOutcomesSource: 'data/historical-url-retirement-ledger.json',
    },
    routes: urls.map((url) => ({
      url,
      canonicalUrl: url,
      kind: routeKind(url),
      publicationStatus: 'published',
    })),
  };
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;

  if (options.check) {
    const actual = await fs.readFile(options.output, 'utf8');
    if (actual !== serialized) throw new Error(`Art route registry is stale: ${options.output}`);
  } else {
    await fs.mkdir(path.dirname(options.output), { recursive: true });
    await fs.writeFile(options.output, serialized, 'utf8');
  }

  console.log(
    JSON.stringify({
      action: options.check ? 'checked-art-route-registry' : 'wrote-art-route-registry',
      output: options.output,
      routes: registry.routes.length,
      ...registry.generatedFrom,
    })
  );
}

main().catch((error) => {
  console.error(`[build-art-route-registry] ${error.stack || error.message}`);
  process.exit(1);
});
