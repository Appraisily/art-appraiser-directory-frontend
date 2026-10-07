import { isNonProviderIdentityImage } from './provider-image-identity-contract.mjs';

export function imageLayoutFailures(document) {
  const failures = [];
  for (const image of document.images) {
    const src = image.getAttribute('src') || '';
    const style = image.getAttribute('style') || '';
    const dimensions = Number(image.getAttribute('width')) > 0 && Number(image.getAttribute('height')) > 0;
    const fixedCard = /width:3\.5rem;height:3\.5rem;/.test(style);
    if (!dimensions && !fixedCard) failures.push(`${src}: image space is not reserved`);
    if (!image.hasAttribute('alt')) failures.push(`${src}: missing text-alternative decision`);
    if (/^\/?directory\/assets\/decision-router-(report|screener|local)\.png$/.test(src)) {
      if (image.alt !== '') failures.push(`${src}: decorative card repeats offer text`);
      if (image.getAttribute('loading') !== 'lazy') failures.push(`${src}: noncritical card is not lazy-loaded`);
    }
    if (!image.classList.contains('w-full') || !isNonProviderIdentityImage(src)) continue;
    if (!src.includes('/assets/generated-appraiser-profiles/')) {
      failures.push(`${src}: oversized publisher branding is not a provider illustration`);
      continue;
    }
    if (image.getAttribute('width') !== '1200' || image.getAttribute('height') !== '900') failures.push(`${src}: SVG intrinsic dimensions differ`);
    if (image.alt !== '') failures.push(`${src}: non-likeness artwork must be decorative`);
    if (image.getAttribute('loading') === 'lazy') failures.push(`${src}: above-fold illustration is lazy-loaded`);
    const link = image.closest('a');
    const name = document.querySelector('h1')?.textContent.trim();
    if (!link || link.getAttribute('aria-label') !== `Visit ${name}'s official website`) failures.push(`${src}: illustration link lacks an accurate purpose`);
    const caption = image.closest('div.rounded-lg')?.querySelector('[data-directory-illustration-label]');
    if (!caption?.textContent.includes('not a provider likeness')) failures.push(`${src}: missing visible non-likeness caption`);
  }
  return failures;
}
