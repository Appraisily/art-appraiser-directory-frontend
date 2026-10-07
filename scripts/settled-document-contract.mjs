import assert from 'node:assert/strict';

// This function also runs unchanged inside agent-browser. Keep it DOM-only.
export function captureDocument(document, canonicalOrigin) {
  const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const flatten = (value, result = []) => {
    if (Array.isArray(value)) value.forEach((child) => flatten(child, result));
    else if (value && typeof value === 'object') {
      if (value['@type']) result.push(value);
      Object.values(value).forEach((child) => flatten(child, result));
    }
    return result;
  };
  const content = (document.querySelector('main') || document.body).cloneNode(true);
  content.querySelectorAll('script, style, nav, header, footer').forEach((node) => node.remove());
  const schema = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .flatMap((node) => flatten(JSON.parse(node.textContent)));
  const anchors = [...document.querySelectorAll('a[href]')].map((node) => {
    const url = new URL(node.getAttribute('href'), canonicalOrigin);
    // The static telemetry owner may add handoff query parameters, not change destinations.
    if (url.origin === document.location.origin) url.host = new URL(canonicalOrigin).host;
    return { destination: `${url.origin}${url.pathname}${url.hash}`, text: compact(node.textContent) };
  });
  return {
    title: document.title,
    descriptions: [...document.querySelectorAll('meta[name="description"]')].map((node) => node.content),
    canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.href),
    robots: [...document.querySelectorAll('meta[name="robots"]')].map((node) => node.content),
    h1: [...document.querySelectorAll('h1')].map((node) => compact(node.textContent)),
    mainText: compact(content.textContent),
    about: [...document.querySelectorAll('[data-provider-specific-about]')].map((node) => compact(node.textContent)),
    businesses: schema.filter((node) => ['ProfessionalService', 'LocalBusiness'].includes(node['@type'])),
    handoffs: [...document.querySelectorAll('a[href]')].map((node) => new URL(node.getAttribute('href'), canonicalOrigin).href)
      .filter((href) => { const target = new URL(href); return target.origin === 'https://appraisily.com' && target.pathname === '/start'; }),
    anchors,
  };
}

export function assertDocumentParity(initial, rendered, url) {
  for (const [label, state] of [['initial', initial], ['rendered', rendered]]) {
    assert.deepEqual(state.canonicals, [url], `${url}: ${label} must have one self-canonical`);
    assert.equal(state.descriptions.length, 1, `${url}: ${label} must have one description`);
    assert.equal(state.h1.length, 1, `${url}: ${label} must have one H1`);
    assert.equal(state.robots.length, 1, `${url}: ${label} must have one robots owner`);
    assert.doesNotMatch(state.robots[0], /noindex/i, `${url}: published route must be indexable`);
    assert.ok(state.mainText, `${url}: ${label} must contain authored content`);
    if (/\/appraiser\/[^/]+\/$/.test(new URL(url).pathname)) {
      assert.equal(state.businesses.length, 1, `${url}: ${label} must have one provider entity`);
      assert.equal(state.businesses[0].url, url, `${url}: provider schema URL must agree`);
    }
  }
  for (const field of ['title', 'descriptions', 'robots', 'h1', 'mainText', 'about', 'businesses']) {
    assert.deepEqual(rendered[field], initial[field], `${url}: authored ${field} changed after rendering`);
  }
  const destinations = new Set(rendered.anchors.map((anchor) => JSON.stringify(anchor)));
  for (const anchor of initial.anchors) {
    assert.ok(destinations.has(JSON.stringify(anchor)), `${url}: native link disappeared: ${anchor.destination}`);
  }
}

export function assertProviderEvidence(snapshot, record, url) {
  if (record.publicationStatus !== 'verified') return;
  assert.equal(snapshot.about.length, 1, `${url}: reviewed provider-specific facts missing`);
  assert.ok(snapshot.mainText.includes(record.verifiedAt), `${url}: original source-review date missing`);
  const source = new URL(record.sourceUrl);
  assert.ok(snapshot.anchors.some((anchor) => anchor.destination === `${source.origin}${source.pathname}${source.hash}`),
    `${url}: official provider source link missing`);
}

// Support and terminal documents are deliberately excluded from the sitemap.
// Their explicit policies must never relax assertDocumentParity's published gate.
export function assertUnpublishedDocumentParity(initial, rendered, { url, canonical, robots }) {
  assert.ok(/\bnoindex\b/i.test(robots), `${url}: unpublished policy must require noindex`);
  const canonicals = canonical ? [canonical] : [];
  for (const [label, state] of [['initial', initial], ['rendered', rendered]]) {
    assert.deepEqual(state.canonicals, canonicals, `${url}: ${label} canonical ownership differs`);
    assert.deepEqual(state.robots, [robots], `${url}: ${label} robots ownership differs`);
    assert.equal(state.descriptions.length, 1, `${url}: ${label} must have one description`);
    assert.equal(state.h1.length, 1, `${url}: ${label} must have one H1`);
    assert.equal(state.businesses.length, 0, `${url}: unpublished document must not claim a provider entity`);
    assert.ok(state.mainText, `${url}: ${label} must contain authored content`);
  }
  for (const field of ['title', 'descriptions', 'robots', 'h1', 'mainText', 'about', 'businesses']) {
    assert.deepEqual(rendered[field], initial[field], `${url}: authored ${field} changed after rendering`);
  }
  const anchors = new Set(rendered.anchors.map((anchor) => JSON.stringify(anchor)));
  for (const anchor of initial.anchors) {
    assert.ok(anchors.has(JSON.stringify(anchor)), `${url}: native link disappeared: ${anchor.destination}`);
  }
}

export function assertHandoffAttribution(initial, rendered, url) {
  for (const href of initial.handoffs) {
    const original = new URL(href);
    const retained = rendered.handoffs.map((value) => new URL(value)).find((target) =>
      [...original.searchParams].every(([key, value]) => target.searchParams.get(key) === value));
    assert.ok(retained, `${url}: original handoff acquisition parameters changed`);
    assert.equal(retained.searchParams.get('seo_site'), 'art_directory');
    assert.equal(retained.searchParams.get('ref_path'), new URL(url).pathname);
    assert.ok(retained.searchParams.get('journey_id'), `${url}: shared journey ID missing`);
    assert.equal(retained.searchParams.get('appraisily_synthetic'), 'synthetic_browser');
  }
}

export function assertReviewedInventory({ providers, cities, resources, sitemapUrls }) {
  const origin = 'https://art-appraisers-directory.appraisily.com';
  const expected = [
    `${origin}/`, `${origin}/appraiser/`, `${origin}/location/`,
    ...providers.filter((record) => ['verified', 'limited'].includes(record.publicationStatus))
      .map((record) => `${origin}/appraiser/${record.slug}/`),
    ...cities.filter((record) => record.status === 'retained' && record.terminalStatus === 200)
      .map((record) => `${origin}/location/${record.slug}/`),
    ...resources.map((record) => `${origin}${record.path}`),
  ];
  assert.equal(new Set(expected).size, expected.length, 'Reviewed inventory has duplicate canonical URLs');
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Sitemap has duplicate canonical URLs');
  assert.deepEqual([...sitemapUrls].sort(), expected.sort(), 'Sitemap differs from reviewed provider/city/resource inventory');
  return expected.length;
}
