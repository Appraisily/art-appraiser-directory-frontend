#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGIN = 'https://art-appraisers-directory.appraisily.com';
const ANTIQUE = 'https://antique-appraiser-directory.appraisily.com';

const CITIES = [
  {
    slug: 'boston',
    name: 'Boston',
    state: 'Massachusetts',
    region: 'MA',
    providerName: 'AFP Art Consulting, LLC',
    providerSlug: 'afp-art-consulting-llc-fine-art-consulting-appraisals-research-writing-and-collections-man',
    providerSummary: 'AFP Art Consulting is a Boston fine-art appraisal and consulting firm offering USPAP-aligned appraisals, research, advisory, and collection management.',
    market: 'Boston collections often mix colonial portraits, nineteenth-century American painting, modern New England work, and contemporary pieces that moved through local galleries or family estates. The Museum of Fine Arts and the Isabella Stewart Gardner Museum set a high local standard for documentation, condition, and provenance, so a useful appraisal has to treat those same facts as evidence rather than atmosphere.',
    inspection: 'In-person review is most useful in Boston when varnish, lining, craquelure, or a later restoration is hard to read from photographs, or when a work may have been reframed after a New England house move. Photographs are usually enough for a first written opinion when the front, reverse, signature, labels, and damage are all visible.',
    purpose: 'Typical Boston fine-art assignments are insurance scheduling after a Back Bay or Cambridge collection review, estate division when one sibling keeps the painting, and donation support when a work is leaving a private collection for a museum or university.',
  },
  {
    slug: 'houston',
    name: 'Houston',
    state: 'Texas',
    region: 'TX',
    providerName: 'Heidi Vaughan Fine Art',
    providerSlug: 'heidi-vaughan-ma-isa-am',
    providerSummary: 'Heidi Vaughan Fine Art is a Houston art gallery and advisory that provides fine-art appraisals for insurance, estates, donations, and equitable distribution.',
    market: 'Houston collecting is shaped by the Museum of Fine Arts, Houston, the Menil Collection, and a strong market for Texas artists alongside broader American and contemporary work. A local art appraisal should say whether the object is being valued as gallery inventory, a private collection piece, or an estate asset, because those uses change the relevant comparables.',
    inspection: 'Local inspection matters in Houston when large paintings, outdoor sculpture, or works stored in climate-controlled closets cannot be photographed evenly. Heat, humidity, and framing under glass can hide condition issues that a written report still has to describe. Clear daylight photos remain enough for many insurance and donation files.',
    purpose: 'Houston owners usually need a signed report for homeowner or collection insurance, estate planning, equitable distribution, or a charitable donation. Ask whether the report will state replacement value, fair market value, or both, and whether Texas-artist comparables are being used.',
  },
  {
    slug: 'los-angeles',
    name: 'Los Angeles',
    state: 'California',
    region: 'CA',
    providerName: 'Open to the Public',
    providerSlug: 'open-to-the-public',
    providerSummary: 'Open to the Public is a Los Angeles fine-art appraisal and consulting firm specializing in postwar and contemporary art and photography.',
    market: 'Los Angeles fine-art work is often postwar and contemporary painting, photography, prints, and sculpture, with collection histories that pass through galleries, studios, and storage rather than a single family house. LACMA, the Getty, and the local gallery circuit make edition size, printer, and exhibition history as important as a signature.',
    inspection: 'In-person review is most useful in Los Angeles for large contemporary works, photographs with condition or fading questions, and pieces whose labels or edition marks are on the reverse or mount. A complete photo set can still support a written appraisal when those marks, the frame, and any damage are recorded.',
    purpose: 'Los Angeles assignments commonly cover insurance for a growing contemporary collection, estate or divorce division, damage after transit or storage, and donation files. Confirm whether the specialist actually works in postwar art or photography before sending a mid-century print or a recent edition.',
  },
  {
    slug: 'new-york',
    name: 'New York',
    state: 'New York',
    region: 'NY',
    providerName: 'St. Lifer Art, Inc.',
    providerSlug: 'st-lifer-art-inc-international-art-appraiser',
    providerSummary: 'St. Lifer Art is a New York fine-art appraisal firm specializing in nineteenth-, twentieth-, and twenty-first-century paintings, prints, photography, posters, and sculpture.',
    market: 'New York remains the densest U.S. market for auction comparables in paintings, prints, photography, posters, and sculpture. That density helps a careful appraiser, but it also makes a generic “New York art appraiser” page useless unless it says which centuries, media, and intended uses the listing actually covers.',
    inspection: 'Local inspection is worth arranging in New York when a work may go to auction, when condition could change a mid-five-figure estimate, or when multiple objects in one collection need a consistent date and authorship standard. Photographs are often enough for insurance scheduling when the owner can capture the reverse, labels, and close damage.',
    purpose: 'New York reports are commonly written for charitable contribution, estate tax, insurance, and division of property. Ask whether the appraiser will follow USPAP and the intended-use standard you need, and whether the fee is based on a flat project or an hourly research budget.',
  },
  {
    slug: 'philadelphia',
    name: 'Philadelphia',
    state: 'Pennsylvania',
    region: 'PA',
    providerName: 'Wilson Art Services, LLC',
    providerSlug: 'sarah-ann-wilson-art-services',
    providerSummary: 'Wilson Art Services is a Philadelphia fine-art appraisal and consulting practice offering confidential appraisals, collection planning, and advisory services.',
    market: 'Philadelphia collections often include Impressionist and modern paintings, works on paper, and inherited pictures that sat in the same house for decades. The Philadelphia Museum of Art and the Barnes Foundation make condition, framing history, and a clean ownership story more important than a city-name keyword.',
    inspection: 'In-person review is most useful in Philadelphia when a painting has old varnish, an undated restoration, or family lore that needs to be separated from what the object itself shows. A written online appraisal can still be the right first step when photos show the front, reverse, signature, and any tears or overpaint.',
    purpose: 'Philadelphia owners typically need confidential appraisals for insurance, collection planning, downsizing, or donation. Confirm the intended use before the visit so the report does not mix replacement cost with fair market value.',
  },
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCity(city) {
  const url = `${ORIGIN}/location/${city.slug}/`;
  const providerUrl = `${ORIGIN}/appraiser/${city.providerSlug}/`;
  const antiqueUrl = `${ANTIQUE}/location/${city.slug}/`;
  const title = `Art Appraisers in ${city.name}, ${city.state} | Fine Art Directory`;
  const description = `Find reviewed fine-art appraisers in ${city.name} for paintings, sculpture, prints, and photography. Compare a source-checked local specialist with a signed online report.`;
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
      q: `Can I get a signed art appraisal from photos instead of a local visit?`,
      a: `Yes. Appraisily can prepare a signed online art appraisal from photographs and documentation when the intended use allows it. Use a local ${city.name} specialist when the object cannot be photographed clearly or an in-person condition review is required.`,
    },
    {
      q: `How is this page different from the antique directory page for ${city.name}?`,
      a: `This page is limited to fine-art specialists and fine-art decisions. Furniture, silver, decorative arts, and mixed estate contents belong on the antique directory ${city.name} page.`,
    },
  ];
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Art appraisers in ${city.name}, ${city.state}`,
    description,
    url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: 1,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: city.providerName,
          url: providerUrl,
        },
      ],
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

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <meta name="theme-color" content="#5b1f2a">
    <link rel="canonical" href="${url}">
    <link rel="icon" type="image/png" href="https://assets.appraisily.com/logo-exploration/appraisily-logo-2026-07-09/concept-01-monogram-picture-frame.png">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
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
      <p>This page is for paintings, sculpture, prints, photography, and works on paper in ${escapeHtml(city.name)}. It is not a furniture, silver, jewelry, or mixed-estate directory. Those objects belong on the <a href="${antiqueUrl}">antique appraiser page for ${escapeHtml(city.name)}</a>.</p>
      <p>The directory publishes a ${escapeHtml(city.name)} listing only after an official source confirms the provider's identity, primary location, and fine-art appraisal work. Ratings are not published. Confirm credentials, fees, availability, and report scope directly before you engage anyone.</p>

      <section>
        <h2>What a ${escapeHtml(city.name)} fine-art appraisal should decide</h2>
        <p>${escapeHtml(city.market)}</p>
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

      <section>
        <h2>Reviewed ${escapeHtml(city.name)} fine-art listing</h2>
        <article class="card">
          <h3>${escapeHtml(city.providerName)}</h3>
          <p>${escapeHtml(city.providerSummary)}</p>
          <p><a href="${providerUrl}">View the reviewed ${escapeHtml(city.providerName)} profile</a></p>
        </article>
        <p class="meta">One reviewed public listing is currently published for ${escapeHtml(city.name)}. Additional fine-art specialists are added only after official-source review.</p>
      </section>

      <section>
        <h2>Frequently asked questions</h2>
        ${faqs.map((faq) => `<h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p>`).join('\n        ')}
      </section>
    </main>
    <footer class="meta">
      <a href="/get-listed/">Correct or suggest a listing</a> ·
      <a href="${antiqueUrl}">Antique appraisers in ${escapeHtml(city.name)}</a> ·
      An Appraisily directory
    </footer>
  </body>
</html>
`;
}

async function main() {
  for (const city of CITIES) {
    const directory = path.join(ROOT, 'public_site', 'location', city.slug);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'index.html'), renderCity(city), 'utf8');
  }
  console.log(JSON.stringify({
    action: 'wrote-art-only-city-pages',
    cities: CITIES.map((city) => city.slug),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
