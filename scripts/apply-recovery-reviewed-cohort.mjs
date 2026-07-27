#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public_site');
const MANIFEST_PATH = path.join(ROOT, 'data/provider-publication-manifest.json');
const REVIEW_PATH = path.join(ROOT, 'data/recovery-reviewed-provider-cohort.json');
const CITY_DECISIONS_PATH = path.join(ROOT, 'data/city-publication-decisions.json');
const BASE_URL = 'https://art-appraisers-directory.appraisily.com';
const write = process.argv.includes('--write');

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function ensureMeta(document, selector, attributes) {
  let node = document.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    document.head.appendChild(node);
  }
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function setMetaDescription(document, description) {
  ensureMeta(document, 'meta[name="description"]', { name: 'description', content: description });
  for (const selector of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
    document.querySelector(selector)?.setAttribute('content', description);
  }
}

function removeSection(document, labels) {
  const normalized = new Set(labels.map(label => label.toLowerCase()));
  for (const heading of [...document.querySelectorAll('h2,h3,h4')]) {
    if (!normalized.has(compact(heading.textContent).toLowerCase())) continue;
    const container = heading.closest('section') || heading.closest('.bg-white.rounded-lg.shadow-md');
    if (container && !container.querySelector('h1')) container.remove();
    else {
      heading.nextElementSibling?.remove();
      heading.remove();
    }
  }
}

function setRobotsAndPublication(document, status, sourceUrl = '') {
  ensureMeta(document, 'meta[name="robots"]', {
    name: 'robots',
    content: status === 'verified' ? 'index, follow' : 'noindex, follow',
  });
  ensureMeta(document, 'meta[name="appraisily:provider-publication-status"]', {
    name: 'appraisily:provider-publication-status',
    content: status,
  });
  if (sourceUrl) {
    ensureMeta(document, 'meta[name="appraisily:provider-source"]', {
      name: 'appraisily:provider-source',
      content: sourceUrl,
    });
  } else {
    document.querySelector('meta[name="appraisily:provider-source"]')?.remove();
  }
}

function sanitizeSchema(document, { status, provider, slug }) {
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed;
    try {
      parsed = JSON.parse(script.textContent || 'null');
    } catch {
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      for (const key of ['telephone', 'email', 'aggregateRating', 'review', 'openingHours', 'priceRange', 'award']) delete node[key];
      if (!['ProfessionalService', 'LocalBusiness', 'Organization', 'Person'].includes(node['@type'])) continue;
      node.name = provider?.name || node.name;
      node.url = `${BASE_URL}/appraiser/${slug}/`;
      node.description = status === 'verified'
        ? provider.description
        : `${provider?.name || node.name || slug} is retained as a non-indexable record while provider facts are reviewed.`;
      node.serviceType = status === 'verified' ? 'Fine-art appraisal services' : 'Directory record under review';
      if (status === 'verified') {
        node.address = {
          '@type': 'PostalAddress',
          addressLocality: provider.city,
          addressRegion: provider.region,
          addressCountry: provider.country,
        };
        node.sameAs = provider.sourceUrl;
      } else {
        delete node.sameAs;
        if (node.address && typeof node.address === 'object') {
          delete node.address.streetAddress;
          delete node.address.postalCode;
        }
      }
    }
    script.textContent = JSON.stringify(Array.isArray(parsed) ? nodes : nodes[0]);
  }
}

function correctionLink(document, slug) {
  if (document.querySelector('[data-provider-correction-link]')) return;
  const paragraph = document.createElement('p');
  paragraph.className = 'mt-6 text-sm text-gray-600';
  const link = document.createElement('a');
  link.href = `https://appraisily.com/contact?source=directory_listing&provider=${encodeURIComponent(slug)}`;
  link.className = 'font-medium text-blue-700 hover:text-blue-600';
  link.setAttribute('data-provider-correction-link', 'true');
  link.textContent = 'Report or correct this listing';
  paragraph.appendChild(link);
  (document.querySelector('main') || document.body).appendChild(paragraph);
}

function pointLocationBreadcrumbsAtHub(document) {
  for (const link of document.querySelectorAll('a[href^="/location/"], a[href^="https://art-appraisers-directory.appraisily.com/location/"]')) {
    link.setAttribute('href', '/location/');
    if (/^art appraisers in /i.test(compact(link.textContent))) link.textContent = 'Browse locations';
  }
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed;
    try {
      parsed = JSON.parse(script.textContent || 'null');
    } catch {
      continue;
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (node?.['@type'] !== 'BreadcrumbList' || !Array.isArray(node.itemListElement)) continue;
      for (const item of node.itemListElement) {
        const url = String(item?.item || item?.url || '');
        if (!url.includes('/location/')) continue;
        if ('item' in item) item.item = `${BASE_URL}/location/`;
        if ('url' in item) item.url = `${BASE_URL}/location/`;
        item.name = 'Locations';
      }
    }
    script.textContent = JSON.stringify(Array.isArray(parsed) ? nodes : nodes[0]);
  }
}

