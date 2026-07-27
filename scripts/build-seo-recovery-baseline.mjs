#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { hashStaticTree } from '/srv/repos/tools/appraisily-vps-deploy/scripts/static-release.mjs';

const output = path.resolve(
  process.argv[2]
    || '/srv/manager/seo/2026-07-26/art-directory-diagnosis/implementation-baseline.json',
);
const surfaces = {
  art: '/mnt/srv-storage/art-appraisers-directory/releases/current',
  antique: '/mnt/srv-storage/antique-appraiser-directory/releases/current',
  articles: '/mnt/srv-storage/appraisily-articles/releases/current',
};
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

async function walkHtml(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

async function linkInventory(root) {
  const records = [];
  for (const filename of await walkHtml(root)) {
    const html = await fs.readFile(filename, 'utf8');
    for (const match of html.matchAll(/href=["'](https:\/\/art-appraisers-directory\.appraisily\.com\/[^"']*)["']/g)) {
      const rawTarget = match[1].replaceAll('&amp;', '&');
      const target = new URL(rawTarget);
      records.push({
        source: path.relative(root, filename),
        rawTarget,
        cleanTarget: `${target.origin}${target.pathname}`,
      });
    }
  }
  return records;
}

const resolved = Object.fromEntries(
  await Promise.all(Object.entries(surfaces).map(async ([name, symlink]) => [
    name,
    await fs.realpath(symlink),
  ])),
);
const inventories = {
  art: await linkInventory(resolved.art),
  antique: await linkInventory(resolved.antique),
  articles: await linkInventory(resolved.articles),
};
const uniqueTargets = [...new Set(
  Object.values(inventories).flat().map((record) => record.cleanTarget),
)].sort();
const liveOutcomes = [];
for (const target of uniqueTargets) {
  const response = await fetch(target, { redirect: 'manual' });
  liveOutcomes.push({
    target,
    status: response.status,
    location: response.headers.get('location'),
  });
}
const outcomeByTarget = new Map(liveOutcomes.map((record) => [record.target, record]));
const enriched = Object.fromEntries(
  Object.entries(inventories).map(([surface, records]) => [
    surface,
    records.map((record) => ({ ...record, live: outcomeByTarget.get(record.cleanTarget) })),
  ]),
);
const evidenceRoot = '/srv/manager/seo/2026-07-26/art-directory-diagnosis';
const evidence = [];
for (const entry of await fs.readdir(evidenceRoot, { withFileTypes: true })) {
  if (!entry.isFile() || entry.name === path.basename(output)) continue;
  const filename = path.join(evidenceRoot, entry.name);
  evidence.push({
    file: filename,
    sha256: sha256(await fs.readFile(filename)),
  });
}

const report = {
  version: 1,
  collectedAt: new Date().toISOString(),
  mutation: 'none',
  activeReleases: Object.fromEntries(
    Object.entries(resolved).map(([surface, root]) => [
      surface,
      {
        path: root,
        releaseId: path.basename(root),
        artifactSha256: hashStaticTree(root),
      },
    ]),
  ),
  evidence,
  artLinkInventory: {
    bySurface: Object.fromEntries(
      Object.entries(enriched).map(([surface, records]) => [
        surface,
        {
          documents: new Set(records.map((record) => record.source)).size,
          links: records.length,
          non200Links: records.filter((record) => record.live.status !== 200).length,
          non200Documents: new Set(
            records.filter((record) => record.live.status !== 200).map((record) => record.source),
          ).size,
          records,
        },
      ]),
    ),
    uniqueTargets: liveOutcomes,
  },
  contentFingerprints: {
    reviewedCities: Object.fromEntries(
      await Promise.all(
        ['boston', 'houston', 'los-angeles', 'new-york', 'philadelphia'].map(async (slug) => {
          const html = await fs.readFile(path.join(resolved.art, 'location', slug, 'index.html'), 'utf8');
          const visible = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          return [slug, { sha256: sha256(html), visibleWords: visible.split(/\s+/).filter(Boolean).length }];
        }),
      ),
    ),
  },
  caveats: [
    'Link counts are occurrence volumes, not unique sessions or users.',
    'Live statuses are point-in-time HTTP outcomes collected at collectedAt.',
    'The evidence file list is hash-bound; GSC UI-only reports remain external receipts.',
  ],
};
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  collectedAt: report.collectedAt,
  activeReleases: Object.fromEntries(
    Object.entries(report.activeReleases).map(([surface, value]) => [surface, value.releaseId]),
  ),
  linkCounts: Object.fromEntries(
    Object.entries(report.artLinkInventory.bySurface).map(([surface, value]) => [
      surface,
      { documents: value.documents, links: value.links, non200Links: value.non200Links },
    ]),
  ),
  uniqueTargets: liveOutcomes.length,
}));
