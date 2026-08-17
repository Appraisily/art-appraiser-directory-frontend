#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGIN = 'https://art-appraisers-directory.appraisily.com';
const ANTIQUE = 'https://antique-appraiser-directory.appraisily.com';
const ANTIQUE_LOCATION_ROOT = '/srv/repos/frontends/antique-appraiser-directory-frontend/public_site/location';

const STATE_ABBR = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
};

const PROVIDERS_BY_CITY = {
  boston: 'afp-art-consulting-llc-fine-art-consulting-appraisals-research-writing-and-collections-man',
  houston: 'heidi-vaughan-ma-isa-am',
  'los-angeles': 'open-to-the-public',
  'new-york': 'st-lifer-art-inc-international-art-appraiser',
  philadelphia: 'sarah-ann-wilson-art-services',
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function listedAppraiser(provider) {
  return {
    name: provider.name,
    url: `${ORIGIN}/appraiser/${provider.slug}/`,
    slug: provider.slug,
    image: provider.image,
    description: provider.description,
    publicRouteAvailable: true,
  };
}

function locationRecord(city, listed, generatedAt) {
  return {
    slug: city.slug,
    url: `${ORIGIN}/location/${city.slug}/`,
    name: `Art appraisers in ${city.name}, ${city.state}`,
    description: city.description,
    numberOfListedAppraisers: listed.length,
    listedAppraisers: listed,
    source: {
      type: 'public_site_html_json_ld',
      route: `/location/${city.slug}/`,
    },
    generatedAt,
  };
}

function renderCity(city) {
  const url = `${ORIGIN}/location/${city.slug}/`;
  const antiqueUrl = city.antiqueUrl;
  const antiqueLabel = city.hasAntiquePage
    ? `antique appraiser page for ${city.name}`
    : 'Antique Appraisers Directory';
  const faqs = [
    {
      q: `What does a fine-art appraisal cover in ${city.name}?`,
      a: `A fine-art appraisal in ${city.name} covers authorship, medium, date, condition, provenance, and comparable sales for paintings, sculpture, prints, photography, or works on paper. It does not replace an antique, jewelry, or household-contents appraisal.`,
    },
    {
      q: `When should I meet a ${city.name} art appraiser in person?`,
      a: city.inspection,
    },
    {
      q: 'Can I get a signed art appraisal from photos instead of a local visit?',
      a: `Yes. Appraisily can prepare a signed online art appraisal from photographs and documentation when the intended use allows it. Use a local ${city.name} specialist when the object cannot be photographed clearly or an in-person condition review is required.`,
    },
    {
      q: `How is this page different from the antique directory for ${city.name}?`,
      a: city.hasAntiquePage
        ? `This page is limited to fine-art specialists and fine-art decisions. Furniture, silver, decorative arts, and mixed estate contents belong on the antique directory ${city.name} page.`
        : `This page is limited to fine-art specialists and fine-art decisions. Furniture, silver, decorative arts, and mixed estate contents belong on the Antique Appraisers Directory.`,
    },
  ];
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Art appraisers in ${city.name}, ${city.state}`,
    description: city.description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: city.listed.length,
      itemListElement: city.listed.map((provider, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: provider.name,
        url: provider.url,
      })),
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  };
  const listingSection = city.listed.length
    ? `<section>
        <h2>Reviewed ${escapeHtml(city.name)} fine-art listing</h2>
        ${city.listed.map((provider) => `<article class="card">
          <h3>${escapeHtml(provider.name)}</h3>
          <p>${escapeHtml(provider.description)}</p>
          <p><a href="${provider.url}">View the reviewed ${escapeHtml(provider.name)} profile</a></p>
        </article>`).join('\n        ')}
        <p class="meta">One reviewed public listing is currently published for ${escapeHtml(city.name)}. Additional fine-art specialists are added only after official-source review.</p>
      </section>`
    : `<section>
        <h2>Reviewed ${escapeHtml(city.name)} fine-art listing</h2>
        <p>No official-source-reviewed fine-art specialist is currently published for ${escapeHtml(city.name)}. This page still explains the local fine-art decision so you can choose an online report or wait for a reviewed local listing.</p>
        <p>Do not treat an unpublished city as a hidden roster. Suggest a correction only when you can point to the provider's official source.</p>
        <p class="meta">Reviewed listings are added only after identity, primary location, and fine-art appraisal work are confirmed.</p>
      </section>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(city.title)}</title>
    <meta name="description" content="${escapeHtml(city.description)}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#5b1f2a">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/png" href="https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(city.title)}">
    <meta property="og:description" content="${escapeHtml(city.description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png">
    <script type="application/ld+json">${JSON.stringify(collectionSchema)}</script>
    <style>
      body { margin: 0; color: #111827; background: #fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      header, main, footer { width: min(1040px, calc(100% - 32px)); margin: 0 auto; }
      header { display: flex; align-items: center; justify-content: space-between; gap: 20px; min-height: 64px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
      nav a { display: inline-flex; align-items: center; min-height: 44px; }
      main { padding: 40px 0 64px; }
      h1 { max-width: 780px; margin: 0 0 12px; font-size: 36px; line-height: 1.15; }
      h2 { margin: 36px 0 8px; font-size: 22px; }
      h3 { margin: 20px 0 8px; font-size: 18px; }
      p, li { max-width: 760px; color: #4b5563; line-height: 1.65; }
      a { color: #0f766e; }
      .card { margin: 24px 0; padding: 20px; border: 1px solid #e5e7eb; background: #f8fafc; }
      .meta { color: #64748b; font-size: 14px; }
      footer { padding: 24px 0 40px; border-top: 1px solid #e5e7eb; }
    </style>
    <script type="application/ld+json" data-appraisily-schema="faq-visible">${JSON.stringify(faqSchema)}</script>
  </head>
  <body>
    <header>
      <a href="/">Art Appraisers Directory</a>
      <nav class="meta"><a href="/location/">Locations</a> · <a href="/appraiser/">Appraisers</a> · <a href="/methodology/">Methodology</a></nav>
    </header>
    <main>
      <p class="meta">Reviewed fine-art location</p>
      <h1>Art appraisers in ${escapeHtml(city.name)}, ${escapeHtml(city.state)}</h1>
      <p>This page is for paintings, sculpture, prints, photography, and works on paper in ${escapeHtml(city.name)}. It is not a furniture, silver, jewelry, or mixed-estate directory. Those objects belong on the <a href="${antiqueUrl}">${escapeHtml(antiqueLabel)}</a>.</p>
      <p>The directory publishes a ${escapeHtml(city.name)} listing only after an official source confirms the provider's identity, primary location, and fine-art appraisal work. Ratings are not published. Confirm credentials, fees, availability, and report scope directly before you engage anyone.</p>

      <section>
        <h2>What a ${escapeHtml(city.name)} fine-art appraisal should decide</h2>
        <p>${escapeHtml(city.collecting)}</p>
        <p>A useful local report names the intended use, the type of value, the effective date, and the comparables that support the conclusion. If a page only repeats “art appraiser near me,” it is not helping you choose a specialist.</p>
        <p>${escapeHtml(city.purpose)}</p>
      </section>

      <section>
        <h2>Local inspection versus a signed online report</h2>
        <p>${escapeHtml(city.inspection)}</p>
        <p>Appraisily remains the online option when photographs and documentation are enough for insurance, estate, or donation use. A local ${escapeHtml(city.name)} specialist is the better next step when the object cannot be documented clearly or the assignment requires an in-person inspection.</p>
        <p><a href="https://appraisily.com/start?utm_source=art_directory&amp;utm_medium=city&amp;utm_campaign=${escapeHtml(city.slug)}">Start an online art appraisal</a> · <a href="https://appraisily.com/sample-reports/professional?utm_source=art_directory&amp;utm_medium=city&amp;utm_campaign=${escapeHtml(city.slug)}">View a sample report</a></p>
      </section>

      <section>
        <h2>How to choose a fine-art appraiser</h2>
        <p>Look for a written specialty in the medium you own, a public professional designation in fine art when the assignment requires it, and a report that follows USPAP for the intended use. AAA, ASA, and ISA fine-art credentials are useful signals only when they match the object in front of you.</p>
        <p>Ask what the fee includes, whether travel or studio inspection is required, how long comparable research takes, and whether the report can be used for insurance, estate, or donation purposes. Do not treat a directory listing as a recommendation or an employment relationship with Appraisily.</p>
      </section>

      ${listingSection}

      <section>
        <h2>Frequently asked questions</h2>
        ${faqs.map((faq) => `<h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p>`).join('\n        ')}
      </section>
    </main>
    <footer class="meta">
      <a href="/get-listed/">Correct or suggest a listing</a> ·
      <a href="${antiqueUrl}">${escapeHtml(city.hasAntiquePage ? `Antique appraisers in ${city.name}` : 'Antique Appraisers Directory')}</a> ·
      An Appraisily directory
    </footer>
  </body>
</html>
`;
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const generatedAt = new Date().toISOString();
  const [citiesFile, notesFile, appraisersFile] = await Promise.all([
    fs.readFile(path.join(ROOT, 'src/data/cities.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'data/art-city-page-notes.json'), 'utf8').then(JSON.parse),
    fs.readFile(path.join(ROOT, 'public_site/appraisers.json'), 'utf8').then(JSON.parse),
  ]);
  const existingSlugs = (await fs.readdir(path.join(ROOT, 'public_site', 'location'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const cityBySlug = new Map(citiesFile.cities.map((city) => [city.slug, city]));
  const providerBySlug = new Map((appraisersFile.appraisers || []).map((provider) => [provider.slug, provider]));
  const locations = [];

  for (const slug of existingSlugs) {
    const registryCity = cityBySlug.get(slug);
    const notes = notesFile.cities[slug];
    if (!registryCity) throw new Error(`Missing cities.json row for ${slug}`);
    if (!notes) throw new Error(`Missing art-city-page-notes.json row for ${slug}`);
    const providerSlug = PROVIDERS_BY_CITY[slug];
    const provider = providerSlug ? providerBySlug.get(providerSlug) : null;
    if (providerSlug && !provider) throw new Error(`Missing published provider ${providerSlug} for ${slug}`);
    const listed = provider ? [listedAppraiser(provider)] : [];
    const hasAntiquePage = await pathExists(path.join(ANTIQUE_LOCATION_ROOT, slug, 'index.html'));
    const city = {
      slug,
      name: registryCity.name,
      state: registryCity.state,
      region: STATE_ABBR[registryCity.state] || '',
      collecting: notes.collecting,
      inspection: notes.inspection,
      purpose: notes.purpose,
      listed,
      hasAntiquePage,
      antiqueUrl: hasAntiquePage ? `${ANTIQUE}/location/${slug}/` : `${ANTIQUE}/location/`,
      title: `Art Appraisers in ${registryCity.name}, ${registryCity.state} | Fine Art Directory`,
      description: listed.length
        ? `Find reviewed fine-art appraisers in ${registryCity.name} for paintings, sculpture, prints, and photography. Compare a source-checked local specialist with a signed online report.`
        : `Fine-art appraisal guidance for ${registryCity.name}: paintings, sculpture, prints, and photography. Compare a signed online report with a future reviewed local listing.`,
    };
    const directory = path.join(ROOT, 'public_site', 'location', slug);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'index.html'), renderCity(city), 'utf8');
    const record = locationRecord(city, listed, generatedAt);
    delete record.generatedAt;
    await fs.writeFile(path.join(directory, 'index.json'), `${JSON.stringify({
      title: record.name,
      kind: 'art',
      baseUrl: ORIGIN,
      generatedAt,
      location: record,
    }, null, 2)}\n`, 'utf8');
    locations.push(record);
  }

  const locationsFeed = {
    title: 'Art Appraisers Directory location pages',
    kind: 'art',
    baseUrl: ORIGIN,
    generatedAt,
    count: locations.length,
    locations,
  };
  await fs.writeFile(
    path.join(ROOT, 'public_site', 'locations.json'),
    `${JSON.stringify(locationsFeed, null, 2)}\n`,
    'utf8',
  );

  const directoryPath = path.join(ROOT, 'public_site', 'directory.json');
  const directory = JSON.parse(await fs.readFile(directoryPath, 'utf8'));
  directory.generatedAt = generatedAt;
  directory.counts = {
    appraisers: (directory.appraisers || []).length,
    locations: locations.length,
  };
  directory.locations = locations;
  await fs.writeFile(directoryPath, `${JSON.stringify(directory, null, 2)}\n`, 'utf8');

  const cityDecisions = {
    version: 3,
    decidedAt: generatedAt.slice(0, 10),
    decision: 'restore_art_only_city_pages',
    policy: 'A city page is publishable when it has sourced city-level fine-art decision value independent of any provider profile, stays art-only, and links antiques to the antique directory. A reviewed provider is listed only after official-source review. Repeated provider facts and generic city prose do not qualify.',
    sourceEvidence: [
      {
        type: 'operator_decision',
        path: '/srv/manager/projects/art-directory-restore-20260816/decision.md',
        finding: 'The operator restored the standalone Art host and the existing Art city inventory as art-only decision pages.',
      },
    ],
    cities: locations.map((location) => ({
      slug: location.slug,
      status: 'retained',
      terminalStatus: 200,
      providerSlug: location.listedAppraisers[0]?.slug || '',
      reason: location.listedAppraisers.length
        ? `Art-only ${location.slug} decision page with a reviewed fine-art provider and independent local appraisal guidance.`
        : `Art-only ${location.slug} decision page with independent local appraisal guidance and no reviewed local listing yet.`,
    })),
  };
  await fs.writeFile(
    path.join(ROOT, 'data/city-publication-decisions.json'),
    `${JSON.stringify(cityDecisions, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify({
    action: 'wrote-art-only-city-pages',
    cities: locations.length,
    withProviders: locations.filter((location) => location.numberOfListedAppraisers > 0).length,
    withoutProviders: locations.filter((location) => location.numberOfListedAppraisers === 0).length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
