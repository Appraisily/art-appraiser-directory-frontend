#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const DEFAULTS = {
  art: {
    baseUrl: 'https://art-appraisers-directory.appraisily.com',
    title: 'Art Appraisers Directory',
    description: 'Public directory of art appraiser profile and location pages.',
  },
  antique: {
    baseUrl: 'https://antique-appraiser-directory.appraisily.com',
    title: 'Antique Appraiser Directory',
    description: 'Public directory of antique, art, estate, and personal-property appraiser profile and location pages.',
  },
};

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    publicDir: path.join(REPO_ROOT, 'public_site'),
    kind: 'art',
    baseUrl: null,
  };

  while (args.length) {
    const token = args.shift();
    if (!token) continue;
    const [flag, inlineValue] = token.split('=');
    const readValue = () => (inlineValue !== undefined ? inlineValue : args.shift());

    switch (flag) {
      case '--public-dir':
        options.publicDir = path.resolve(process.cwd(), readValue());
        break;
      case '--kind':
        options.kind = String(readValue() || '').trim();
        break;
      case '--base-url':
        options.baseUrl = String(readValue() || '').trim().replace(/\/+$/, '');
        break;
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }

  if (!DEFAULTS[options.kind]) {
    throw new Error(`Unsupported --kind value: ${options.kind}`);
  }
  options.baseUrl ||= DEFAULTS[options.kind].baseUrl;
  return options;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readHtml(filePath) {
  return fs.readFile(filePath, 'utf8');
}

function compactString(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values) {
  return [...new Set(values.map(compactString).filter(Boolean))];
}

function absoluteUrl(baseUrl, routePath) {
  const normalized = `/${String(routePath || '').replace(/^\/+/, '')}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;
  const encoded = withSlash
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return `${baseUrl}${encoded}`;
}

function routePathFromFile(publicDir, filePath) {
  const relative = path.relative(publicDir, filePath).replace(/\\/g, '/');
  return `/${relative.replace(/\/index\.html$/, '/')}`;
}

function localRoutePathFromUrl(baseUrl, url) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== baseUrl) return null;
    const decoded = decodeURIComponent(parsed.pathname);
    return decoded.endsWith('/') ? decoded : `${decoded}/`;
  } catch {
    return null;
  }
}

async function localRouteExists(publicDir, routePath) {
  const normalized = routePath.replace(/^\/+/, '');
  if (!normalized || normalized === '/') {
    return exists(path.join(publicDir, 'index.html'));
  }
  return exists(path.join(publicDir, normalized, 'index.html'));
}

async function walkIndexFiles(rootDir) {
  const results = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const child = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(child);
      } else if (entry.isFile() && entry.name === 'index.html') {
        results.push(child);
      }
    }
  }

  if (await exists(rootDir)) {
    await walk(rootDir);
  }
  return results.sort();
}

function flattenSchemas(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenSchemas);
  if (typeof value === 'object') {
    const graph = value['@graph'];
    return graph ? [value, ...flattenSchemas(graph)] : [value];
  }
  return [];
}

function parseJsonLd(document) {
  const schemas = [];
  const errors = [];
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];

  for (const script of scripts) {
    const raw = script.textContent?.trim();
    if (!raw) continue;
    try {
      schemas.push(...flattenSchemas(JSON.parse(raw)));
    } catch (error) {
      errors.push(compactString(error.message));
    }
  }

  return { schemas, errors };
}

function typeIncludes(schema, targets) {
  const value = schema?.['@type'];
  const types = Array.isArray(value) ? value : [value];
  return types.some((type) => targets.includes(type));
}

function firstSchema(schemas, targets) {
  return schemas.find((schema) => typeIncludes(schema, targets)) || null;
}

function metaContent(document, selector) {
  return compactString(document.querySelector(selector)?.getAttribute('content'));
}

function normalizeImage(image) {
  if (Array.isArray(image)) return compactString(image[0]?.url || image[0]);
  if (image && typeof image === 'object') return compactString(image.url || image.contentUrl);
  return compactString(image);
}

function addressParts(address = {}) {
  return {
    streetAddress: compactString(address.streetAddress),
    city: compactString(address.addressLocality),
    region: compactString(address.addressRegion),
    postalCode: compactString(address.postalCode),
    country: compactString(address.addressCountry),
  };
}

function faqAnswers(schemas, needle) {
  const faqSchemas = schemas.filter((schema) => typeIncludes(schema, ['FAQPage']));
  const answers = [];
  for (const faq of faqSchemas) {
    const questions = Array.isArray(faq.mainEntity) ? faq.mainEntity : [];
    for (const question of questions) {
      if (!compactString(question.name).toLowerCase().includes(needle)) continue;
      const answer = question.acceptedAnswer?.text;
      if (answer) answers.push(answer);
    }
  }
  return uniqueStrings(answers);
}

function extractListItems(value) {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .map((entry) => entry?.item || entry)
    .filter(Boolean);
}

async function normalizeListedAppraiser(item, baseUrl, publicDir) {
  const url = compactString(item.url || item.item);
  const routePath = url ? localRoutePathFromUrl(baseUrl, url) : null;
  const hasRoute = routePath ? await localRouteExists(publicDir, routePath) : false;
  return {
    name: compactString(item.name),
    url: hasRoute ? url : '',
    slug: hasRoute ? routePath.split('/').filter(Boolean).pop() : '',
    image: normalizeImage(item.image),
    description: compactString(item.description),
    publicRouteAvailable: hasRoute || !routePath,
  };
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    return value.map(cleanObject).filter((item) => {
      if (Array.isArray(item)) return item.length > 0;
      if (item && typeof item === 'object') return Object.keys(item).length > 0;
      return item !== '';
    });
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      const cleaned = cleanObject(child);
      if (Array.isArray(cleaned) && cleaned.length === 0) continue;
      if (cleaned && typeof cleaned === 'object' && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0) continue;
      if (cleaned === '') continue;
      out[key] = cleaned;
    }
    return out;
  }
  if (typeof value === 'string') return compactString(value);
  return value;
}

async function extractAppraiser(publicDir, baseUrl, filePath) {
  const html = await readHtml(filePath);
  const document = new JSDOM(html).window.document;
  const { schemas, errors } = parseJsonLd(document);
  const routePath = routePathFromFile(publicDir, filePath);
  const url = absoluteUrl(baseUrl, routePath);
  const primary = firstSchema(schemas, [
    'ProfessionalService',
    'LocalBusiness',
    'Organization',
    'Person',
  ]) || {};
  const address = addressParts(primary.address || {});
  const serviceAnswers = faqAnswers(schemas, 'services');
  const specialtyAnswers = faqAnswers(schemas, 'specialties');

  return cleanObject({
    slug: routePath.split('/').filter(Boolean).pop(),
    url,
    name: primary.name || metaContent(document, 'meta[property="og:title"]') || document.title,
    description: primary.description || metaContent(document, 'meta[name="description"]') || metaContent(document, 'meta[property="og:description"]'),
    image: normalizeImage(primary.image) || metaContent(document, 'meta[property="og:image"]') || metaContent(document, 'meta[name="twitter:image"]'),
    telephone: primary.telephone,
    email: primary.email,
    address,
    serviceType: primary.serviceType,
    priceRange: primary.priceRange,
    openingHours: Array.isArray(primary.openingHours) ? primary.openingHours.join('; ') : primary.openingHours,
    specialties: specialtyAnswers,
    services: serviceAnswers,
    source: {
      type: 'public_site_html_json_ld',
      route: routePath,
    },
    jsonLdParseWarnings: errors,
  });
}

async function extractLocation(publicDir, baseUrl, filePath) {
  const html = await readHtml(filePath);
  const document = new JSDOM(html).window.document;
  const { schemas, errors } = parseJsonLd(document);
  const routePath = routePathFromFile(publicDir, filePath);
  const url = absoluteUrl(baseUrl, routePath);
  const collection = firstSchema(schemas, ['CollectionPage']) || {};
  const itemList = firstSchema(schemas, ['ItemList']) || collection.mainEntity || {};
  const service = firstSchema(schemas, ['Service']) || {};
  const areaAddress = service.areaServed?.address || {};
  const listed = [];
  for (const item of extractListItems(itemList.itemListElement)) {
    listed.push(await normalizeListedAppraiser(item, baseUrl, publicDir));
  }
  for (const provider of Array.isArray(service.provider) ? service.provider : []) {
    listed.push(await normalizeListedAppraiser(provider, baseUrl, publicDir));
  }
  const deduped = [];
  const seen = new Set();
  for (const appraiser of listed) {
    const key = appraiser.url || appraiser.name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(appraiser);
  }

  return cleanObject({
    slug: routePath.split('/').filter(Boolean).pop(),
    url,
    name: collection.name || itemList.name || service.name || metaContent(document, 'meta[property="og:title"]') || document.title,
    description: collection.description || service.description || metaContent(document, 'meta[name="description"]') || metaContent(document, 'meta[property="og:description"]'),
    city: compactString(service.areaServed?.name || areaAddress.addressLocality),
    region: compactString(areaAddress.addressRegion),
    country: compactString(areaAddress.addressCountry),
    numberOfListedAppraisers: Number(itemList.numberOfItems || deduped.length || 0),
    listedAppraisers: deduped,
    source: {
      type: 'public_site_html_json_ld',
      route: routePath,
    },
    jsonLdParseWarnings: errors,
  });
}

async function validateRoutes(publicDir, baseUrl, appraisers, locations) {
  const missing = [];
  const check = async (url, context) => {
    const routePath = localRoutePathFromUrl(baseUrl, url);
    if (!routePath) return;
    if (!(await localRouteExists(publicDir, routePath))) {
      missing.push({ context, url });
    }
  };

  for (const appraiser of appraisers) {
    await check(appraiser.url, `appraiser:${appraiser.slug}`);
  }
  for (const location of locations) {
    await check(location.url, `location:${location.slug}`);
    for (const appraiser of location.listedAppraisers || []) {
      await check(appraiser.url, `location:${location.slug}:listedAppraiser:${appraiser.name || appraiser.slug}`);
    }
  }

  if (missing.length) {
    throw new Error(`Generated feed has internal URLs without public_site routes: ${JSON.stringify(missing.slice(0, 20), null, 2)}`);
  }
}

async function writeJson(filePath, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  JSON.parse(serialized);
  await fs.writeFile(filePath, serialized, 'utf8');
}

async function writeText(filePath, value) {
  await fs.writeFile(filePath, value, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const defaults = DEFAULTS[options.kind];
  const appraiserRoot = path.join(options.publicDir, 'appraiser');
  const locationRoot = path.join(options.publicDir, 'location');
  const appraiserFiles = (await walkIndexFiles(appraiserRoot))
    .filter((file) => path.relative(appraiserRoot, file).replace(/\\/g, '/') !== 'index.html');
  const locationFiles = (await walkIndexFiles(locationRoot))
    .filter((file) => path.relative(locationRoot, file).replace(/\\/g, '/') !== 'index.html');

  const appraisers = [];
  for (const file of appraiserFiles) {
    appraisers.push(await extractAppraiser(options.publicDir, options.baseUrl, file));
  }
  appraisers.sort((a, b) => a.url.localeCompare(b.url));

  const locations = [];
  for (const file of locationFiles) {
    locations.push(await extractLocation(options.publicDir, options.baseUrl, file));
  }
  locations.sort((a, b) => a.url.localeCompare(b.url));

  await validateRoutes(options.publicDir, options.baseUrl, appraisers, locations);

  const generatedAt = new Date().toISOString();
  const directory = {
    title: defaults.title,
    kind: options.kind,
    baseUrl: options.baseUrl,
    generatedAt,
    source: 'canonical public_site HTML and embedded Schema.org JSON-LD only',
    privacy: 'Contains only fields already rendered on public directory pages. Private discovery and enrichment artifacts are excluded.',
    counts: {
      appraisers: appraisers.length,
      locations: locations.length,
    },
    feeds: {
      llms: `${options.baseUrl}/llms.txt`,
      appraisers: `${options.baseUrl}/appraisers.json`,
      locations: `${options.baseUrl}/locations.json`,
      directory: `${options.baseUrl}/directory.json`,
      sitemap: `${options.baseUrl}/sitemap.xml`,
    },
    appraisers,
    locations,
  };

  const llms = [
    `# ${defaults.title}`,
    '',
    defaults.description,
    '',
    '## Public Machine-Readable Feeds',
    `- Directory summary: ${options.baseUrl}/directory.json`,
    `- Appraiser profiles: ${options.baseUrl}/appraisers.json`,
    `- Location pages: ${options.baseUrl}/locations.json`,
    `- Sitemap: ${options.baseUrl}/sitemap.xml`,
    '',
    '## Per-Location Feeds',
    'Each location page also has a compact JSON feed at /location/<slug>/index.json.',
    '',
    '## Data Boundary',
    'These feeds are generated from canonical public_site HTML and embedded Schema.org JSON-LD only.',
    'They do not expose private discovery data, enrichment artifacts, or internal review artifacts.',
    '',
  ].join('\n');

  await writeJson(path.join(options.publicDir, 'appraisers.json'), {
    title: `${defaults.title} appraiser profiles`,
    kind: options.kind,
    baseUrl: options.baseUrl,
    generatedAt,
    count: appraisers.length,
    appraisers,
  });
  await writeJson(path.join(options.publicDir, 'locations.json'), {
    title: `${defaults.title} location pages`,
    kind: options.kind,
    baseUrl: options.baseUrl,
    generatedAt,
    count: locations.length,
    locations,
  });
  await writeJson(path.join(options.publicDir, 'directory.json'), directory);
  await writeText(path.join(options.publicDir, 'llms.txt'), llms);

  for (const location of locations) {
    const locationJsonPath = path.join(
      options.publicDir,
      location.source.route.replace(/^\/+/, ''),
      'index.json',
    );
    await writeJson(locationJsonPath, {
      title: location.name,
      kind: options.kind,
      baseUrl: options.baseUrl,
      generatedAt,
      location,
    });
  }

  console.log(JSON.stringify({
    action: 'built-directory-llm-feeds',
    kind: options.kind,
    publicDir: options.publicDir,
    appraisers: appraisers.length,
    locations: locations.length,
    files: {
      llms: 'llms.txt',
      appraisers: 'appraisers.json',
      locations: 'locations.json',
      directory: 'directory.json',
      perLocation: locations.length,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error('[build-directory-llm-feeds] Failed:', error?.stack || error?.message || error);
  process.exit(1);
});
