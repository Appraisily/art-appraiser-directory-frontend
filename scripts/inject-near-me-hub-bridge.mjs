#!/usr/bin/env node
/**
 * Inject crawlable near-me hub links into art-directory city pages.
 *
 * Antique city pages already vote for the appraisily.com hubs. Art city pages
 * did not. This is inbound link equity for /art-appraiser-near-me and
 * /antique-appraiser-near-me, not a new site.
 *
 *   node scripts/inject-near-me-hub-bridge.mjs --check
 *   node scripts/inject-near-me-hub-bridge.mjs --write
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const MARKER = 'data-appraisily-near-me-hub-bridge="1"';
const BLOCK_RE = /<section\s+data-appraisily-near-me-hub-bridge=["']1["'][\s\S]*?<\/section>\s*/i;
const FAQ_ANCHOR_RE = /<section[^>]*>\s*<h2[^>]*>\s*Frequently asked questions/i;

const HUBS = [
  {
    key: 'art',
    href: 'https://appraisily.com/art-appraiser-near-me',
    label: 'Art appraiser near me',
  },
  {
    key: 'antique',
    href: 'https://appraisily.com/antique-appraiser-near-me',
    label: 'Antique appraiser near me',
  },
  {
    key: 'online',
    href: 'https://appraisily.com/online-appraiser-near-me',
    label: 'Online appraiser near me',
  },
];

export function hubHref(hub, citySlug) {
  return (
    `${hub.href}?utm_source=art_directory&amp;utm_medium=near_me_bridge` +
    `&amp;utm_campaign=${encodeURIComponent(citySlug)}&amp;utm_content=hub`
  );
}

export function buildNearMeHubBridge(citySlug) {
  const links = HUBS.map((hub) => (
    `<a href="${hubHref(hub, citySlug)}" data-analytics-event="directory_near_me_bridge_click" data-analytics-destination="${hub.key}" data-analytics-location="near-me-hub-bridge">${hub.label}</a>`
  )).join(' · ');
  return (
    `<section ${MARKER} aria-labelledby="near-me-hub-bridge-heading">\n` +
    '        <h2 id="near-me-hub-bridge-heading">Antique or art appraiser near me?</h2>\n' +
    '        <p>These short Appraisily guides explain when a local visit is needed and when a photo-based signed report is enough.</p>\n' +
    `        <p>${links}</p>\n` +
    '      </section>\n\n      '
  );
}

export function injectNearMeHubBridge(html, citySlug) {
  const stripped = html.replace(BLOCK_RE, '');
  const match = stripped.match(FAQ_ANCHOR_RE);
  if (!match) return { html, missingAnchor: true };
  return {
    html: stripped.replace(FAQ_ANCHOR_RE, `${buildNearMeHubBridge(citySlug)}${match[0]}`),
    missingAnchor: false,
  };
}

function parseArgs(argv) {
  const options = { publicDir: path.resolve(process.cwd(), 'public_site'), write: false, check: false };
  const args = [...argv];
  while (args.length) {
    const [flag, inline] = String(args.shift() || '').split('=');
    const value = () => inline ?? args.shift();
    if (flag === '--public-dir') options.publicDir = path.resolve(process.cwd(), String(value() || ''));
    else if (flag === '--write') options.write = true;
    else if (flag === '--dry-run') options.write = false;
    else if (flag === '--check') options.check = true;
    else throw new Error(`Unknown flag ${flag}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const locationRoot = path.join(options.publicDir, 'location');
  const entries = await fs.readdir(locationRoot, { withFileTypes: true });

  let changed = 0;
  let total = 0;
  const missing = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(locationRoot, entry.name, 'index.html');
    let html;
    try {
      html = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }
    total += 1;
    const { html: rewritten, missingAnchor } = injectNearMeHubBridge(html, entry.name);
    if (missingAnchor) {
      missing.push(entry.name);
      continue;
    }
    if (rewritten === html) continue;
    changed += 1;
    if (options.write) await fs.writeFile(filePath, rewritten);
  }

  const result = {
    action: options.write ? 'near-me-hub-bridge-applied' : 'near-me-hub-bridge-planned',
    publicDir: options.publicDir,
    pagesScanned: total,
    changedFiles: changed,
    skippedNoAnchor: missing.length,
    ...(missing.length ? { pagesWithoutAnchor: missing } : {}),
  };
  console.log(JSON.stringify(result, null, 2));
  if (options.check && changed > 0) {
    console.error(`[near-me-hub-bridge] ${changed} page(s) are missing the near-me hub bridge; run --write.`);
    process.exit(1);
  }
  if (options.check && missing.length) {
    console.error(`[near-me-hub-bridge] ${missing.length} page(s) lack the FAQ anchor.`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
