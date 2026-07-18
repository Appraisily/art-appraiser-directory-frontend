import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(repoRoot, 'public_site');
const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
const fail = (message) => {
  throw new Error(`[remediation-contract] ${message}`);
};

const manifest = readJson('data/provider-publication-manifest.json');
const locationsFeed = readJson('public_site/locations.json').locations || [];
const appraisersFeed = readJson('public_site/appraisers.json').appraisers || [];
const cities = readJson('src/data/cities.json').cities || [];

const verifiedProviders = manifest.providers.filter(
  (provider) => provider.publicationStatus === 'verified'
);
const verifiedSlugs = new Set(verifiedProviders.map((provider) => provider.slug));
const feedSlugs = new Set(appraisersFeed.map((provider) => provider.slug));
const locationSlugs = new Set(locationsFeed.map((location) => location.slug));
const locationSlugFromHref = (href) =>
  String(href || '').match(/\/location\/([^/?#"' ]+)/)?.[1] || '';

if (verifiedSlugs.size !== manifest.summary.verified) {
  fail('manifest summary.verified does not match verified provider rows');
}
if (feedSlugs.size !== verifiedSlugs.size) {
  fail(`appraisers feed has ${feedSlugs.size} providers; manifest has ${verifiedSlugs.size}`);
}
for (const slug of verifiedSlugs) {
  if (!feedSlugs.has(slug)) fail(`verified provider missing from appraisers feed: ${slug}`);
  if (!fs.existsSync(path.join(publicDir, 'appraiser', slug, 'index.html'))) {
    fail(`verified provider route is missing: ${slug}`);
  }
}
for (const slug of feedSlugs) {
  if (!verifiedSlugs.has(slug)) fail(`unverified provider appears in appraisers feed: ${slug}`);
}

for (const provider of verifiedProviders) {
  const profilePath = path.join(publicDir, 'appraiser', provider.slug, 'index.html');
  const profileHtml = fs.readFileSync(profilePath, 'utf8');
  const suppressedLocationLinks = new Set();
  const anchorHrefPattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi;
  for (const match of profileHtml.matchAll(anchorHrefPattern)) {
    const locationSlug = locationSlugFromHref(match[2]);
    if (locationSlug && !locationSlugs.has(locationSlug)) {
      suppressedLocationLinks.add(locationSlug);
    }
  }
  if (suppressedLocationLinks.size) {
    fail(
      `published profile ${provider.slug} links to non-published locations: ` +
        [...suppressedLocationLinks].sort().join(', ')
    );
  }
}

if (locationSlugs.size !== manifest.summary.indexableLocations) {
  fail(
    `locations feed has ${locationSlugs.size} cities; manifest expects ${manifest.summary.indexableLocations}`
  );
}
for (const location of locationsFeed) {
  if (!cities.some((city) => city.slug === location.slug)) {
    fail(`published location missing from canonical city registry: ${location.slug}`);
  }
  if (!fs.existsSync(path.join(publicDir, 'location', location.slug, 'index.html'))) {
    fail(`published location route is missing: ${location.slug}`);
  }
  for (const provider of location.listedAppraisers || []) {
    if (!feedSlugs.has(provider.slug)) {
      fail(`location ${location.slug} lists provider outside appraisers feed: ${provider.slug}`);
    }
  }
}

const duplicateCitySlugs = cities
  .map((city) => city.slug)
  .filter((slug, index, values) => values.indexOf(slug) !== index);
if (duplicateCitySlugs.length) {
  fail(`duplicate city slugs: ${[...new Set(duplicateCitySlugs)].join(', ')}`);
}

const trackedExtensions = new Set(['.html', '.json', '.js']);
const trackingPattern = /(?:[?&](?:y_source|gclid|gbraid|wbraid|fbclid|msclkid|dclid)=)/i;
const placeholderPattern = /(?:placeholder(?:[._/-]|$)|default-favicon|logo-default)/i;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolutePath) : [absolutePath];
  });
}

for (const filename of walk(publicDir)) {
  if (!trackedExtensions.has(path.extname(filename))) continue;
  const contents = fs.readFileSync(filename, 'utf8');
  if (trackingPattern.test(contents)) {
    fail(`internal tracking parameter found in ${path.relative(repoRoot, filename)}`);
  }
}

for (const provider of appraisersFeed) {
  if (provider.image && placeholderPattern.test(provider.image)) {
    fail(`published provider uses a placeholder image: ${provider.slug}`);
  }
  if ('aggregateRating' in provider || 'rating' in provider || 'reviewCount' in provider) {
    fail(`published provider feed exposes unsupported rating data: ${provider.slug}`);
  }
}

const suppressedFixture = fs.readFileSync(
  path.join(publicDir, 'location', 'atlanta', 'index.html'),
  'utf8'
);
for (const provider of manifest.providers.filter(
  (entry) => entry.publicationStatus !== 'verified'
)) {
  if (suppressedFixture.includes(`/appraiser/${provider.slug}`)) {
    fail(`Atlanta fixture exposes suppressed provider: ${provider.slug}`);
  }
}

const standardizedDataSource = fs.readFileSync(
  path.join(repoRoot, 'src/utils/standardizedData.ts'),
  'utf8'
);
if (/src\/data\/standardized|appraiser-index/.test(standardizedDataSource)) {
  fail('client data boundary imports the suppressed provider corpus');
}

const nginxSource = fs.readFileSync(path.join(repoRoot, 'nginx.conf'), 'utf8');
for (const slug of locationSlugs) {
  if (
    !nginxSource.includes(`location = /location/${slug} { return 301 /location/${slug}/; }`) ||
    !nginxSource.includes(
      `location = /location/${slug}/ { try_files $uri/index.html =404; }`
    )
  ) {
    fail(`nginx reviewed-location allowlist is missing ${slug}`);
  }
}
if (!nginxSource.includes('location ~ ^/location/[^/]+/?$')) {
  fail('nginx does not fail closed for non-published city routes');
}
if (!nginxSource.includes('location ~ ^/location/[^/]+/index\\.html$')) {
  fail('nginx allows direct index.html access to non-published city files');
}
if (!nginxSource.includes('location ~ ^/appraiser/[^/]+/index\\.html$')) {
  fail('nginx allows direct index.html access to non-published provider files');
}
if (
  !nginxSource.includes('location ^~ /directory/assets/') ||
  !nginxSource.includes('try_files $uri =404;')
) {
  fail('nginx does not serve canonical /directory/assets files directly');
}
if (nginxSource.includes('rewrite ^/directory/assets/')) {
  fail('nginx rewrites canonical /directory/assets files to a different prefix');
}

const slugSource = fs.readFileSync(path.join(repoRoot, 'src/utils/slugs.ts'), 'utf8');
if (
  !slugSource.includes("replace(/[^a-z0-9]+/g, '-')") ||
  'St. Louis'
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') !== 'st-louis'
) {
  fail('canonical slug regression: St. Louis');
}

console.log(
  `[remediation-contract] PASS providers=${feedSlugs.size} locations=${locationSlugs.size} suppressed=${manifest.summary.suppressed}`
);
