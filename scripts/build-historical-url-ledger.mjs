#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OUTPUT = path.join(REPO_ROOT, 'data/historical-url-retirement-ledger.json');
const REGISTRY =
  '/srv/repos/tools/directory-site-utils/references/art-route-registry.json';
const ORIGIN = 'https://art-appraisers-directory.appraisily.com';
const HISTORIC_COMMITS = {
  '397_url_sitemap': 'c61e612ea2f40ae1ec5b4949f8a0d7c4d5a18a5f',
  '241_url_sitemap': '8891a7a53d74a2253745c02d9e5adc070bb8917c',
};

function parseArgs(argv) {
  return { check: argv.includes('--check') };
}

function urlsFromXml(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1]);
}

function normalize(value) {
  const url = new URL(value, ORIGIN);
  url.hash = '';
  url.search = '';
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [registry, cityDecisions, aliasDecisions, currentSitemap] = await Promise.all([
    fs.readFile(REGISTRY, 'utf8').then(JSON.parse),
    fs.readFile(path.join(REPO_ROOT, 'data/city-publication-decisions.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(REPO_ROOT, 'data/provider-alias-decisions.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(REPO_ROOT, 'public_site/sitemap.xml'), 'utf8'),
  ]);
  const sources = new Map();
  const add = (url, source) => {
    const normalized = normalize(url);
    const values = sources.get(normalized) || new Set();
    values.add(source);
    sources.set(normalized, values);
  };

  for (const [source, commit] of Object.entries(HISTORIC_COMMITS)) {
    const xml = execFileSync('git', ['-C', REPO_ROOT, 'show', `${commit}:public_site/sitemap.xml`], {
      encoding: 'utf8',
    });
    for (const url of urlsFromXml(xml)) add(url, source);
  }
  for (const url of urlsFromXml(currentSitemap)) add(url, 'current_candidate_sitemap');

  const published = new Set(registry.routes.map((route) => normalize(route.url)));
  const retiredCities = new Map(
    cityDecisions.cities.map((city) => [`${ORIGIN}/location/${city.slug}/`, city.terminalStatus])
  );
  const retiredAliases = new Map(
    aliasDecisions.aliases.map((alias) => [`${ORIGIN}/appraiser/${alias.slug}/`, alias.terminalStatus])
  );

  const urls = [...sources.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([url, provenance]) => {
      let terminalStatus = 404;
      let outcome = 'unknown_or_unmatched';
      if (published.has(url)) {
        terminalStatus = 200;
        outcome = 'retained';
      } else if (retiredCities.has(url)) {
        terminalStatus = retiredCities.get(url);
        outcome = 'known_retired_city';
      } else if (retiredAliases.has(url)) {
        terminalStatus = retiredAliases.get(url);
        outcome = 'known_retired_provider_alias';
      }
      return {
        url,
        provenance: [...provenance].sort(),
        confidence: 'exact_historical_sitemap',
        terminalStatus,
        outcome,
      };
    });

  const ledger = {
    version: 1,
    generatedAt: '2026-07-26',
    completeness: {
      status: 'complete_for_397_241_and_current_sitemaps',
      authoritative397Commit: HISTORIC_COMMITS['397_url_sitemap'],
      authoritative241Commit: HISTORIC_COMMITS['241_url_sitemap'],
      recoveredUniqueUrls: urls.length,
    },
    counts: Object.fromEntries(
      [...new Set(urls.map((entry) => entry.terminalStatus))]
        .sort((left, right) => left - right)
        .map((status) => [status, urls.filter((entry) => entry.terminalStatus === status).length])
    ),
    urls,
  };
  const serialized = `${JSON.stringify(ledger, null, 2)}\n`;
  if (options.check) {
    if ((await fs.readFile(OUTPUT, 'utf8')) !== serialized) {
      throw new Error('Historical URL retirement ledger is stale');
    }
  } else {
    await fs.writeFile(OUTPUT, serialized, 'utf8');
  }
  console.log(JSON.stringify({ action: options.check ? 'checked-ledger' : 'wrote-ledger', output: OUTPUT, ...ledger.completeness, counts: ledger.counts }));
}

main().catch((error) => {
  console.error(`[build-historical-url-ledger] ${error.stack || error.message}`);
  process.exit(1);
});
