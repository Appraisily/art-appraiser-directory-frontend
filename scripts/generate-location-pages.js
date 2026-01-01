#!/usr/bin/env node

/**
 * Generate Location Pages
 *
 * Builds rich static HTML for each location using standardized data so that
 * Search Console receives indexable, content-heavy pages.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMPLATE_FILE = path.join(DIST_DIR, 'index.html');
const STANDARDIZED_DIR = path.join(ROOT_DIR, 'src', 'data', 'standardized');
const CITIES_FILE = path.join(ROOT_DIR, 'src', 'data', 'cities.json');

const DIRECTORY_DOMAIN = 'https://art-appraisers-directory.appraisily.com';
const CTA_URL = 'https://appraisily.com/start';
const ASSETS_BASE_URL = 'https://assets.appraisily.com/assets/directory';
const FALLBACK_IMAGE = `${ASSETS_BASE_URL}/placeholder.jpg`;

function normalizeImageUrl(input = '') {
  const url = String(input || '').trim();
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith(ASSETS_BASE_URL)) return url;
  if (url.startsWith('https://ik.imagekit.io/appraisily/')) {
    return `${ASSETS_BASE_URL}/${url.slice('https://ik.imagekit.io/appraisily/'.length)}`;
  }
  if (url.startsWith('https://placehold.co')) return FALLBACK_IMAGE;
  return url;
}

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let colored = message;

  switch (type) {
    case 'success':
      colored = chalk.green(message);
      break;
    case 'warning':
      colored = chalk.yellow(message);
      break;
    case 'error':
      colored = chalk.red(message);
      break;
    default:
      colored = chalk.blue(message);
  }

  console.log(`[${timestamp}] ${colored}`);
}

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatList(items) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function buildAbsoluteUrl(pathname = '') {
  if (!pathname) {
    return DIRECTORY_DOMAIN;
  }
  if (/^https?:\/\//i.test(pathname)) {
    return pathname;
  }
  const base = DIRECTORY_DOMAIN.endsWith('/') ? DIRECTORY_DOMAIN : `${DIRECTORY_DOMAIN}/`;
  const normalized = pathname.replace(/^\/+/, '');
  return normalized ? `${base}${normalized}` : DIRECTORY_DOMAIN;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, '');
  if (!digits) return null;
  return `tel:${digits}`;
}

function normalizeWebsite(url) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

function truncateText(text, maxLength = 320) {
  if (text === null || text === undefined) return '';
  const clean = String(text).trim();
  if (clean.length <= maxLength) return clean;
  const shortened = clean.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened}…`;
}

function dedupeList(items, limit) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const value = (item || '').toString().trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (limit && result.length >= limit) break;
  }
  return result;
}

function selectRelatedCities(allCities, currentCity, limit = 6) {
  const sameState = allCities.filter(city => city.slug !== currentCity.slug && city.state === currentCity.state);
  const others = allCities.filter(city => city.slug !== currentCity.slug && city.state !== currentCity.state);
  const combined = [...sameState, ...others];
  return combined.slice(0, limit);
}

function formatDateLabel(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildSummaryParagraph(cityDisplayName, appraisers, topSpecialties, topServices, averageRating, totalReviews) {
  const parts = [];
  parts.push(`Appraisily tracks ${appraisers.length} vetted art valuation professionals serving ${cityDisplayName}.`);
  if (averageRating) {
    const reviewDescriptor = totalReviews ? `${totalReviews} review${totalReviews === 1 ? '' : 's'}` : 'recent client feedback';
    parts.push(`Collectively they maintain an average client rating of ${averageRating.toFixed(1)}/5 across ${reviewDescriptor}.`);
  }
  if (topSpecialties.length) {
    parts.push(`Specialties represented include ${formatList(topSpecialties)}.`);
  }
  if (topServices.length) {
    parts.push(`Popular service requests cover ${formatList(topServices)}.`);
  }
  parts.push('Connect with a USPAP-compliant specialist to document your collection with defensible reports.');
  return parts.join(' ');
}

function createHeroSection(cityDisplayName, summaryParagraph, topSpecialties, topServices) {
  const specialtiesChips = topSpecialties.length
    ? `<div class="flex flex-wrap gap-2 mt-4">${topSpecialties.map(s => `<span class="bg-white/80 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">${escapeHtml(s)}</span>`).join('')}</div>`
    : '';
  const servicesLine = topServices.length
    ? `<p class="text-sm text-blue-50/90 mt-4">Common requests: ${escapeHtml(formatList(topServices))}</p>`
    : '';
  return `
    <section class="bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-xl shadow-lg p-8">
      <div class="space-y-4">
        <h1 class="text-3xl md:text-4xl font-bold">${escapeHtml(cityDisplayName)} Art Appraisers</h1>
        <p class="text-lg text-blue-50/90 leading-relaxed">${escapeHtml(summaryParagraph)}</p>
        ${servicesLine}
        ${specialtiesChips}
      </div>
    </section>
  `;
}

function createStatsSection(totalAppraisers, averageRating, totalReviews, freshestUpdate, experienceHighlights) {
  const statItems = [
    {
      label: 'Verified appraisers',
      value: totalAppraisers.toString(),
      description: 'Profiles vetted for credentials and USPAP compliance'
    }
  ];

  if (averageRating) {
    statItems.push({
      label: 'Average rating',
      value: `${averageRating.toFixed(1)}/5`,
      description: `${totalReviews} total client reviews across the directory`
    });
  }

  if (experienceHighlights.length) {
    statItems.push({
      label: 'Experience levels',
      value: formatList(experienceHighlights),
      description: 'Years in business reported by listed firms'
    });
  }

  if (freshestUpdate) {
    statItems.push({
      label: 'Last data refresh',
      value: freshestUpdate,
      description: 'Recent verification of contact details and services'
    });
  }

  if (!statItems.length) {
    return '';
  }

  const statCards = statItems.map(item => `
    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <p class="text-sm uppercase tracking-wide text-gray-500">${escapeHtml(item.label)}</p>
      <p class="text-2xl font-semibold text-gray-900 mt-2">${escapeHtml(item.value)}</p>
      <p class="text-sm text-gray-600 mt-3 leading-relaxed">${escapeHtml(item.description)}</p>
    </div>
  `).join('');

  return `
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${statCards}
    </section>
  `;
}

function createAppraiserCards(appraisers, citySlug) {
  if (!appraisers.length) {
    return '';
  }

  return appraisers.map(appraiser => {
    const slug = appraiser.slug || appraiser.id || '';
    const profilePath = `/appraiser/${encodeURIComponent(slug)}/`;
    const profileUrl = buildAbsoluteUrl(profilePath);
    const imageUrl = normalizeImageUrl(appraiser.imageUrl || FALLBACK_IMAGE);
    const rating = Number(appraiser.business?.rating);
    const hasRating = Number.isFinite(rating) && rating > 0;
    const ratingText = hasRating ? rating.toFixed(1) : null;
    const reviewCount = Number(appraiser.business?.reviewCount) || 0;
    const specialties = dedupeList(appraiser.expertise?.specialties || [], 6);
    const services = dedupeList(appraiser.expertise?.services || [], 4);
    const experienceRaw = appraiser.business?.yearsInBusiness;
    const experience = experienceRaw ? String(experienceRaw).trim() : '';
    const about = truncateText(appraiser.content?.about, 320);
    const phoneHref = normalizePhone(appraiser.contact?.phone);
    const displayPhoneRaw = appraiser.contact?.phone;
    const displayPhone = displayPhoneRaw ? String(displayPhoneRaw).trim() : '';
    const emailRaw = appraiser.contact?.email;
    const email = emailRaw ? String(emailRaw).trim() : '';
    const website = normalizeWebsite(appraiser.contact?.website);
    const addressRaw = appraiser.address?.formatted;
    const fallbackAddress = `${appraiser.address?.city || ''}, ${appraiser.address?.state || ''}`.trim();
    const address = addressRaw ? String(addressRaw).trim() : fallbackAddress;
    const specialtiesHtml = specialties.map(s => `<span class="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">${escapeHtml(s)}</span>`).join('');
    const servicesHtml = services.map(s => `<span class="border border-blue-200 text-blue-700 bg-blue-50 rounded-md px-3 py-1 text-sm">${escapeHtml(s)}</span>`).join('');
    const ctaHref = `${CTA_URL}?utm_source=directory&utm_medium=organic&utm_campaign=${encodeURIComponent(citySlug)}&utm_content=${encodeURIComponent(slug)}`;

    const ratingBadge = hasRating ? `
      <div class="flex flex-col items-end">
        <div class="flex items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-yellow-500 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <span class="font-semibold">${escapeHtml(ratingText)}</span>
        </div>
        ${reviewCount ? `<span class="text-xs text-gray-500 mt-1">${escapeHtml(`${reviewCount} review${reviewCount === 1 ? '' : 's'}`)}</span>` : ''}
      </div>
    ` : '';

    const contactButtons = `
      <div class="flex flex-wrap gap-2 mt-5">
        <a href="${escapeHtml(profileUrl)}" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors" data-gtm-event="appraiser_profile" data-gtm-city="${escapeHtml(citySlug)}" data-gtm-appraiser="${escapeHtml(slug)}">
          View Profile
        </a>
        ${phoneHref && displayPhone ? `<a href="${escapeHtml(phoneHref)}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" data-gtm-event="appraiser_call" data-gtm-city="${escapeHtml(citySlug)}" data-gtm-appraiser="${escapeHtml(slug)}">
          ${escapeHtml(displayPhone)}
        </a>` : ''}
        ${email ? `<a href="mailto:${escapeHtml(email)}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" data-gtm-event="appraiser_email" data-gtm-city="${escapeHtml(citySlug)}" data-gtm-appraiser="${escapeHtml(slug)}">
          Email
        </a>` : ''}
        ${website ? `<a href="${escapeHtml(website)}" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" target="_blank" rel="nofollow noopener" data-gtm-event="appraiser_site" data-gtm-city="${escapeHtml(citySlug)}" data-gtm-appraiser="${escapeHtml(slug)}">
          Website
        </a>` : ''}
        <a href="${escapeHtml(ctaHref)}" class="inline-flex items-center px-4 py-2 text-blue-700 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors" data-gtm-event="directory_cta" data-gtm-city="${escapeHtml(citySlug)}" data-gtm-appraiser="${escapeHtml(slug)}">
          Request Appraisal
        </a>
      </div>
    `;

    return `
      <article class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
        <div class="h-48 bg-gray-200 overflow-hidden">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(`${appraiser.name} - Art appraiser in ${appraiser.address?.city || ''}`)}" class="w-full h-full object-cover" loading="lazy">
        </div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                <a href="${escapeHtml(profileUrl)}" class="hover:text-blue-600 transition-colors">${escapeHtml(appraiser.name)}</a>
              </h3>
              ${experience ? `<p class="text-sm text-gray-500 mt-1">${escapeHtml(experience)}</p>` : ''}
              <p class="text-sm text-gray-600 mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 21c-4.2-4.4-6-7.3-6-10a6 6 0 0 1 12 0c0 2.7-1.8 5.6-6 10z"></path>
                  <circle cx="12" cy="11" r="2"></circle>
                </svg>
                <span class="ml-2">${escapeHtml(address)}</span>
              </p>
            </div>
            ${ratingBadge}
          </div>
          ${about ? `<p class="text-gray-700 leading-relaxed mb-4">${escapeHtml(about)}</p>` : ''}
          ${specialties.length ? `<div class="flex flex-wrap gap-2 mb-4">${specialtiesHtml}</div>` : ''}
          ${services.length ? `<div class="flex flex-wrap gap-2 mb-4">${servicesHtml}</div>` : ''}
          ${contactButtons}
        </div>
      </article>
    `;
  }).join('\n');
}

function buildTopAppraisersSection(appraisers, cityDisplayName) {
  if (!appraisers.length) {
    return '';
  }
  const topAppraisers = appraisers.slice(0, Math.min(appraisers.length, 6));
  const listItems = topAppraisers.map(appraiser => {
    const summary = truncateText(appraiser.content?.about || `Comprehensive appraisal support in ${cityDisplayName}`, 160);
    return `<li><strong>${escapeHtml(appraiser.name)}</strong> — ${escapeHtml(summary)}</li>`;
  }).join('');
  return `
    <section class="space-y-3">
      <h2 class="text-2xl font-semibold text-gray-900">Notable appraisers serving ${escapeHtml(cityDisplayName)}</h2>
      <ol class="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed">
        ${listItems}
      </ol>
    </section>
  `;
}

function buildRelatedCitiesSection(relatedCities) {
  if (!relatedCities.length) {
    return '';
  }
  const links = relatedCities.map(city => `
    <a href="/location/${escapeHtml(city.slug)}/" class="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
      ${escapeHtml(`${city.name}, ${city.state}`)}
    </a>
  `).join('');
  return `
    <section class="py-10">
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Explore nearby appraisal markets</h2>
        <div class="flex flex-wrap gap-3">
          ${links}
        </div>
      </div>
    </section>
  `;
}

function buildFaqSection(cityDisplayName, topServices, pricingExamples) {
  const servicesText = topServices.length
    ? formatList(topServices)
    : 'insurance coverage, estate planning, charitable donation, and collection management projects';
  const pricingText = pricingExamples.length
    ? formatList(pricingExamples)
    : 'hourly or project-based fees depending on artwork complexity';

  const questions = [
    {
      question: `How do I choose an art appraiser in ${cityDisplayName}?`,
      answer: `Look for professionals with ISA, ASA, or AAA credentials and USPAP-compliant reports. Start with our vetted directory, schedule a consultation, and ask about recent work that mirrors your collection.`
    },
    {
      question: `What services do appraisers in ${cityDisplayName} provide?`,
      answer: `Specialists in ${cityDisplayName} routinely assist with ${servicesText}. Many also support authenticity research, market analysis, and sale preparation for private collectors and institutions.`
    },
    {
      question: `How much does an art appraisal cost in ${cityDisplayName}?`,
      answer: `Fees vary by scope. Local providers reference ${pricingText}. Expect a written report that complies with USPAP standards and documents methodology, comparables, and appraiser credentials.`
    }
  ];

  const html = `
    <section class="py-10 border-t border-gray-200">
      <h2 class="text-2xl font-semibold text-gray-900 mb-6">Frequently asked questions about ${escapeHtml(cityDisplayName)} appraisers</h2>
      <div class="space-y-6">
        ${questions.map(q => `
          <div class="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <h3 class="text-lg font-medium text-gray-900 mb-2">${escapeHtml(q.question)}</h3>
            <p class="text-gray-700 leading-relaxed">${escapeHtml(q.answer)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': questions.map(q => ({
      '@type': 'Question',
      'name': q.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': q.answer
      }
    }))
  };

  return { html, schema };
}

function buildSchemas(cityDisplayName, canonicalUrl, appraisers, faqSchema) {
  const listItems = appraisers.slice(0, Math.min(appraisers.length, 15)).map((appraiser, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': appraiser.name,
    'url': buildAbsoluteUrl(`/appraiser/${appraiser.slug}/`),
    'image': normalizeImageUrl(appraiser.imageUrl || FALLBACK_IMAGE),
    'description': appraiser.content?.about
  }));

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `Leading art appraisers in ${cityDisplayName}`,
    'url': canonicalUrl,
    'numberOfItems': appraisers.length,
    'itemListElement': listItems
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': DIRECTORY_DOMAIN
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': `Art appraisers in ${cityDisplayName}`,
        'item': canonicalUrl
      }
    ]
  };

  const schemas = [itemList, breadcrumb];
  if (faqSchema) {
    schemas.push(faqSchema);
  }
  return schemas;
}

function generateLocationPage(cityMeta, locationData, templateHtml, allCities) {
  const appraisers = Array.isArray(locationData?.appraisers) ? locationData.appraisers : [];
  const stateCode = dedupeList(appraisers.map(appraiser => appraiser.address?.state), 1)[0];
  const cityDisplayName = stateCode ? `${cityMeta.name}, ${stateCode}` : `${cityMeta.name}, ${cityMeta.state}`;

  const totalReviews = appraisers.reduce((sum, appraiser) => sum + (Number(appraiser.business?.reviewCount) || 0), 0);
  let weightedRatingSum = 0;
  let weightedRatingCount = 0;
  for (const appraiser of appraisers) {
    const rating = Number(appraiser.business?.rating);
    const reviewCount = Number(appraiser.business?.reviewCount);
    if (Number.isFinite(rating) && rating > 0) {
      if (reviewCount) {
        weightedRatingSum += rating * reviewCount;
        weightedRatingCount += reviewCount;
      } else {
        weightedRatingSum += rating;
        weightedRatingCount += 1;
      }
    }
  }
  const averageRating = weightedRatingCount ? weightedRatingSum / weightedRatingCount : null;

  const lastUpdatedDates = dedupeList(appraisers.map(appraiser => appraiser.metadata?.lastUpdated), 3)
    .map(date => ({ raw: date, time: new Date(date).getTime() }))
    .filter(entry => !Number.isNaN(entry.time))
    .sort((a, b) => b.time - a.time);
  const freshestUpdate = lastUpdatedDates.length ? formatDateLabel(lastUpdatedDates[0].raw) : null;

  const experienceHighlights = dedupeList(appraisers.map(appraiser => appraiser.business?.yearsInBusiness), 3);
  const topSpecialties = dedupeList(appraisers.flatMap(appraiser => appraiser.expertise?.specialties || []), 8);
  const topServices = dedupeList(appraisers.flatMap(appraiser => appraiser.expertise?.services || []), 6);
  const pricingExamples = dedupeList(appraisers.map(appraiser => appraiser.business?.pricing), 3);

  const summaryParagraph = appraisers.length
    ? buildSummaryParagraph(cityDisplayName, appraisers, topSpecialties, topServices, averageRating, totalReviews)
    : `We're actively curating certified partners in ${cityDisplayName}. Request an appraisal to be matched with the closest USPAP-compliant specialist in our national network.`;

  const heroSection = createHeroSection(cityDisplayName, summaryParagraph, topSpecialties, topServices);
  const statsSection = appraisers.length
    ? createStatsSection(appraisers.length, averageRating, totalReviews, freshestUpdate, experienceHighlights)
    : '';
  const topAppraisersSection = appraisers.length ? buildTopAppraisersSection(appraisers, cityDisplayName) : '';
  const appraiserCards = createAppraiserCards(appraisers, cityMeta.slug);
  const cardsSection = appraiserCards
    ? `
      <section class="space-y-6">
        <div class="space-y-3">
          <h2 class="text-2xl font-semibold text-gray-900">Directory profiles (${appraisers.length})</h2>
          <p class="text-gray-700 leading-relaxed">Review contact details, specialties, and appointment options for trusted art appraisal firms serving ${escapeHtml(cityDisplayName)}.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${appraiserCards}
        </div>
      </section>
    `
    : `
      <section class="space-y-4">
        <h2 class="text-2xl font-semibold text-gray-900">Directory update in progress</h2>
        <p class="text-gray-700 leading-relaxed">
          Our research team is verifying art appraisal partners in ${escapeHtml(cityDisplayName)}. Submit your request and we'll connect you with the closest specialist while this roster is finalized.
        </p>
      </section>
    `;

  const relatedCities = buildRelatedCitiesSection(selectRelatedCities(allCities, cityMeta));
  const faqSection = buildFaqSection(cityDisplayName, topServices, pricingExamples);

  const rootContent = `
    <div id="location-content" class="container mx-auto px-4 py-8 mt-16">
      <div class="max-w-6xl mx-auto space-y-10">
        ${heroSection}
        ${statsSection}
        ${topAppraisersSection}
        ${cardsSection}
        ${relatedCities}
        ${faqSection.html}
      </div>
    </div>
  `;

  const dom = new JSDOM(templateHtml);
  const { document } = dom.window;
  const head = document.head || document.querySelector('head');

  const canonicalPath = `/location/${encodeURIComponent(cityMeta.slug)}/`;
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  const description = appraisers.length
    ? `Discover ${appraisers.length} certified art appraisers near you in ${cityDisplayName}. Compare specialties, ratings, pricing insights, and contact details to book a USPAP-compliant valuation.`
    : `We're onboarding art appraisal partners near ${cityDisplayName}. Request an estimate and our team will introduce you to a certified specialist from the Appraisily network.`;
  const ogImage = normalizeImageUrl(appraisers.find(appraiser => appraiser.imageUrl)?.imageUrl || FALLBACK_IMAGE);

  document.title = `Art Appraisers Near ${cityDisplayName} | Local Art Appraisal Services`;

  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', description);

  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonicalUrl);

  const upsertMeta = (attribute, key, value) => {
    if (!value) return;
    let meta = document.querySelector(`meta[${attribute}="${key}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, key);
      head.appendChild(meta);
    }
    meta.setAttribute('content', value);
  };

  upsertMeta('property', 'og:title', document.title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:image', ogImage);
  upsertMeta('property', 'og:type', 'website');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', document.title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', ogImage);
  upsertMeta('name', 'twitter:url', canonicalUrl);

  document.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.parentNode.removeChild(node));
  const schemaScript = document.createElement('script');
  schemaScript.setAttribute('type', 'application/ld+json');
  const schemas = buildSchemas(cityDisplayName, canonicalUrl, appraisers, faqSection.schema);
  schemaScript.textContent = JSON.stringify(schemas, null, 2);
  head.appendChild(schemaScript);

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = rootContent;
  } else {
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    newRoot.innerHTML = rootContent;
    const body = document.body || document.querySelector('body');
    if (body) {
      body.insertBefore(newRoot, body.firstChild);
    }
  }

  return dom.serialize();
}

async function main() {
  try {
    if (!fs.existsSync(DIST_DIR)) {
      throw new Error('dist directory not found. Run the React build before generating location pages.');
    }
    if (!fs.existsSync(TEMPLATE_FILE)) {
      throw new Error('Template index.html not found in dist/.');
    }
    if (!fs.existsSync(CITIES_FILE)) {
      throw new Error('Cities data file is missing. Cannot generate location pages.');
    }
    if (!fs.existsSync(STANDARDIZED_DIR)) {
      throw new Error('Standardized data directory is missing. Run the data standardization script first.');
    }

    const templateHtml = fs.readFileSync(TEMPLATE_FILE, 'utf8');
    const citiesData = fs.readJsonSync(CITIES_FILE);
    const cities = Array.isArray(citiesData?.cities) ? citiesData.cities : [];

    if (!cities.length) {
      log('No cities found in cities.json. Nothing to generate.', 'warning');
      return;
    }

    let generatedCount = 0;

    for (const city of cities) {
      const citySlug = city.slug;
      const locationFile = path.join(STANDARDIZED_DIR, `${citySlug}.json`);
      if (!fs.existsSync(locationFile)) {
        log(`Skipping ${citySlug}: standardized data not found.`, 'warning');
        continue;
      }

      const locationData = fs.readJsonSync(locationFile);
      const html = generateLocationPage(city, locationData, templateHtml, cities);

      const outputDir = path.join(DIST_DIR, 'location', citySlug);
      fs.ensureDirSync(outputDir);
      fs.writeFileSync(path.join(outputDir, 'index.html'), html);

      log(`Generated location page for ${city.name}, ${city.state}`, 'success');
      generatedCount++;
    }

    log(`Completed location page generation (${generatedCount} pages)`, 'success');
  } catch (error) {
    log(`Failed to generate location pages: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
