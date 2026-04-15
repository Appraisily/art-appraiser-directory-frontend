#!/usr/bin/env node

/**
 * Generate Homepage
 *
 * Builds rich static HTML for the homepage so that Search Console receives
 * an indexable, content-heavy page with appraiser listings, city directories,
 * and full SEO metadata.
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
const FALLBACK_IMAGE = 'https://assets.appraisily.com/assets/directory/placeholder.jpg';

const HOME_TITLE = 'Art Appraisers Directory | Compare Certified Art Appraisers Near You | Appraisily';
const HOME_DESCRIPTION = 'Discover certified art appraisers near you. Compare expertise, pricing, and verified reviews for valuations, authentication, and estate services. Browse by city or specialty.';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let colored = message;
  switch (type) {
    case 'success': colored = chalk.green(message); break;
    case 'warning': colored = chalk.yellow(message); break;
    case 'error': colored = chalk.red(message); break;
    default: colored = chalk.blue(message);
  }
  console.log(`[${timestamp}] ${colored}`);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
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

function normalizeImageUrl(input = '') {
  const url = String(input || '').trim();
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `https://assets.appraisily.com${url}`;
  return FALLBACK_IMAGE;
}

function buildAbsoluteUrl(pathname = '') {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const base = DIRECTORY_DOMAIN.endsWith('/') ? DIRECTORY_DOMAIN : `${DIRECTORY_DOMAIN}/`;
  const normalized = pathname.replace(/^\/+/, '');
  return normalized ? `${base}${normalized}` : DIRECTORY_DOMAIN;
}

function loadCities() {
  if (!fs.existsSync(CITIES_FILE)) {
    log('cities.json not found, using empty list', 'warning');
    return [];
  }
  try {
    const raw = fs.readJsonSync(CITIES_FILE);
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    log(`Failed to load cities.json: ${err.message}`, 'warning');
    return [];
  }
}

function loadAllAppraisers() {
  if (!fs.existsSync(STANDARDIZED_DIR)) {
    log('Standardized data directory not found', 'warning');
    return [];
  }

  const appraisers = [];
  const files = fs.readdirSync(STANDARDIZED_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    try {
      const cityData = fs.readJsonSync(path.join(STANDARDIZED_DIR, file));
      const citySlug = file.replace('.json', '');
      if (Array.isArray(cityData.appraisers)) {
        for (const appraiser of cityData.appraisers) {
          appraisers.push({
            ...appraiser,
            citySlug,
            cityName: cityData.city || cityData.displayName || citySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            state: cityData.state || appraiser.state || '',
          });
        }
      }
    } catch (err) {
      log(`Failed to load ${file}: ${err.message}`, 'warning');
    }
  }

  log(`Loaded ${appraisers.length} appraisers from ${files.length} cities`, 'info');
  return appraisers;
}

function buildHomepageSchema(appraisers, cities) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Art Appraisers Directory",
    "url": DIRECTORY_DOMAIN,
    "description": HOME_DESCRIPTION,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${DIRECTORY_DOMAIN}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    "about": {
      "@type": "Service",
      "name": "Art Appraisal Services",
      "serviceType": "Art Appraisal",
      "areaServed": {
        "@type": "Country",
        "name": "United States"
      },
      "provider": appraisers.slice(0, 20).map(a => ({
        "@type": "ProfessionalService",
        "name": a.businessName || a.name,
        "url": buildAbsoluteUrl(`/appraiser/${a.id || a.slug}/`),
        "address": {
          "@type": "PostalAddress",
          "addressLocality": a.cityName,
          "addressRegion": a.state || undefined,
          "addressCountry": "US"
        }
      }))
    }
  };
}

function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Appraisily Art Appraisers Directory",
    "url": DIRECTORY_DOMAIN,
    "logo": "https://assets.appraisily.com/assets/directory/WebPage/logo_new.png",
    "sameAs": [
      "https://www.facebook.com/appraisily",
      "https://twitter.com/appraisily",
      "https://www.linkedin.com/company/appraisily"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-888-272-7247",
      "contactType": "customer service",
      "availableLanguage": ["English"]
    }
  };
}

function buildBreadcrumbListSchema(cities) {
  const topCities = cities.slice(0, 12);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": DIRECTORY_DOMAIN
      },
      ...topCities.map((city, idx) => ({
        "@type": "ListItem",
        "position": idx + 2,
        "name": `Art Appraisers in ${city.displayName || city.name || city.slug}`,
        "item": buildAbsoluteUrl(`/location/${city.slug}/`)
      }))
    ]
  };
}

function buildFaqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I find a certified art appraiser near me?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Use our Art Appraisers Directory to search by city or browse our comprehensive list of certified professionals. Filter by specialty, read verified reviews, and compare pricing models to find the right appraiser for your needs."
        }
      },
      {
        "@type": "Question",
        "name": "What does an art appraisal cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Art appraisal costs vary depending on the complexity of the item, the purpose of the appraisal, and the appraiser's experience. Many appraisers charge either a flat fee per item ($100-$500+) or an hourly rate ($100-$350/hour). Browse profiles in our directory to compare pricing."
        }
      },
      {
        "@type": "Question",
        "name": "What services do art appraisers offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Art appraisers offer valuations for insurance purposes, estate planning, charitable donations, sales, and purchases. Many also provide authentication services, provenance research, collection management consultations, and damage/loss assessments."
        }
      },
      {
        "@type": "Question",
        "name": "How do I know if an art appraiser is certified?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Look for appraisers with credentials from recognized organizations like ISA (International Society of Appraisers), ASA (American Society of Appraisers), or AAA (Appraisers Association of America). Our directory lists professionals with verified credentials and specializations."
        }
      }
    ]
  };
}

/**
 * Build rich homepage content with city listings and featured appraisers
 */