function replaceListSection(document, label, values, anchor) {
  let heading = [...document.querySelectorAll('h2')].find(node => compact(node.textContent).toLowerCase() === label.toLowerCase());
  let section = heading?.closest('section');
  if (!section) {
    section = document.createElement('section');
    section.className = 'bg-white rounded-lg shadow-md p-6 mb-6';
    heading = document.createElement('h2');
    heading.className = 'text-2xl font-semibold text-gray-900 mb-4';
    heading.textContent = label;
    section.appendChild(heading);
    anchor.insertAdjacentElement('afterend', section);
  }
  for (const child of [...section.children]) if (child !== heading) child.remove();
  const list = document.createElement('ul');
  list.className = 'space-y-2';
  for (const value of values) {
    const item = document.createElement('li');
    item.className = 'flex items-start';
    const bullet = document.createElement('span');
    bullet.className = 'text-blue-600 mr-2';
    bullet.textContent = '•';
    const text = document.createElement('span');
    text.textContent = value;
    item.append(bullet, text);
    list.appendChild(item);
  }
  section.appendChild(list);
  return section;
}

function replaceTextSection(document, label, text, anchor) {
  let heading = [...document.querySelectorAll('h2')].find(node => compact(node.textContent).toLowerCase() === label.toLowerCase());
  let section = heading?.closest('section');
  if (!section) {
    section = document.createElement('section');
    section.className = 'bg-white rounded-lg shadow-md p-6 mb-6';
    heading = document.createElement('h2');
    heading.className = 'text-2xl font-semibold text-gray-900 mb-4';
    heading.textContent = label;
    section.appendChild(heading);
    anchor.insertAdjacentElement('afterend', section);
  }
  for (const child of [...section.children]) if (child !== heading) child.remove();
  const paragraph = document.createElement('p');
  paragraph.className = 'text-gray-700 leading-relaxed';
  paragraph.textContent = text;
  section.appendChild(paragraph);
  return section;
}

