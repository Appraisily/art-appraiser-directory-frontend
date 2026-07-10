#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SITE_ORIGIN = 'https://art-appraisers-directory.appraisily.com';
const POLICY = Object.freeze({
  version: 1,
  city: {
    minimumLocalListings: 1,
    minimumRenderedWords: 700,
    requireCanonical: true,
    requireDescription: true,
    requireFaqSchema: true,
    requireH1: true,
  },
  profile: {
    policy: 'preserve-reviewed-state',
  },
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

function hasMetaDescription(html) {
  return /<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']{40,}["']/i.test(html)
    || /<meta\s+[^>]*content=["'][^"']{40,}["'][^>]*name=["']description["']/i.test(html);
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

function cityLabel(city) {
  return String(city.name || city.slug)
    .replace(/^art appraisers in\s+/i, '')
    .trim();
}

function renderLocationHub(cities) {
  const primary = cities.filter((city) => city.indexable);
  const additional = cities.filter((city) => !city.indexable);
  const renderLinks = (records) => records
    .map((city) => `          <li><a href="/location/${escapeXml(city.slug)}/">${escapeXml(cityLabel(city))}</a></li>`)
    .join('\n');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Art Appraiser Locations | Appraisily Directory',
    description: 'Browse city directories with verified local art appraiser profiles and additional art appraisal coverage areas.',
    url: `${SITE_ORIGIN}/location/`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: primary.length,
      itemListElement: primary.map((city, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: cityLabel(city),
        url: city.url,
      })),
    },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Art Appraiser Locations | Appraisily Directory</title>
    <meta name="description" content="Browse city directories with verified local art appraiser profiles and additional art appraisal coverage areas.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${SITE_ORIGIN}/location/">
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
    <style>
      body { margin: 0; color: #111827; background: #fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      header, main { width: min(1040px, calc(100% - 32px)); margin: 0 auto; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
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
      <h1>Browse art appraisers by city</h1>
      <p>Start with cities that have verified exact-city profiles and substantial local appraisal guidance. Each page covers common appraisal purposes, provider details, and online alternatives.</p>
      <section aria-labelledby="verified-cities">
        <h2 id="verified-cities">Cities with verified local profiles</h2>
        <p class="meta">${primary.length} city directories currently meet the publication standard.</p>
        <ul>
${renderLinks(primary)}
        </ul>
      </section>
      <section class="secondary" aria-labelledby="additional-areas">
        <h2 id="additional-areas">Additional coverage areas</h2>
        <p>These pages remain available while local profile coverage and supporting guidance are expanded.</p>
        <ul>
${renderLinks(additional)}
        </ul>
      </section>
    </main>
  </body>
</html>
`;
}

async function listProfileRecords(publicDir) {
  const profilesDir = path.join(publicDir, 'appraiser');
  const entries = await fs.readdir(profilesDir, { withFileTypes: true });
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
    records.push({
      slug: entry.name,
      indexable: !hasNoIndex(html),
      url: `${SITE_ORIGIN}/appraiser/${entry.name}/`,
    });
  }

  return records.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function buildCityRecords(publicDir, locations, write) {
  const records = [];

  for (const location of locations) {
    const slug = String(location.slug || '').trim();
    if (!slug) continue;
    const htmlPath = path.join(publicDir, 'location', slug, 'index.html');
    let html;
    try {
      html = await fs.readFile(htmlPath, 'utf8');
    } catch {
      records.push({ slug, indexable: false, reasons: ['missing-html'] });
      continue;
    }

    const localListings = Number(location.numberOfListedAppraisers ?? location.listedAppraisers?.length ?? 0);
    const words = renderedWordCount(html);
    const canonical = canonicalFromHtml(html);
    const expectedCanonical = `${SITE_ORIGIN}/location/${slug}/`;
    const checks = {
      localListings: localListings >= POLICY.city.minimumLocalListings,
      renderedWords: words >= POLICY.city.minimumRenderedWords,
      canonical: canonical === expectedCanonical,
      description: hasMetaDescription(html),
      faqSchema: html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"'),
      h1: /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html),
    };
    const reasons = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
    const indexable = reasons.length === 0;

    if (write && hasNoIndex(html) === indexable) {
      await fs.writeFile(htmlPath, setRobotsState(html, indexable), 'utf8');
    }

    records.push({
      slug,
      name: location.name || slug,
      url: expectedCanonical,
      indexable,
      localListings,
      renderedWords: words,
      checks,
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
    cities,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const locationsFeed = JSON.parse(await fs.readFile(path.join(options.publicDir, 'locations.json'), 'utf8'));
  const locations = Array.isArray(locationsFeed.locations) ? locationsFeed.locations : [];
  const profiles = await listProfileRecords(options.publicDir);
  const cities = await buildCityRecords(options.publicDir, locations, options.write);
  const manifest = buildManifest({ profiles, cities });
  const sitemapUrls = [
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}/appraiser/`,
    ...profiles.filter((record) => record.indexable).map((record) => record.url),
    `${SITE_ORIGIN}/location/`,
    ...cities.filter((record) => record.indexable).map((record) => record.url),
  ];
  const expectedSitemap = renderSitemap(sitemapUrls);
  const expectedLocationHub = renderLocationHub(cities);
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
    const actualLocationHub = await fs.readFile(locationHubPath, 'utf8');
    if (actualLocationHub !== expectedLocationHub) failures.push('location/index.html does not match the generated city eligibility set');

    for (const city of cities) {
      const html = await fs.readFile(path.join(options.publicDir, 'location', city.slug, 'index.html'), 'utf8');
      if (hasNoIndex(html) === city.indexable) {
        failures.push(`${city.slug}: robots state does not match eligibility (${city.reasons.join(', ') || 'eligible'})`);
      }
    }

    const homepage = await fs.readFile(path.join(options.publicDir, 'index.html'), 'utf8');
    if (!homepage.includes('data-directory-static-intro="1"') || !/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(homepage)) {
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