function buildHomepageContent(cities, allAppraisers) {
  const topCities = cities.slice(0, 16);
  const featuredAppraisers = allAppraisers
    .filter(a => !a.rating || a.rating >= 4.0)
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 12);

  // Build city grid
  const cityGridHtml = topCities.map(city => {
    const citySlug = city.slug;
    const cityName = city.displayName || city.name || citySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const stateCode = city.state || '';
    const appraiserCount = allAppraisers.filter(a => a.citySlug === citySlug).length;
    const cityImage = city.imageUrl || FALLBACK_IMAGE;

    return `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <a href="/location/${citySlug}/" class="block" data-gtm-event="city_click" data-gtm-city="${escapeHtml(citySlug)}">
          <div class="relative h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span class="text-4xl font-bold text-blue-700">${escapeHtml(cityName.split(' ')[0])}</span>
          </div>
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900">${escapeHtml(cityName)}</h3>
            <p class="text-sm text-gray-600 mt-1">${appraiserCount} art appraiser${appraiserCount !== 1 ? 's' : ''}${stateCode ? ` in ${escapeHtml(stateCode)}` : ''}</p>
          </div>
        </a>
      </div>`;
  }).join('\n');

  // Build featured appraisers section
  const featuredHtml = featuredAppraisers.map(appraiser => {
    const appraiserSlug = appraiser.id || appraiser.slug;
    const appraiserName = escapeHtml(appraiser.businessName || appraiser.name);
    const appraiserImage = normalizeImageUrl(appraiser.imageUrl || appraiser.image);
    const specialties = (appraiser.specialties || []).slice(0, 3).map(s => escapeHtml(s)).join(', ');
    const rating = appraiser.rating || 5;
    const reviewCount = appraiser.reviewCount || 0;
    const location = [appraiser.cityName, appraiser.state].filter(Boolean).join(', ');

    return `
      <div class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
        <a href="/appraiser/${escapeHtml(appraiserSlug)}/" class="block" data-gtm-event="appraiser_click" data-gtm-appraiser="${escapeHtml(appraiserSlug)}">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
              <img src="${escapeHtml(appraiserImage)}" alt="${appraiserName}" class="w-full h-full object-cover" width="64" height="64" loading="lazy" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900 truncate">${appraiserName}</h3>
              <p class="text-sm text-gray-600 mt-1 truncate">${escapeHtml(location)}</p>
              ${specialties ? `<p class="text-xs text-gray-500 mt-1 truncate">${specialties}</p>` : ''}
              <div class="flex items-center gap-2 mt-2">
                <span class="text-yellow-500 text-sm">★</span>
                <span class="text-sm font-medium text-gray-700">${rating}</span>
                <span class="text-xs text-gray-500">(${reviewCount} review${reviewCount !== 1 ? 's' : ''})</span>
              </div>
            </div>
          </div>
        </a>
      </div>`;
  }).join('\n');

  // Services section
  const servicesHtml = [
    { icon: '🎨', title: 'Insurance Appraisals', desc: 'Get accurate valuations for insurance coverage, ensuring your art and collectibles are properly protected.' },
    { icon: '📋', title: 'Estate Planning', desc: 'Detailed appraisal reports for estate planning, tax purposes, and equitable distribution among heirs.' },
    { icon: '💝', title: 'Donation Appraisals', desc: 'IRS-compliant appraisals for charitable donations and gifts, ensuring proper tax deductions.' },
    { icon: '💰', title: 'Sales & Purchases', desc: 'Fair market value assessments to inform buying and selling decisions for artwork and collectibles.' },
    { icon: '🔍', title: 'Authentication', desc: 'Expert verification of artwork authenticity, provenance research, and attribution analysis.' },
    { icon: '📊', title: 'Damage/Loss Claims', desc: 'Professional assessments for insurance claims related to artwork damage, loss, or theft.' },
  ].map(service => `
    <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div class="text-4xl mb-3">${service.icon}</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">${service.title}</h3>
      <p class="text-sm text-gray-600">${service.desc}</p>
    </div>`).join('\n');

  // Build "How It Works" section
  const howItWorksHtml = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl font-bold text-blue-600">1</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Search by City</h3>
        <p class="text-gray-600">Browse appraisers by location or use our search to find certified professionals near you.</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl font-bold text-blue-600">2</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Compare Experts</h3>
        <p class="text-gray-600">Review credentials, specialties, pricing models, and verified client feedback.</p>
      </div>
      <div class="text-center">
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl font-bold text-blue-600">3</span>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Request Appraisal</h3>
        <p class="text-gray-600">Contact your chosen appraiser directly or start a guided appraisal through Appraisily.</p>
      </div>
    </div>`;

  return `
    <div id="root">
      <div id="homepage-content">
        <!-- Hero Section -->
        <section class="bg-gradient-to-r from-blue-700 to-blue-500 text-white py-16 md:py-24">
          <div class="container mx-auto px-4">
            <div class="max-w-4xl mx-auto text-center">
              <h1 class="text-3xl md:text-5xl font-bold mb-4">${escapeHtml(HOME_TITLE.replace(' | Appraisily', ''))}</h1>
              <p class="text-lg md:text-xl opacity-90 mb-8">${escapeHtml(HOME_DESCRIPTION)}</p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="${CTA_URL}" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block" data-gtm-event="cta_start_appraisal">Start an Appraisal</a>
                <a href="#cities" class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block">Browse Directory</a>
              </div>
            </div>
          </div>
        </section>

        <!-- How It Works -->
        <section class="py-16 bg-gray-50">
          <div class="container mx-auto px-4">
            <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center">How the Art Appraisers Directory Works</h2>
            ${howItWorksHtml}
          </div>
        </section>

        <!-- Services Section -->
        <section class="py-16">
          <div class="container mx-auto px-4">
            <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center">Art Appraisal Services</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${servicesHtml}
            </div>
          </div>
        </section>

        <!-- Featured Cities -->
        <section id="cities" class="py-16 bg-gray-50">
          <div class="container mx-auto px-4">
            <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center">Browse Art Appraisers by City</h2>
            <p class="text-gray-600 text-center mb-10 max-w-2xl mx-auto">Find certified art appraisers in major cities across the United States. Click a city to view local professionals and compare services.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              ${cityGridHtml}
            </div>
          </div>
        </section>

        <!-- Featured Appraisers -->
        <section class="py-16">
          <div class="container mx-auto px-4">
            <h2 class="text-2xl md:text-3xl font-bold mb-4 text-center">Top-Rated Art Appraisers</h2>
            <p class="text-gray-600 text-center mb-10 max-w-2xl mx-auto">Browse highly-rated certified appraisers with proven expertise and client satisfaction.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${featuredHtml}
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="py-16 bg-blue-700 text-white">
          <div class="container mx-auto px-4 text-center">
            <h2 class="text-2xl md:text-3xl font-bold mb-4">Need an Art Appraisal?</h2>
            <p class="text-lg opacity-90 mb-8 max-w-2xl mx-auto">Get a professional appraisal from certified experts. Start your appraisal online or find a local appraiser in our directory.</p>
            <a href="${CTA_URL}" class="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block" data-gtm-event="cta_get_appraisal">Get an Appraisal</a>
          </div>
        </section>

        <!-- FAQ Section -->
        <section class="py-16 bg-gray-50">
          <div class="container mx-auto px-4 max-w-4xl">
            <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
            <div class="space-y-6">
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">How do I find a certified art appraiser near me?</h3>
                <p class="text-gray-700">Use our Art Appraisers Directory to search by city or browse our comprehensive list of certified professionals. Filter by specialty, read verified reviews, and compare pricing models to find the right appraiser for your needs.</p>
              </div>
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">What does an art appraisal cost?</h3>
                <p class="text-gray-700">Art appraisal costs vary depending on the complexity of the item, the purpose of the appraisal, and the appraiser's experience. Many appraisers charge either a flat fee per item ($100-$500+) or an hourly rate ($100-$350/hour). Browse profiles in our directory to compare pricing.</p>
              </div>
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">What services do art appraisers offer?</h3>
                <p class="text-gray-700">Art appraisers offer valuations for insurance purposes, estate planning, charitable donations, sales, and purchases. Many also provide authentication services, provenance research, collection management consultations, and damage/loss assessments.</p>
              </div>
              <div class="bg-white p-6 rounded-lg shadow-sm">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">How do I know if an art appraiser is certified?</h3>
                <p class="text-gray-700">Look for appraisers with credentials from recognized organizations like ISA (International Society of Appraisers), ASA (American Society of Appraisers), or AAA (Appraisers Association of America). Our directory lists professionals with verified credentials and specializations.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>`;
}

async function generateHomepage() {
  log('🏠 Generating rich static homepage...', 'info');

  if (!fs.existsSync(TEMPLATE_FILE)) {
    log('Template index.html not found. Run `vite build` first.', 'error');
    process.exit(1);
  }

  const templateHtml = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const dom = new JSDOM(templateHtml);
  const { document } = dom.window;

  // Load data
  const cities = loadCities();
  const allAppraisers = loadAllAppraisers();

  // Update title
  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleEl.textContent = HOME_TITLE;
  }

  // Update meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', HOME_DESCRIPTION);
  }

  // Update canonical link
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute('href', DIRECTORY_DOMAIN);
  }

  // Add robots meta tag
  let robotsMeta = document.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.setAttribute('content', 'index, follow');

  // Open Graph tags (create if missing)
  const setOrCreateMeta = (selector, attr, content) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      if (selector.includes('property=')) {
        el.setAttribute('property', attr);
      } else {
        el.setAttribute('name', attr);
      }
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setOrCreateMeta('meta[property="og:title"]', 'og:title', HOME_TITLE);
  setOrCreateMeta('meta[property="og:description"]', 'og:description', HOME_DESCRIPTION);
  setOrCreateMeta('meta[property="og:url"]', 'og:url', DIRECTORY_DOMAIN);
  setOrCreateMeta('meta[property="og:type"]', 'og:type', 'website');

  // Twitter Card tags (create if missing)
  setOrCreateMeta('meta[name="twitter:title"]', 'twitter:title', HOME_TITLE);
  setOrCreateMeta('meta[name="twitter:description"]', 'twitter:description', HOME_DESCRIPTION);
  setOrCreateMeta('meta[name="twitter:url"]', 'twitter:url', DIRECTORY_DOMAIN);

  // Build and inject structured data
  const schemas = [
    buildHomepageSchema(allAppraisers, cities),
    buildOrganizationSchema(),
    buildBreadcrumbListSchema(cities),
    buildFaqSchema(),
  ];

  // Remove existing scripts to avoid duplicates
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

  for (const schema of schemas) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  // Replace empty root with rich content
  const rootEl = document.querySelector('#root');
  if (rootEl) {
    rootEl.outerHTML = buildHomepageContent(cities, allAppraisers);
  }

  // Add Google Site Verification if env var is set
  const gsv = process.env.VITE_GOOGLE_SITE_VERIFICATION;
  if (gsv) {
    let gsvMeta = document.querySelector('meta[name="google-site-verification"]');
    if (!gsvMeta) {
      gsvMeta = document.createElement('meta');
      gsvMeta.setAttribute('name', 'google-site-verification');
      document.head.appendChild(gsvMeta);
    }
    gsvMeta.setAttribute('content', gsv);
    log('✅ Google Site Verification meta tag added', 'success');
  }

  // Serialize and write
  const outputHtml = dom.serialize();
  fs.writeFileSync(TEMPLATE_FILE, outputHtml, 'utf8');

  log('✅ Homepage generated successfully with rich static content', 'success');
  log(`📊 Total appraisers listed: ${allAppraisers.length}`, 'info');
  log(`🏙️ Cities featured: ${Math.min(cities.length, 16)}`, 'info');
}

// Run
generateHomepage().catch(err => {
  log(`❌ Failed to generate homepage: ${err.message}`, 'error');
  console.error(err);
  process.exit(1);
});