function makeVerified(html, slug, provider, reviewedAt) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  document.title = provider.title;
  setMetaDescription(document, provider.description);
  setRobotsAndPublication(document, 'verified', provider.sourceUrl);
  const h1 = document.querySelector('h1');
  if (!h1) throw new Error(`Missing H1 for reviewed provider ${slug}`);
  h1.textContent = provider.name;
  const card = h1.closest('section') || h1.closest('.bg-white.rounded-lg.shadow-md') || h1.parentElement;
  const locality = `${provider.city}, ${provider.region}`;
  const localityNode = [...card.querySelectorAll('p')].find(node => /^([\w .'-]+),\s*[A-Z]{2}$/.test(compact(node.textContent)));
  if (localityNode) localityNode.textContent = locality;
  const aboutHeading = [...card.querySelectorAll('h2')].find(node => compact(node.textContent).toLowerCase() === 'about');
  const about = aboutHeading?.nextElementSibling || [...card.querySelectorAll('p')].find(node => node !== localityNode && !node.hasAttribute('data-provider-publication-status'));
  if (about) {
    about.textContent = provider.about;
    about.setAttribute('data-provider-specific-about', 'true');
  }
  else {
    const paragraph = document.createElement('p');
    paragraph.className = 'text-gray-700 leading-relaxed';
    paragraph.textContent = provider.about;
    paragraph.setAttribute('data-provider-specific-about', 'true');
    card.appendChild(paragraph);
  }

  let banner = document.querySelector('[data-provider-publication-status]');
  if (!banner) {
    banner = document.createElement('p');
    card.insertAdjacentElement('afterend', banner);
  }
  banner.className = 'mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-gray-700';
  banner.setAttribute('data-provider-publication-status', 'verified');
  banner.textContent = `Provider facts reviewed against the official website on ${reviewedAt}. Confirm current availability and engagement terms directly with the business.`;

  removeSection(document, ['Pricing', 'Reviews', 'Business Hours', 'Certifications', 'Credentials']);
  for (const link of [...document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]')]) (link.closest('div.flex') || link).remove();
  for (const link of document.querySelectorAll('a[data-gtm-cta="website"]')) link.setAttribute('href', provider.sourceUrl);
  let anchor = banner;
  anchor = replaceListSection(document, 'Specialties', provider.specialties, anchor);
  anchor = replaceListSection(document, 'Services', provider.services, anchor);
  anchor = replaceTextSection(document, 'Verified qualifications', provider.qualifications, anchor);
  const evidence = `${provider.sourceUrls.map(url => url).join(' · ')}`;
  replaceTextSection(document, 'Verification', `Reviewed ${reviewedAt} from official provider sources: ${evidence}`, anchor);
  sanitizeSchema(document, { status: 'verified', provider, slug });
  pointLocationBreadcrumbsAtHub(document);
  correctionLink(document, slug);
  return dom.serialize();
}

function makeUnderReview(html, slug, record) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const name = record.name || compact(document.querySelector('h1')?.textContent) || slug;
  const description = `${name} is retained as a non-indexable directory record while provider facts are reviewed.`;
  setMetaDescription(document, description);
  setRobotsAndPublication(document, 'under_review');
  let banner = document.querySelector('[data-provider-publication-status]');
  if (!banner) {
    banner = document.createElement('p');
    document.querySelector('h1')?.parentElement?.insertAdjacentElement('afterend', banner);
  }
  if (banner) {
    banner.className = 'mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700';
    banner.setAttribute('data-provider-publication-status', 'under_review');
    banner.textContent = 'Profile under review. Provider location, services, credentials, and contact claims are not currently published.';
  }
  const h1 = document.querySelector('h1');
  if (h1) h1.textContent = name.replace(/Appraisel/g, 'Appraisal');
  document.title = document.title.replace(/Appraisel/g, 'Appraisal');
  removeSection(document, ['Specialties', 'Services', 'Pricing', 'Reviews', 'Business Hours', 'Certifications', 'Credentials', 'Verified qualifications', 'Verification']);
  for (const link of [...document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]')]) {
    (link.closest('div.flex') || link).remove();
  }
  for (const link of [...document.querySelectorAll('a[data-gtm-cta="website"]')]) {
    (link.closest('div') || link).remove();
  }
  for (const heading of [...document.querySelectorAll('h2')]) {
    if (compact(heading.textContent).toLowerCase() !== 'about') continue;
    if (heading.nextElementSibling) heading.nextElementSibling.textContent = `${name.replace(/Appraisel/g, 'Appraisal')} remains under review. Confirm provider identity and current details independently.`;
  }
  sanitizeSchema(document, { status: 'under_review', provider: { name: name.replace(/Appraisel/g, 'Appraisal') }, slug });
  correctionLink(document, slug);
  return dom.serialize();
}

function slugFromUrl(value, kind) {
  return String(value || '').match(new RegExp(`/${kind}/([^/?#]+)/?`))?.[1] || '';
}

function updateLocationPage(html, slug, allowedProfiles, publishable) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const allowed = new Map(allowedProfiles.map(provider => [provider.slug, provider]));
  for (const link of [...document.querySelectorAll('a[href*="/appraiser/"]')]) {
    const profileSlug = slugFromUrl(link.getAttribute('href'), 'appraiser');
    if (!profileSlug || allowed.has(profileSlug)) continue;
    const article = link.closest('article');
    const item = link.closest('li');
    if (article) article.remove();
    else if (item) item.remove();
  }
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed;
    try { parsed = JSON.parse(script.textContent || 'null'); } catch { continue; }
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      const itemList = node?.['@type'] === 'CollectionPage' ? node.mainEntity : node?.['@type'] === 'ItemList' ? node : null;
      if (itemList?.itemListElement) {
        itemList.itemListElement = itemList.itemListElement.filter(item => allowed.has(slugFromUrl(item.url || item.item, 'appraiser')));
        itemList.itemListElement.forEach((item, index) => { item.position = index + 1; });
        itemList.numberOfItems = itemList.itemListElement.length;
      }
      if (Array.isArray(node?.provider)) node.provider = node.provider.filter(item => allowed.has(slugFromUrl(item.url, 'appraiser')));
    }
    script.textContent = JSON.stringify(Array.isArray(parsed) ? nodes : nodes[0]);
  }
  const count = allowedProfiles.length;
  ensureMeta(document, 'meta[name="robots"]', {
    name: 'robots',
    content: count && publishable ? 'index, follow' : 'noindex, follow',
  });
  for (const heading of document.querySelectorAll('h2')) {
    if (/^Directory profiles \(\d+\)$/.test(compact(heading.textContent))) heading.textContent = `Directory profiles (${count})`;
  }
  for (const paragraph of document.querySelectorAll('p')) {
    if (compact(paragraph.textContent) === 'Verified appraisers' && paragraph.nextElementSibling) paragraph.nextElementSibling.textContent = String(count);
  }
  const grid = document.querySelector('#local-appraisers .grid');
  if (grid && count === 0 && !grid.querySelector('[data-directory-empty-state]')) {
    const empty = document.createElement('div');
    empty.className = 'md:col-span-2 rounded-lg border border-gray-200 bg-white p-6 text-gray-700';
    empty.setAttribute('data-directory-empty-state', 'true');
    empty.textContent = 'No fully reviewed local appraiser profiles are currently published for this city.';
    grid.appendChild(empty);
  }
  return { html: dom.serialize(), indexable: count > 0 && publishable };
}

