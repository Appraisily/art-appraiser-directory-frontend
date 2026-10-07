const origin = 'https://art-appraisers-directory.appraisily.com';
const providerTypes = new Set(['ProfessionalService', 'LocalBusiness', 'Organization', 'Person']);

export function imageUrls(value) {
  if (Array.isArray(value)) return value.flatMap(imageUrls);
  if (typeof value === 'string') return [value];
  if (value && typeof value === 'object') return imageUrls(value.url || value.contentUrl || value['@id']);
  return [];
}

export function isNonProviderIdentityImage(value) {
  try {
    const url = new URL(value, origin);
    return (url.hostname === 'assets.appraisily.com'
      && url.pathname.startsWith('/logo-exploration/appraisily-logo-'))
      || (url.hostname === new URL(origin).hostname
      && url.pathname.startsWith('/assets/generated-appraiser-profiles/'));
  } catch { return false; }
}

function schemaNodes(value) {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  return [value, ...schemaNodes(value['@graph'])];
}

export function providerIdentityImageFailures(document, profileUrl) {
  const failures = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    const nodes = schemaNodes(JSON.parse(script.textContent));
    for (const node of nodes) {
      if (![node['@type']].flat().some(type => providerTypes.has(type))) continue;
      if (node.url !== profileUrl) continue;
      for (const image of imageUrls(node.image)) {
        if (isNonProviderIdentityImage(image)) failures.push(image);
      }
    }
  }
  return failures;
}
