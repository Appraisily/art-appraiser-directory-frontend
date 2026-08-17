#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_ORIGIN = 'https://art-appraisers-directory.appraisily.com';
const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const PROVIDER_MANIFEST_PATH = path.join(REPO_ROOT, 'data/provider-publication-manifest.json');
const CITY_DECISIONS_PATH = path.join(REPO_ROOT, 'data/city-publication-decisions.json');
const CANONICAL_HOME_DECISIONS_PATH = path.join(REPO_ROOT, 'data/canonical-home-decisions.json');
const REVIEWED_PROVIDER_PATH = path.join(REPO_ROOT, 'data/recovery-reviewed-provider-cohort.json');
const POLICY = Object.freeze({
  version: 3,
  city: {
    policy: 'reviewed-decision-manifest-only',
  },
  profile: {
    policy: 'verified-provider-manifest-only',
  },
  lastmod: 'omit-without-reviewed-change-ledger',
});

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
      case '--check':
        options.write = false;
        break;
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }

  return options;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function renderedWordCount(html) {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:[a-z]+|#\d+);/gi, ' ');
  const normalized = normalizeWhitespace(text);
  return normalized ? normalized.split(' ').length : 0;
}

function hasNoIndex(html) {
  return /<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)
    || /<meta\s+[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i.test(html);
}

function canonicalFromHtml(html) {
  return html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]
    || '';
}