function updateAppraiserHub(document) {
  const main = document.querySelector('main');
  const list = main?.querySelector('ul');
  if (!main || !list) throw new Error('Appraiser hub is missing its main provider list');
  document.querySelector('[data-appraiser-hub-review-guide]')?.remove();
  const guide = document.createElement('div');
  guide.setAttribute('data-appraiser-hub-review-guide', 'true');
  guide.className = 'appraiser-hub-review-guide';
  guide.innerHTML = `
    <section>
      <h2>What the review covers</h2>
      <p>Publication requires an official source supporting provider identity, a primary location, and relevance to fine-art appraisal. Each profile identifies its source and review date and offers a correction path.</p>
      <p>The directory does not independently confirm current availability, fees, service area, engagement terms, ratings, or review counts.</p>
    </section>
    <section>
      <h2>How to compare profiles</h2>
      <p>Start with the provider's verified primary location, then compare supported specialties, appraisal purposes, qualifications, and the linked official source. A primary location is not a promise of coverage in every nearby city.</p>
      <p>Confirm whether the assignment can be completed remotely or needs an in-person inspection before engaging a provider.</p>
    </section>`;
  list.insertAdjacentElement('beforebegin', guide);
  const style = document.querySelector('style');
  if (style && !style.textContent.includes('.appraiser-hub-review-guide')) {
    style.textContent += `
      .appraiser-hub-review-guide { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 32px 0; }
      .appraiser-hub-review-guide section { padding: 20px; border: 1px solid #d8d0c6; background: #fff; }
      .appraiser-hub-review-guide h2 { margin: 0 0 8px; font-family: Georgia, serif; font-size: 24px; }
      .appraiser-hub-review-guide p { margin: 8px 0 0; }
      @media (max-width: 680px) { .appraiser-hub-review-guide { grid-template-columns: 1fr; } }`;
  }
}

async function writeIfChanged(filePath, next, changes) {
  const before = await fs.readFile(filePath, 'utf8');
  if (before === next) return;
  changes.push(path.relative(ROOT, filePath));
  if (write) await fs.writeFile(filePath, next);
}

