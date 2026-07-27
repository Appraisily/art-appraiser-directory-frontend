import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

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
const cityDecisions = readJson('data/city-publication-decisions.json');
const aliasDecisions = readJson('data/provider-alias-decisions.json');

const verifiedProviders = manifest.providers.filter(
  (provider) => provider.publicationStatus === 'verified'
);
const verifiedSlugs = new Set(verifiedProviders.map((provider) => provider.slug));
const feedSlugs = new Set(appraisersFeed.map((provider) => provider.slug));
const appraiserFeedBySlug = new Map(
  appraisersFeed.map((provider) => [provider.slug, provider])
);
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
    const canonicalProvider = appraiserFeedBySlug.get(provider.slug);
    if (provider.image !== canonicalProvider?.image) {
      fail(
        `location ${location.slug} image for ${provider.slug} does not match the canonical appraiser feed`
      );
    }
    if (provider.description !== canonicalProvider?.description) {
      fail(
        `location ${location.slug} description for ${provider.slug} does not match the canonical appraiser feed`
      );
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

const appSource = fs.readFileSync(path.join(repoRoot, 'src/App.tsx'), 'utf8');
for (const marker of [
  'href="/appraiser/"',
  'Browse reviewed appraisers',
  'href="/location/"',
  'Compare verified locations',
]) {
  if (!appSource.includes(marker)) {
    fail(`homepage recovery path is missing ${marker}`);
  }
}
for (const retiredSearchMarker of [
  "from './components/CitySearch'",
  '<CitySearch',
  'Search locations',
  'search_no_results',
]) {
  if (appSource.includes(retiredSearchMarker)) {
    fail(`homepage reintroduces the retired no-result search path: ${retiredSearchMarker}`);
  }
}

const homepageArtifactSource = fs.readFileSync(
  path.join(publicDir, 'index.html'),
  'utf8'
);
for (const marker of [
  '<a href="/appraiser/">Appraisers</a>',
  '<a href="/location/">Locations</a>',
  'Source-reviewed appraisers',
]) {
  if (!homepageArtifactSource.includes(marker)) {
    fail(`static homepage recovery path is missing ${marker}`);
  }
}
for (const retiredHomepageArtifactMarker of [
  'Search locations',
  'Enter city or state',
  'type="module"',
  'as="script"',
]) {
  if (homepageArtifactSource.includes(retiredHomepageArtifactMarker)) {
    fail(
      `static homepage can reintroduce the retired hydrated search path: ${retiredHomepageArtifactMarker}`
    );
  }
}

const locationPageSource = fs.readFileSync(
  path.join(repoRoot, 'src/pages/StandardizedLocationPage.tsx'),
  'utf8'
);
for (const marker of [
  'data-clarity-action="location_unavailable_browse"',
  'data-clarity-action="location_unavailable_appraisily"',
  'Get an online appraisal from Appraisily',
]) {
  if (!locationPageSource.includes(marker)) {
    fail(`location unavailable hydration path is missing ${marker}`);
  }
}

const notFoundPageSource = fs.readFileSync(
  path.join(repoRoot, 'src/pages/NotFoundPage.tsx'),
  'utf8'
);
const notFoundArtifactSource = fs.readFileSync(
  path.join(publicDir, '404.html'),
  'utf8'
);
for (const [surface, source] of [
  ['hydrated not-found page', notFoundPageSource],
  ['static 404 artifact', notFoundArtifactSource],
]) {
  for (const marker of [
    'data-clarity-action="not_found_browse"',
    'data-clarity-action="not_found_appraisily"',
    'Get an online appraisal from Appraisily',
  ]) {
    if (!source.includes(marker)) {
      fail(`${surface} is missing ${marker}`);
    }
  }
}

const clientBundleFiles = walk(path.join(publicDir, 'assets')).filter(
  (filename) => /^index-.*\.js$/.test(path.basename(filename))
);
const clientBundleSource = clientBundleFiles
  .map((filename) => fs.readFileSync(filename, 'utf8'))
  .join('\n');
for (const provider of manifest.providers.filter(
  (entry) => entry.publicationStatus !== 'verified'
)) {
  if (provider.slug && clientBundleSource.includes(provider.slug)) {
    fail(`client bundle embeds suppressed provider slug: ${provider.slug}`);
  }
}

const activePublicDocuments = [
  path.join(publicDir, 'index.html'),
  path.join(publicDir, '404.html'),
  path.join(publicDir, 'appraiser', 'index.html'),
  path.join(publicDir, 'appraiser-unavailable.html'),
  path.join(publicDir, 'location', 'index.html'),
  path.join(publicDir, 'methodology', 'index.html'),
  path.join(publicDir, 'get-listed', 'index.html'),
  ...appraisersFeed.map((provider) =>
    path.join(publicDir, 'appraiser', provider.slug, 'index.html')
  ),
  ...locationsFeed.map((location) =>
    path.join(publicDir, 'location', location.slug, 'index.html')
  ),
];
const unsupportedTrustClaimPattern =
  /\bcertified art appraisers?\b|\bverified reviews\b/i;
for (const filename of activePublicDocuments) {
  const contents = fs.readFileSync(filename, 'utf8');
  if (unsupportedTrustClaimPattern.test(contents)) {
    fail(`unsupported trust claim found in ${path.relative(repoRoot, filename)}`);
  }
  const document = new JSDOM(contents).window.document;
  const relativePath = path.relative(publicDir, filename);
  const requiredSelectors = [
    'title',
    'meta[name="description"]',
    'meta[name="theme-color"][content="#5b1f2a"]',
    'link[rel~="icon"]',
    'meta[property="og:title"]',
    'meta[property="og:description"]',
    'meta[property="og:type"]',
    'meta[property="og:image"]',
  ];
  for (const selector of requiredSelectors) {
    if (!document.querySelector(selector)) {
      fail(`active page ${relativePath} is missing metadata selector ${selector}`);
    }
  }
  if (
    !['404.html', 'appraiser-unavailable.html'].includes(relativePath) &&
    (!document.querySelector('link[rel="canonical"]') ||
      !document.querySelector('meta[property="og:url"]'))
  ) {
    fail(`active page ${relativePath} is missing canonical or Open Graph URL metadata`);
  }
}
if (unsupportedTrustClaimPattern.test(clientBundleSource)) {
  fail('client bundle embeds an unsupported certified-appraiser or verified-reviews claim');
}

const nginxSource = fs.readFileSync(path.join(repoRoot, 'nginx.conf'), 'utf8');
const routeEnforcementMarker = path.join(
  repoRoot,
  'public_site',
  '.reviewed-route-enforcement-v2'
);
if (!fs.existsSync(routeEnforcementMarker)) {
  fail('reviewed-route enforcement marker is missing from the public artifact');
}
for (const city of cityDecisions.cities) {
  if (city.status === 'collapsed' && !nginxSource.includes(city.slug)) {
    fail(`nginx retired-city outcome is missing ${city.slug}`);
  }
}
if (!nginxSource.includes('location ~ ^/location/[^/]+/?$')) {
  fail('nginx does not fail closed for non-published city routes');
}
if (
  !nginxSource.includes(
    'if (-f $document_root/.reviewed-route-enforcement-v2) { return 404; }'
  )
) {
  fail('nginx route enforcement is not gated by the reviewed artifact marker');
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
if (
  !nginxSource.includes(
    'if (-f $document_root/.reviewed-route-enforcement-v2) { return 404; }'
  ) ||
  nginxSource.includes('return 418') ||
  !nginxSource.includes('error_page 418 =200 /appraiser-unavailable.html;')
) {
  fail('nginx provider suppression is not safely gated for v1/v2 artifacts');
}
for (const alias of aliasDecisions.aliases) {
  if (!nginxSource.includes(alias.slug) || alias.terminalStatus !== 410) {
    fail(`nginx alias decision is missing or unsupported: ${alias.slug}`);
  }
}
const unavailableHtml = fs.readFileSync(path.join(publicDir, 'appraiser-unavailable.html'), 'utf8');
if (/rel=["']canonical["']/i.test(unavailableHtml)) {
  fail('provider unavailable response must not carry a cross-page canonical');
}
const runtimeNginxPath =
  '/srv/infrastructure/vps-infra/compose/appraisily/runtime/docker-compose/art-appraisers-directory/nginx.conf';
if (!fs.existsSync(runtimeNginxPath)) {
  fail('runtime nginx configuration is missing');
}
if (fs.readFileSync(runtimeNginxPath, 'utf8') !== nginxSource) {
  fail('repo and runtime nginx configurations are not byte-identical');
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
