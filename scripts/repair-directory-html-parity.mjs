#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';

function parseArgs(argv) {
  const options = {
    publicDir: path.resolve(process.cwd(), 'public_site'),
    write: false,
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
      case '--write':
        options.write = true;
        break;
      case '--dry-run':
        options.write = false;
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

function escapeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function profileSlugFromHref(href = '') {
  const match = String(href).match(/\/appraiser\/([^/?#]+)\/?/);
  return match?.[1] || '';
}

function findCityPage(document) {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || 'null');
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      const cityPage = nodes.find(node => node?.['@type'] === 'CollectionPage');
      if (cityPage) return cityPage;
    } catch {
      // Ignore non-directory JSON-LD blocks.
    }
  }
  return null;
}

function profileSlugFromUrl(value = '') {
  const match = String(value).match(/\/appraiser\/([^/?#]+)\/?/);
  return match?.[1] || '';
}

function hasAppraiserItems(itemList) {
  return (itemList?.itemListElement || []).some(item => profileSlugFromUrl(item?.url || item?.item || ''));
}

function buildItemListElements(entries) {
  return entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.name,
    url: entry.url,
    ...(entry.image ? { image: entry.image } : {}),
    ...(entry.description ? { description: entry.description } : {}),
  }));
}

function repairStructuredNode(node, location) {
  if (!node || typeof node !== 'object') return false;

  const allowed = location.listedAppraisers || [];
  const allowedSlugs = new Set(allowed.map(entry => entry.slug).filter(Boolean));
  let changed = false;

  if (node['@type'] === 'CollectionPage' && node.mainEntity?.['@type'] === 'ItemList') {
    node.mainEntity.numberOfItems = allowed.length;
    node.mainEntity.itemListElement = buildItemListElements(allowed);
    changed = true;
  }

  if (node['@type'] === 'ItemList' && hasAppraiserItems(node)) {
    node.numberOfItems = allowed.length;
    node.itemListElement = buildItemListElements(allowed);
    changed = true;
  }

  if (Array.isArray(node.provider)) {
    const nextProviders = node.provider.filter(provider => {
      const slug = profileSlugFromUrl(provider?.url || '');
      return !slug || allowedSlugs.has(slug);
    });
    if (nextProviders.length !== node.provider.length) {
      node.provider = nextProviders;
      changed = true;
    }
  }

  return changed;
}

function updateJsonLd(document, location) {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];

  for (const script of scripts) {
    let parsed;
    try {
      parsed = JSON.parse(script.textContent || 'null');
    } catch {
      continue;
    }

    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    let changed = false;
    for (const node of nodes) {
      changed = repairStructuredNode(node, location) || changed;
    }

    if (changed) {
      script.textContent = JSON.stringify(Array.isArray(parsed) ? nodes : nodes[0]);
    }
  }
}

function updateVisibleCounts(document, location) {
  const count = location.listedAppraisers?.length || 0;
  const cityPage = findCityPage(document);
  const cityName = cityPage?.name?.replace(/^Art appraisers in\s+/i, '') || location.name?.replace(/^Art appraisers in\s+/i, '') || 'this city';

  for (const node of [...document.querySelectorAll('p')]) {
    if (escapeText(node.textContent) === 'Verified appraisers') {
      const value = node.nextElementSibling;
      if (value) value.textContent = String(count);
    }
  }

  for (const heading of [...document.querySelectorAll('h2')]) {
    const text = escapeText(heading.textContent);
    if (/^Directory profiles \(\d+\)$/.test(text)) {
      heading.textContent = `Directory profiles (${count})`;
    }
  }

  for (const paragraph of [...document.querySelectorAll('p')]) {
    const text = paragraph.textContent || '';
    if (/Appraisily tracks \d+ vetted art valuation professionals/.test(text)) {
      paragraph.textContent = text.replace(
        /Appraisily tracks \d+ vetted art valuation professionals serving [^.]+\./,
        `Appraisily tracks ${count} vetted local art valuation professionals serving ${cityName}.`
      );
    }
  }
}

function updateSummaryList(document, location) {
  const summaryLinks = [...document.querySelectorAll('a[data-gtm-event="appraiser_summary_click"][data-gtm-appraiser]')];
  const firstSummary = summaryLinks[0];
  if (!firstSummary) return;

  const list = firstSummary.closest('ol');
  if (!list) return;

  list.textContent = '';
  const entries = (location.listedAppraisers || []).slice(0, 5);

  for (const entry of entries) {
    const item = document.createElement('li');
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.href = entry.url;
    link.className = 'text-blue-700 hover:text-blue-600';
    link.setAttribute('data-gtm-event', 'appraiser_summary_click');
    link.setAttribute('data-gtm-city', location.slug);
    link.setAttribute('data-gtm-appraiser', entry.slug);
    link.textContent = entry.name;
    strong.appendChild(link);
    item.appendChild(strong);
    item.append(` - ${entry.description || `${entry.name} has a listed profile for this location.`}`);
    list.appendChild(item);
  }
}

function removeStaleProfileContent(document, location) {
  const allowedSlugs = new Set((location.listedAppraisers || []).map(entry => entry.slug).filter(Boolean));
  let removedArticles = 0;
  let removedSummaryItems = 0;

  for (const link of [...document.querySelectorAll('a[data-gtm-event="appraiser_card_click"][data-gtm-appraiser]')]) {
    const slug = link.getAttribute('data-gtm-appraiser') || profileSlugFromHref(link.getAttribute('href'));
    if (allowedSlugs.has(slug)) continue;
    const article = link.closest('article');
    if (article) {
      article.remove();
      removedArticles += 1;
    }
  }

  for (const link of [...document.querySelectorAll('a[data-gtm-event="appraiser_summary_click"][data-gtm-appraiser]')]) {
    const slug = link.getAttribute('data-gtm-appraiser') || profileSlugFromHref(link.getAttribute('href'));
    if (allowedSlugs.has(slug)) continue;
    const item = link.closest('li');
    if (item) {
      item.remove();
      removedSummaryItems += 1;
    }
  }

  return { removedArticles, removedSummaryItems };
}

function ensureEmptyState(document, location) {
  const grid = document.querySelector('#local-appraisers .grid');
  if (!grid) return;

  const articles = grid.querySelectorAll('article');
  const existingEmpty = grid.querySelector('[data-directory-empty-state="true"]');
  if (articles.length > 0) {
    existingEmpty?.remove();
    return;
  }

  if (existingEmpty) return;

  const empty = document.createElement('div');
  empty.className = 'md:col-span-2 rounded-lg border border-gray-200 bg-white p-6 text-gray-700';
  empty.setAttribute('data-directory-empty-state', 'true');
  empty.textContent = `No verified local art appraiser profiles are currently listed for ${location.name.replace(/^Art appraisers in\s+/i, '')}.`;
  grid.appendChild(empty);
}

function repairHtml(html, location) {
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const removalSummary = removeStaleProfileContent(document, location);
  updateSummaryList(document, location);
  updateVisibleCounts(document, location);
  updateJsonLd(document, location);
  ensureEmptyState(document, location);

  return {
    html: dom.serialize(),
    ...removalSummary,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const locationsFeed = await readJson(path.join(options.publicDir, 'locations.json'));
  const summary = [];

  for (const location of locationsFeed.locations || []) {
    const htmlPath = path.join(options.publicDir, 'location', location.slug, 'index.html');
    const html = await fs.readFile(htmlPath, 'utf8');
    const repaired = repairHtml(html, location);

    if (options.write && repaired.html !== html) {
      await fs.writeFile(htmlPath, repaired.html);
    }

    summary.push({
      slug: location.slug,
      listedAppraisers: location.listedAppraisers?.length || 0,
      removedArticles: repaired.removedArticles,
      removedSummaryItems: repaired.removedSummaryItems,
      changed: repaired.html !== html,
    });
  }

  console.log(JSON.stringify({
    action: options.write ? 'repaired-directory-html-parity' : 'dry-run-directory-html-parity-repair',
    publicDir: options.publicDir,
    totals: summary.reduce((acc, item) => {
      acc.removedArticles += item.removedArticles;
      acc.removedSummaryItems += item.removedSummaryItems;
      acc.changedFiles += item.changed ? 1 : 0;
      return acc;
    }, { removedArticles: 0, removedSummaryItems: 0, changedFiles: 0 }),
    sampledCities: summary.filter(item => item.changed || item.listedAppraisers === 0).slice(0, 30),
  }, null, 2));
}

main().catch(error => {
  console.error('[repair-directory-html-parity] Failed:', error?.stack || error?.message || error);
  process.exit(1);
});
