#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';

const DEFAULTS = {
  artRoot: '/srv/repos/frontends/art-appraiser-directory-frontend/public_site',
  antiqueRoot: '/srv/repos/frontends/antique-appraiser-directory-frontend/public_site',
  artManifest: '/srv/repos/frontends/art-appraiser-directory-frontend/data/provider-publication-manifest.json',
  antiqueManifest: '/srv/repos/frontends/antique-appraiser-directory-frontend/data/provider-publication-manifest.json',
  propertyConsolidation: '/srv/repos/frontends/art-appraiser-directory-frontend/data/property-consolidation-manifest.json',
};

function parseArgs(argv) {
  const options = { ...DEFAULTS, output: '', markdown: '', failOnConflicts: false };
  const args = [...argv];
  while (args.length) {
    const token = String(args.shift() || '');
    const [flag, inline] = token.split('=');
    const value = () => inline ?? args.shift();
    if (flag === '--art-root') options.artRoot = path.resolve(String(value() || ''));
    else if (flag === '--antique-root') options.antiqueRoot = path.resolve(String(value() || ''));
    else if (flag === '--art-manifest') options.artManifest = path.resolve(String(value() || ''));
    else if (flag === '--antique-manifest') options.antiqueManifest = path.resolve(String(value() || ''));
    else if (flag === '--property-consolidation') options.propertyConsolidation = path.resolve(String(value() || ''));
    else if (flag === '--output') options.output = path.resolve(String(value() || ''));
    else if (flag === '--markdown') options.markdown = path.resolve(String(value() || ''));
    else if (flag === '--fail-on-conflicts') options.failOnConflicts = true;
    else throw new Error(`Unknown flag: ${flag}`);
  }
  return options;
}

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizedText(value) {
  return compact(value)
    .toLowerCase()
    .replace(/&amp;/g, '&')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizedPlace(value) {
  return compact(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizedHost(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isPublished(record) {
  return record?.publicationStatus === 'limited' || record?.publicationStatus === 'verified';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizedUrl(value) {
  try {
    const url = new URL(String(value || ''));
    url.hash = '';
    return url.href;
  } catch {
    return '';
  }
}

function sitemapSlugs(root) {
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  return new Set(
    [...xml.matchAll(/<loc>[^<]*\/appraiser\/([^/]+)\/<\/loc>/g)].map((match) => decodeURIComponent(match[1])),
  );
}

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  const graph = Array.isArray(value['@graph']) ? value['@graph'].flatMap(schemaNodes) : [];
  return [value, ...graph];
}

function profileEvidence(root, record, sitemap) {
  const filePath = path.join(root, 'appraiser', record.slug, 'index.html');
  if (!fs.existsSync(filePath)) {
    return { slug: record.slug, missingHtml: true, inSitemap: sitemap.has(record.slug) };
  }

  const html = fs.readFileSync(filePath, 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const robots = compact(document.querySelector('meta[name="robots"]')?.getAttribute('content'));
  const providerSchema = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((node) => {
      try {
        return schemaNodes(JSON.parse(node.textContent || 'null'));
      } catch {
        return [];
      }
    })
    .find((node) => {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      return types.some((type) => ['ProfessionalService', 'LocalBusiness', 'Organization', 'Person'].includes(type));
    });
  const bodyText = compact(document.body?.textContent);
  const title = compact(document.querySelector('title')?.textContent);
  const h1 = compact(document.querySelector('h1')?.textContent);
  const sourceUrl = compact(document.querySelector('meta[name="appraisily:provider-source"]')?.getAttribute('content')) || record.sourceUrl || '';
  const canonical = compact(document.querySelector('link[rel="canonical"]')?.getAttribute('href'));
  const address = providerSchema?.address && typeof providerSchema.address === 'object' ? providerSchema.address : {};

  return {
    slug: record.slug,
    missingHtml: false,
    inSitemap: sitemap.has(record.slug),
    robots,
    title,
    h1,
    visibleWords: bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0,
    canonical,
    city: compact(address.addressLocality),
    region: compact(address.addressRegion),
    country: compact(address.addressCountry),
    sourceUrl,
    sourceHost: normalizedHost(sourceUrl),
  };
}

function comparePair(artRecord, antiqueRecord, artEvidence, antiqueEvidence) {
  const conflicts = [];
  const add = (code, severity, detail) => conflicts.push({ code, severity, detail });

  if (artEvidence.missingHtml || antiqueEvidence.missingHtml) {
    add('missing-profile-html', 'critical', 'One or both published profile routes have no static HTML.');
  }
  if (!artEvidence.inSitemap || !antiqueEvidence.inSitemap) {
    add('published-profile-missing-from-sitemap', 'high', 'One or both published profiles are absent from their sitemap.');
  }
  if (/noindex/i.test(artEvidence.robots) || /noindex/i.test(antiqueEvidence.robots)) {
    add('published-profile-noindex', 'high', 'One or both manifest-published profiles are marked noindex.');
  }
  if (artRecord.canonicalProviderId !== antiqueRecord.canonicalProviderId) {
    add(
      'canonical-provider-id-mismatch',
      'critical',
      `${artRecord.canonicalProviderId || '(missing)'} != ${antiqueRecord.canonicalProviderId || '(missing)'}`,
    );
  }
  if (normalizedText(artRecord.name) !== normalizedText(antiqueRecord.name)) {
    add('provider-name-mismatch', 'high', `${artRecord.name} != ${antiqueRecord.name}`);
  }

  const artPlace = [artEvidence.city, artEvidence.region].map(normalizedPlace).filter(Boolean).join('|');
  const antiquePlace = [antiqueEvidence.city, antiqueEvidence.region].map(normalizedPlace).filter(Boolean).join('|');
  if (!artPlace || !antiquePlace) {
    add('missing-primary-location', 'critical', `art=${artPlace || '(missing)'} antique=${antiquePlace || '(missing)'}`);
  } else if (artPlace !== antiquePlace) {
    add(
      'primary-location-mismatch',
      'critical',
      `art=${artEvidence.city}, ${artEvidence.region}; antique=${antiqueEvidence.city}, ${antiqueEvidence.region}`,
    );
  }

  if (artEvidence.sourceHost && antiqueEvidence.sourceHost && artEvidence.sourceHost !== antiqueEvidence.sourceHost) {
    add('official-source-host-mismatch', 'high', `${artEvidence.sourceHost} != ${antiqueEvidence.sourceHost}`);
  }
  if (/\bappraisel\b/i.test(`${artEvidence.title} ${artEvidence.h1} ${antiqueEvidence.title} ${antiqueEvidence.h1}`)) {
    add('appraisal-misspelling', 'medium', 'Published title or H1 contains “Appraisel”.');
  }

  return conflicts;
}

function markdownReport(report) {
  const lines = [
    '# Cross-host Provider Truth Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Shared indexable profiles: ${report.summary.sharedIndexableProfiles}`,
    `- Profiles with conflicts: ${report.summary.profilesWithConflicts}`,
    `- Unauthorized self-canonical duplicates: ${report.summary.unauthorizedSelfCanonicalDuplicates}`,
    `- Authorized canonical migrations: ${report.summary.authorizedCanonicalMigrations}`,
    `- Primary-location conflicts: ${report.summary.primaryLocationConflicts}`,
    `- Thin art profiles under 180 visible words: ${report.summary.thinArtProfilesUnder180Words}`,
    '',
    '## Conflict counts',
    '',
    '| Conflict | Count |',
    '| --- | ---: |',
    ...Object.entries(report.summary.conflictsByCode).map(([code, count]) => `| ${code} | ${count} |`),
    '',
    '## Conflicting profiles',
    '',
    '| Slug | Art location | Antique location | Conflicts |',
    '| --- | --- | --- | --- |',
    ...report.pairs
      .filter((pair) => pair.conflicts.length)
      .map((pair) => `| ${pair.slug} | ${pair.art.city || '—'}, ${pair.art.region || '—'} | ${pair.antique.city || '—'}, ${pair.antique.region || '—'} | ${pair.conflicts.map((item) => item.code).join(', ')} |`),
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function writeOutput(filePath, content) {
  if (!filePath) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const artManifest = readJson(options.artManifest);
  const antiqueManifest = readJson(options.antiqueManifest);
  const propertyConsolidation = readJson(options.propertyConsolidation);
  const artPublished = new Map(artManifest.providers.filter(isPublished).map((record) => [record.slug, record]));
  const antiquePublished = new Map(antiqueManifest.providers.filter(isPublished).map((record) => [record.slug, record]));
  const artSitemap = sitemapSlugs(options.artRoot);
  const antiqueSitemap = sitemapSlugs(options.antiqueRoot);
  const sharedSlugs = [...artPublished.keys()].filter((slug) => antiquePublished.has(slug)).sort();
  const artByCanonicalId = new Map(
    [...artPublished.values()]
      .filter((record) => record.canonicalProviderId)
      .map((record) => [record.canonicalProviderId, record]),
  );
  const antiqueByCanonicalId = new Map(
    [...antiquePublished.values()]
      .filter((record) => record.canonicalProviderId)
      .map((record) => [record.canonicalProviderId, record]),
  );
  const migrationsByCanonicalId = new Map(
    propertyConsolidation.providerMigrations.map((record) => [record.canonicalProviderId, record]),
  );
  const duplicateCandidates = [...artByCanonicalId.entries()]
    .filter(([canonicalProviderId]) => antiqueByCanonicalId.has(canonicalProviderId));
  const isAuthorizedMigration = ([canonicalProviderId, artRecord]) => {
    const antiqueRecord = antiqueByCanonicalId.get(canonicalProviderId);
    const migration = migrationsByCanonicalId.get(canonicalProviderId);
    if (!migration || !antiqueRecord) return false;
    const artEvidence = profileEvidence(options.artRoot, artRecord, artSitemap);
    const antiqueEvidence = profileEvidence(options.antiqueRoot, antiqueRecord, antiqueSitemap);
    return normalizedUrl(migration.sourceUrl) === normalizedUrl(artEvidence.canonical)
      && normalizedUrl(migration.destinationUrl) === normalizedUrl(antiqueEvidence.canonical);
  };
  const authorizedCanonicalMigrations = duplicateCandidates
    .filter(isAuthorizedMigration)
    .map(([canonicalProviderId, artRecord]) => ({
      canonicalProviderId,
      artSlug: artRecord.slug,
      antiqueSlug: antiqueByCanonicalId.get(canonicalProviderId).slug,
      canonicalUrl: migrationsByCanonicalId.get(canonicalProviderId).destinationUrl,
    }));
  const unauthorizedCanonicalDuplicates = duplicateCandidates
    .filter((candidate) => !isAuthorizedMigration(candidate))
    .map(([canonicalProviderId, artRecord]) => ({
      canonicalProviderId,
      artSlug: artRecord.slug,
      antiqueSlug: antiqueByCanonicalId.get(canonicalProviderId).slug,
      code: 'unauthorized-self-canonical-duplicate',
      severity: 'critical',
    }));

  const pairs = sharedSlugs.map((slug) => {
    const artRecord = artPublished.get(slug);
    const antiqueRecord = antiquePublished.get(slug);
    const art = profileEvidence(options.artRoot, artRecord, artSitemap);
    const antique = profileEvidence(options.antiqueRoot, antiqueRecord, antiqueSitemap);
    return {
      slug,
      canonicalProviderId: artRecord.canonicalProviderId,
      names: { art: artRecord.name, antique: antiqueRecord.name },
      art,
      antique,
      conflicts: comparePair(artRecord, antiqueRecord, art, antique),
    };
  });

  const conflicts = pairs.flatMap((pair) => pair.conflicts.map((conflict) => ({ slug: pair.slug, ...conflict })));
  const conflictsByCode = Object.fromEntries(
    [...new Set(conflicts.map((item) => item.code))]
      .sort()
      .map((code) => [code, conflicts.filter((item) => item.code === code).length]),
  );
  const report = {
    generatedAt: new Date().toISOString(),
    sources: {
      artRoot: options.artRoot,
      antiqueRoot: options.antiqueRoot,
      artManifest: options.artManifest,
      antiqueManifest: options.antiqueManifest,
      propertyConsolidation: options.propertyConsolidation,
    },
    summary: {
      sharedIndexableProfiles: pairs.length,
      profilesWithConflicts: pairs.filter((pair) => pair.conflicts.length).length,
      primaryLocationConflicts: conflictsByCode['primary-location-mismatch'] || 0,
      thinArtProfilesUnder180Words: pairs.filter((pair) => pair.art.visibleWords < 180).length,
      unauthorizedSelfCanonicalDuplicates: unauthorizedCanonicalDuplicates.length,
      authorizedCanonicalMigrations: authorizedCanonicalMigrations.length,
      conflictsByCode,
    },
    pairs,
    unauthorizedCanonicalDuplicates,
    authorizedCanonicalMigrations,
  };

  const json = `${JSON.stringify(report, null, 2)}\n`;
  writeOutput(options.output, json);
  writeOutput(options.markdown, markdownReport(report));
  if (!options.output && !options.markdown) process.stdout.write(json);
  else process.stdout.write(`${JSON.stringify(report.summary)}\n`);

  if (
    options.failOnConflicts
    && (
      report.summary.profilesWithConflicts > 0
      || report.summary.unauthorizedSelfCanonicalDuplicates > 0
    )
  ) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`[audit-cross-host-provider-truth] ${error.stack || error.message || error}`);
  process.exit(1);
}