function setRobotsState(html, indexable) {
  const content = indexable ? 'index, follow' : 'noindex, follow';
  const robotsPattern = /<meta\s+[^>]*name=["']robots["'][^>]*>/i;
  if (robotsPattern.test(html)) {
    return html.replace(robotsPattern, `<meta name="robots" content="${content}">`);
  }
  return html.replace(/<\/head>/i, `    <meta name="robots" content="${content}">\n  </head>`);
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderSitemap(urls) {
  const entries = urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function renderLocationHub(profiles, cities = []) {
  const publishedCities = cities.filter((city) => city.indexable);
  const renderLinks = (records) => records
    .map((profile) => `          <li><a href="/appraiser/${escapeXml(profile.slug)}/">${escapeXml(profile.name)} — ${escapeXml(profile.city)}, ${escapeXml(profile.region)}</a></li>`)
    .join('\n');
  const renderCityLinks = (records) => records
    .map((city) => `          <li><a href="/location/${escapeXml(city.slug)}/">${escapeXml(city.slug.replace(/-/g, ' '))} art appraisers</a></li>`)
    .join('\n');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Art Appraiser Locations | Appraisily Directory',
    description: 'Browse reviewed art-only city pages and the source-reviewed art appraiser profiles.',
    url: `${SITE_ORIGIN}/location/`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: profiles.length,
      itemListElement: profiles.map((profile, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${profile.name} — ${profile.city}, ${profile.region}`,
        url: profile.url,
      })),
    },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Art Appraiser Locations | Appraisily Directory</title>
    <meta name="description" content="Browse reviewed art-only city pages and the source-reviewed art appraiser profiles.">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#5b1f2a">
    <link rel="canonical" href="${SITE_ORIGIN}/location/">
    <link rel="icon" type="image/png" href="https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png">
    <meta property="og:type" content="website">
    <meta property="og:title" content="Art Appraiser Locations | Appraisily Directory">
    <meta property="og:description" content="Browse reviewed art-only city pages and the source-reviewed art appraiser profiles.">
    <meta property="og:url" content="${SITE_ORIGIN}/location/">
    <meta property="og:image" content="https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png">
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <style>
      body { margin: 0; color: #111827; background: #fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      header, main { width: min(1040px, calc(100% - 32px)); margin: 0 auto; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 64px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
      nav a { display: inline-flex; align-items: center; min-height: 44px; }
      main { padding: 48px 0 64px; }
      h1 { max-width: 720px; margin: 0 0 12px; font-size: 36px; line-height: 1.15; }
      h2 { margin: 36px 0 8px; font-size: 22px; }
      p { max-width: 760px; color: #4b5563; line-height: 1.65; }
      ul { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 24px; margin: 20px 0 0; padding: 0; list-style: none; }
      a { color: #0f766e; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .secondary { margin-top: 44px; padding-top: 8px; border-top: 1px solid #e5e7eb; }
      .secondary a { color: #475569; }
      .meta { color: #64748b; font-size: 14px; }
      @media (max-width: 760px) { ul { grid-template-columns: 1fr; } h1 { font-size: 30px; } main { padding-top: 32px; } }
    </style>
  </head>
  <body>
    <header>
      <a href="/">Appraisily Art Appraiser Directory</a>
      <nav class="meta"><a href="/appraiser/">Appraisers</a> · <a href="/sitemap.xml">Sitemap</a></nav>
    </header>
    <main>
      <h1>Browse reviewed art appraisers by location</h1>
      <p>This directory publishes provider profiles only after an official source confirms identity, primary location, and fine-art appraisal relevance. City pages are art-only. Antique, furniture, and estate contents stay on the antique directory.</p>
      <section aria-labelledby="verified-cities">
        <h2 id="verified-cities">Art-only city pages</h2>
        <p class="meta">Each city page explains when a local fine-art inspection is useful. A reviewed specialist is listed only after official-source review.</p>
        <ul>
${renderCityLinks(publishedCities)}
        </ul>
        <h2>Five source-reviewed profiles</h2>
        <p class="meta">Use the provider profile to review specialties, appraisal purposes, qualifications, source links, and correction information.</p>
        <ul>
${renderLinks(profiles)}
        </ul>
      </section>
      <section class="secondary" aria-labelledby="additional-areas">
        <h2 id="additional-areas">Local versus online appraisal</h2>
        <p>A nearby provider may be useful when an in-person inspection is required. Appraisily's online service is an alternative when photographs and documentation are sufficient for the appraisal purpose. Confirm format, scope, timing, and credentials directly with the provider before engaging them.</p>
        <p><a href="https://appraisily.com/start?utm_source=art_directory&amp;utm_medium=location_hub&amp;utm_campaign=online_appraisal">Start an online appraisal with Appraisily</a></p>
      </section>
    </main>
  </body>
</html>
`;
}

async function listProfileRecords(publicDir, providerManifest, reviewedProviders, canonicalDecisions, write) {
  const profilesDir = path.join(publicDir, 'appraiser');
  const entries = await fs.readdir(profilesDir, { withFileTypes: true });
  const approved = new Map(
    providerManifest.providers
      .filter((provider) => provider.publicationStatus === 'verified')
      .map((provider) => [provider.slug, provider])
  );
  const canonicalById = new Map(
    canonicalDecisions.providers.map((provider) => [provider.canonicalProviderId, provider.canonicalUrl])
  );
  const records = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const htmlPath = path.join(profilesDir, entry.name, 'index.html');
    let html;
    try {
      html = await fs.readFile(htmlPath, 'utf8');
    } catch {
      continue;
    }
    const provider = approved.get(entry.name);
    const indexable = Boolean(provider);
    if (write && hasNoIndex(html) === indexable) {
      await fs.writeFile(htmlPath, setRobotsState(html, indexable), 'utf8');
      html = setRobotsState(html, indexable);
    }
    if (!provider) continue;
    const expectedUrl = `${SITE_ORIGIN}/appraiser/${entry.name}/`;
    const reviewed = reviewedProviders.providers?.[entry.name] || {};
    records.push({
      slug: entry.name,
      name: provider.name,
      canonicalProviderId: provider.canonicalProviderId,
      canonicalHome: canonicalById.get(provider.canonicalProviderId) || '',
      publicationStatus: provider.publicationStatus,
      verifiedAt: provider.verifiedAt,
      sourceUrl: provider.sourceUrl,
      city: reviewed.city || '',
      region: reviewed.region || '',
      country: reviewed.country || '',
      indexable,
      robotsIndexable: !hasNoIndex(html),
      canonical: canonicalFromHtml(html),
      url: expectedUrl,
    });
  }

  return records.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function buildCityRecords(publicDir, cityDecisions, write) {
  const decisions = new Map(cityDecisions.cities.map((city) => [city.slug, city]));
  const records = [];

  for (const decisionRecord of cityDecisions.cities) {
    const slug = String(decisionRecord.slug || '').trim();
    if (!slug) continue;
    const htmlPath = path.join(publicDir, 'location', slug, 'index.html');
    let html;
    try {
      html = await fs.readFile(htmlPath, 'utf8');
    } catch {
      records.push({ slug, indexable: false, reasons: ['missing-html'] });
      continue;
    }

    const decision = decisions.get(slug);
    if (!decision) throw new Error(`City decision manifest is missing ${slug}`);
    const words = renderedWordCount(html);
    const canonical = canonicalFromHtml(html);
    const expectedCanonical = `${SITE_ORIGIN}/location/${slug}/`;
    const indexable = decision.status === 'retained';
    const reasons = indexable ? [] : [decision.reason];

    if (write && hasNoIndex(html) === indexable) {
      await fs.writeFile(htmlPath, setRobotsState(html, indexable), 'utf8');
    }

    records.push({
      slug,
      name: slug,
      url: expectedCanonical,
      indexable,
      renderedWords: words,
      decisionStatus: decision.status,
      terminalStatus: decision.terminalStatus,
      providerSlug: decision.providerSlug,
      canonical,
      reasons,
    });
  }

  return records.sort((a, b) => a.slug.localeCompare(b.slug));
}

function buildManifest({ profiles, cities }) {
  const indexableProfiles = profiles.filter((record) => record.indexable);
  const indexableCities = cities.filter((record) => record.indexable);
  return {
    policy: POLICY,
    counts: {
      profiles: profiles.length,
      indexableProfiles: indexableProfiles.length,
      cities: cities.length,
      indexableCities: indexableCities.length,
    },
    profiles,
    cities,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const [providerManifest, cityDecisions, canonicalDecisions, reviewedProviders] = await Promise.all([
    fs.readFile(PROVIDER_MANIFEST_PATH, 'utf8').then(JSON.parse),
    fs.readFile(CITY_DECISIONS_PATH, 'utf8').then(JSON.parse),
    fs.readFile(CANONICAL_HOME_DECISIONS_PATH, 'utf8').then(JSON.parse),
    fs.readFile(REVIEWED_PROVIDER_PATH, 'utf8').then(JSON.parse),
  ]);
  const profiles = await listProfileRecords(
    options.publicDir,
    providerManifest,
    reviewedProviders,
    canonicalDecisions,
    options.write
  );
  const cities = await buildCityRecords(options.publicDir, cityDecisions, options.write);
  const manifest = buildManifest({ profiles, cities });
  const sitemapUrls = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/appraiser/`,
    ...profiles.filter((record) => record.indexable).map((record) => record.url),
    `${SITE_ORIGIN}/location/`,
    ...cities.filter((record) => record.indexable).map((record) => record.url),
  ];
  const expectedSitemap = renderSitemap(sitemapUrls);
    const expectedLocationHub = renderLocationHub(profiles, cities);
  const sitemapPath = path.join(options.publicDir, 'sitemap.xml');
  const manifestPath = path.join(options.publicDir, 'indexing-manifest.json');
  const locationHubPath = path.join(options.publicDir, 'location', 'index.html');

  if (options.write) {
    await fs.writeFile(sitemapPath, expectedSitemap, 'utf8');
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await fs.writeFile(locationHubPath, expectedLocationHub, 'utf8');
  } else {
    const failures = [];
    const actualSitemap = await fs.readFile(sitemapPath, 'utf8');
    if (actualSitemap !== expectedSitemap) failures.push('sitemap.xml does not match the generated indexable URL set');
    if (/<lastmod>/i.test(actualSitemap)) failures.push('sitemap.xml contains lastmod without a reviewed change ledger');
    const actualManifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (JSON.stringify(actualManifest) !== JSON.stringify(manifest)) {
      failures.push('indexing-manifest.json does not match the reviewed provider/city decision manifests');
    }
    const actualLocationHub = await fs.readFile(locationHubPath, 'utf8');
    const hubProfileSlugs = new Set(
      [...actualLocationHub.matchAll(/href=["']\/appraiser\/([a-z0-9-]+)\/?["']/g)]
        .map((match) => match[1])
    );
    const expectedHubProfileSlugs = new Set(profiles.map((profile) => profile.slug));
    if (
      hubProfileSlugs.size !== expectedHubProfileSlugs.size
      || [...expectedHubProfileSlugs].some((slug) => !hubProfileSlugs.has(slug))
    ) {
      failures.push('location/index.html does not match the verified provider manifest');
    }

    for (const profile of profiles) {
      if (!profile.robotsIndexable) failures.push(`${profile.slug}: verified provider is noindex`);
      if (profile.canonical !== profile.url) failures.push(`${profile.slug}: verified provider is not self-canonical`);
      if (profile.canonicalHome !== profile.url) failures.push(`${profile.slug}: canonical-home decision disagrees with Art publication`);
    }
    for (const city of cities) {
      const html = await fs.readFile(path.join(options.publicDir, 'location', city.slug, 'index.html'), 'utf8');
      if (hasNoIndex(html) === city.indexable) {
        failures.push(`${city.slug}: robots state does not match eligibility (${city.reasons.join(', ') || 'eligible'})`);
      }
    }

    const homepage = await fs.readFile(path.join(options.publicDir, 'index.html'), 'utf8');
    if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(homepage)) {
      failures.push('homepage is missing the first-response directory intro and H1');
    }
    const crawlLinks = homepage.match(/<section[^>]*data-appraisily-crawl-links[\s\S]*?<\/section>/i)?.[0] || '';
    const indexableCitySlugs = new Set(cities.filter((city) => city.indexable).map((city) => city.slug));
    for (const match of crawlLinks.matchAll(/href=["']\/location\/([a-z0-9-]+)\//g)) {
      if (!indexableCitySlugs.has(match[1])) failures.push(`homepage priority link targets ineligible city: ${match[1]}`);
    }

    if (failures.length) {
      throw new Error(`Indexing contract failed:\n${failures.slice(0, 30).join('\n')}`);
    }
  }

  console.log(JSON.stringify({
    action: options.write ? 'wrote-indexing-manifest' : 'validated-indexing-manifest',
    publicDir: options.publicDir,
    sitemapUrls: sitemapUrls.length,
    ...manifest.counts,
  }, null, 2));
}

main().catch((error) => {
  console.error('[build-indexing-manifest] Failed:', error?.stack || error?.message || error);
  process.exit(1);
});
