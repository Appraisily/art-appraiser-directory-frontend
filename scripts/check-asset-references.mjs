#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index === -1 ? fallback : args[index + 1];
};
const publicDir = path.resolve(repoRoot, valueAfter('--public-dir', 'public_site'));
const outputPath = valueAfter('--output', '');
const assetUrlPattern = /\/(?:directory\/)?assets\/[A-Za-z0-9._/-]+/g;
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml']);

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(publicDir, relativePath), 'utf8'));
}

function assetUrlToPath(url) {
  if (url.startsWith('/directory/assets/')) {
    return path.join(publicDir, 'directory', url.slice('/directory/'.length));
  }
  return path.join(publicDir, url.slice(1));
}

function assetPathToUrl(filename) {
  const relativePath = path.relative(publicDir, filename).split(path.sep).join('/');
  return `/${relativePath}`;
}

function collectAssetUrls(filename) {
  if (!textExtensions.has(path.extname(filename))) return [];
  const contents = fs.readFileSync(filename, 'utf8');
  return [...contents.matchAll(assetUrlPattern)].map((match) => match[0]);
}

const appraisers = readJson('appraisers.json').appraisers || [];
const locations = readJson('locations.json').locations || [];
const activeRouteFiles = [
  ...appraisers.map((provider) =>
    path.join(publicDir, 'appraiser', provider.slug, 'index.html')
  ),
  ...locations.map((location) =>
    path.join(publicDir, 'location', location.slug, 'index.html')
  ),
];

const generalEntryFiles = walk(publicDir).filter((filename) => {
  const relativePath = path.relative(publicDir, filename);
  return (
    !relativePath.startsWith(`assets${path.sep}`) &&
    !relativePath.startsWith(`directory${path.sep}assets${path.sep}`) &&
    !relativePath.startsWith(`appraiser${path.sep}`) &&
    !relativePath.startsWith(`location${path.sep}`)
  );
});

const entryFiles = [...new Set([...generalEntryFiles, ...activeRouteFiles])];
const referencedUrls = new Set();
const pendingUrls = [];

for (const filename of entryFiles) {
  if (!fs.existsSync(filename)) {
    throw new Error(
      `[asset-references] active route file is missing: ${path.relative(repoRoot, filename)}`
    );
  }
  for (const url of collectAssetUrls(filename)) pendingUrls.push(url);
}

while (pendingUrls.length) {
  const url = pendingUrls.pop();
  if (referencedUrls.has(url)) continue;
  referencedUrls.add(url);
  const filename = assetUrlToPath(url);
  if (!fs.existsSync(filename)) continue;
  for (const nestedUrl of collectAssetUrls(filename)) pendingUrls.push(nestedUrl);
}

const assetFiles = [
  ...walk(path.join(publicDir, 'assets')),
  ...walk(path.join(publicDir, 'directory', 'assets')),
];
const assetUrls = new Set(assetFiles.map(assetPathToUrl));
const missing = [...referencedUrls].filter((url) => !assetUrls.has(url)).sort();
const orphans = [...assetUrls].filter((url) => !referencedUrls.has(url)).sort();
const prefixCounts = {
  assets: [...assetUrls].filter((url) => url.startsWith('/assets/')).length,
  directoryAssets: [...assetUrls].filter((url) =>
    url.startsWith('/directory/assets/')
  ).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  publicDir: path.relative(repoRoot, publicDir),
  activeProviders: appraisers.length,
  activeLocations: locations.length,
  entryFiles: entryFiles.length,
  referencedAssets: referencedUrls.size,
  retainedAssets: assetUrls.size,
  prefixCounts,
  missing,
  orphans,
};

if (outputPath) {
  const absoluteOutput = path.resolve(repoRoot, outputPath);
  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  fs.writeFileSync(absoluteOutput, `${JSON.stringify(report, null, 2)}\n`);
}

if (missing.length || orphans.length) {
  console.error(
    `[asset-references] FAIL referenced=${referencedUrls.size} retained=${assetUrls.size} missing=${missing.length} orphans=${orphans.length}`
  );
  if (missing.length) console.error(`Missing:\n${missing.join('\n')}`);
  if (orphans.length) console.error(`Orphans:\n${orphans.join('\n')}`);
  process.exit(1);
}

console.log(
  `[asset-references] PASS referenced=${referencedUrls.size} retained=${assetUrls.size} /assets=${prefixCounts.assets} /directory/assets=${prefixCounts.directoryAssets}`
);