async function main() {
  const review = JSON.parse(await fs.readFile(REVIEW_PATH, 'utf8'));
  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const cityDecisions = JSON.parse(await fs.readFile(CITY_DECISIONS_PATH, 'utf8'));
  const retainedCities = new Set(
    cityDecisions.cities
      .filter(city => city.status === 'retained')
      .map(city => city.slug),
  );
  const reviewed = new Map(Object.entries(review.providers));
  const changes = [];
  const verifiedRecords = [];

  for (const record of manifest.providers) {
    const provider = reviewed.get(record.slug);
    const filePath = path.join(PUBLIC_DIR, 'appraiser', record.slug, 'index.html');
    const html = await fs.readFile(filePath, 'utf8');
    if (provider) {
      const next = makeVerified(html, record.slug, provider, review.reviewedAt);
      await writeIfChanged(filePath, next, changes);
      Object.assign(record, {
        name: provider.name,
        publicationStatus: 'verified',
        reason: 'manual_official_website_review',
        sourceUrl: provider.sourceUrl,
        sourceUrls: provider.sourceUrls,
        sourceType: 'official_business_website',
        verifiedAt: review.reviewedAt,
        verifiedBy: review.reviewedBy,
        claimScope: provider.claimScope,
      });
      verifiedRecords.push({ slug: record.slug, ...provider });
    } else {
      const needsSuppression = ['verified', 'limited'].includes(record.publicationStatus)
        || record.slug === 'antique-appraisel-and-estate-sale-service-k-and-p-bailey-isa-capp-aaa';
      if (needsSuppression) {
        const next = makeUnderReview(html, record.slug, record);
        await writeIfChanged(filePath, next, changes);
      }
      record.name = record.name.replace(/Appraisel/g, 'Appraisal');
      if (record.slug === 'antique-appraisel-and-estate-sale-service-k-and-p-bailey-isa-capp-aaa') {
        record.canonicalProviderId = 'provider:antique-appraisal-and-estate-sale-service-k-p-bailey';
      }
      Object.assign(record, {
        publicationStatus: 'under_review',
        reason: 'does_not_meet_reviewed_content_threshold_2026-07-15',
        sourceUrl: '',
        sourceType: '',
        verifiedAt: '',
        verifiedBy: '',
        claimScope: [],
      });
      delete record.sourceUrls;
    }
  }

  const verifiedByCity = new Map();
  for (const provider of verifiedRecords) {
    const citySlug = provider.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!verifiedByCity.has(citySlug)) verifiedByCity.set(citySlug, []);
    verifiedByCity.get(citySlug).push(provider);
  }
  const indexableLocations = new Set();
  const locationRoot = path.join(PUBLIC_DIR, 'location');
  for (const entry of await fs.readdir(locationRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(locationRoot, entry.name, 'index.html');
    const before = await fs.readFile(filePath, 'utf8');
    const result = updateLocationPage(
      before,
      entry.name,
      verifiedByCity.get(entry.name) || [],
      retainedCities.has(entry.name),
    );
    await writeIfChanged(filePath, result.html, changes);
    if (result.indexable) indexableLocations.add(entry.name);
  }

  const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
  const sitemap = await fs.readFile(sitemapPath, 'utf8');
  const filteredSitemap = sitemap.replace(/\s*<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g, (block, url) => {
    const profileSlug = slugFromUrl(url, 'appraiser');
    if (profileSlug && !reviewed.has(profileSlug)) return '';
    const locationSlug = slugFromUrl(url, 'location');
    if (locationSlug && !indexableLocations.has(locationSlug)) return '';
    return block;
  });
  await writeIfChanged(sitemapPath, filteredSitemap, changes);

  const appraiserIndexPath = path.join(PUBLIC_DIR, 'appraiser', 'index.html');
  const appraiserDom = new JSDOM(await fs.readFile(appraiserIndexPath, 'utf8'));
  updateAppraiserHub(appraiserDom.window.document);
  const appraiserList = appraiserDom.window.document.querySelector('main ul');
  if (appraiserList) {
    appraiserList.textContent = '';
    for (const provider of verifiedRecords.sort((a, b) => a.name.localeCompare(b.name))) {
      const item = appraiserDom.window.document.createElement('li');
      const link = appraiserDom.window.document.createElement('a');
      link.href = `/appraiser/${provider.slug}/`;
      link.textContent = provider.name;
      item.appendChild(link);
      appraiserList.appendChild(item);
    }
  }
  await writeIfChanged(appraiserIndexPath, appraiserDom.serialize(), changes);

  manifest.policyVersion = 2;
  manifest.policy = review.policy;
  manifest.summary = {
    indexable: verifiedRecords.length,
    verified: verifiedRecords.length,
    limited: 0,
    suppressed: manifest.providers.length - verifiedRecords.length,
    appraiserIndexEntries: verifiedRecords.length,
    indexableLocations: indexableLocations.size,
  };
  const manifestBefore = await fs.readFile(MANIFEST_PATH, 'utf8');
  const previousGeneratedAt = manifest.generatedAt;
  delete manifest.generatedAt;
  const manifestWithoutTimestamp = JSON.stringify(manifest, null, 2);
  const previousWithoutTimestamp = JSON.stringify(
    (() => {
      const previous = JSON.parse(manifestBefore);
      delete previous.generatedAt;
      return previous;
    })(),
    null,
    2,
  );
  if (manifestWithoutTimestamp !== previousWithoutTimestamp) {
    manifest.generatedAt = new Date().toISOString();
  } else if (previousGeneratedAt) {
    manifest.generatedAt = previousGeneratedAt;
  }
  const manifestNext = `${JSON.stringify(manifest, null, 2)}\n`;
  if (manifestBefore !== manifestNext) {
    changes.push(path.relative(ROOT, MANIFEST_PATH));
    if (write) await fs.writeFile(MANIFEST_PATH, manifestNext);
  }

  console.log(JSON.stringify({
    action: write ? 'applied-recovery-reviewed-cohort' : 'previewed-recovery-reviewed-cohort',
    reviewedProfiles: verifiedRecords.map(provider => provider.slug),
    indexableLocations: [...indexableLocations].sort(),
    changedFiles: changes.length,
    sampledChanges: changes.slice(0, 30),
  }, null, 2));
}

main().catch(error => {
  console.error(`[apply-recovery-reviewed-cohort] ${error.stack || error.message || error}`);
  process.exit(1);
});
