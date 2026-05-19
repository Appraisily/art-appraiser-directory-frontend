const TEMPLATED_PRICING = new Set([
  'Initial consultation from $150; comprehensive reports quoted per project.',
  'Desktop valuations start at $95 per item; onsite work billed hourly.',
  'Museum-grade reports from $325; collection reviews offered with custom estimates.',
  'Express photo appraisal $175; full USPAP-compliant documentation priced individually.',
  'Estate packages begin at $450 and include research, inspection, and documentation.',
  'Single-item opinions from $125; multi-piece engagements receive tailored pricing.',
  'Project-based'
]);

const TEMPLATED_EXPERIENCE = new Set([
  'Founded in 2004 with two decades of appraisal expertise.',
  '15+ years providing certified art valuations nationwide.',
  'Established in 2010 and trusted for museum-quality reporting.',
  'Serving collectors since 2007 with USPAP-compliant analyses.',
  'Over 18 years assisting estates, insurers, and private collectors.',
  'Established firm with more than 12 years of specialized appraisal practice.',
  'Established business'
]);

export function isTemplatedPricing(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return TEMPLATED_PRICING.has(value.trim());
}

export function isTemplatedExperience(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return TEMPLATED_EXPERIENCE.has(value.trim());
}

export function hasPlaceholderName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  return /^\[.*\]$/.test(name.trim());
}

export function isTemplatedNotes(notes: unknown, city: string | undefined | null): boolean {
  if (typeof notes !== 'string') return false;
  if (notes.includes('Serving the') && notes.includes('area with professional art appraisal services.')) {
    return true;
  }
  if (city) {
    const cityPattern = `Serving the ${city}`;
    if (notes.startsWith(cityPattern) && notes.endsWith('area with professional art appraisal services.')) {
      return true;
    }
  }
  return false;
}

export function isPlaceholderAbout(about: unknown): boolean {
  if (typeof about !== 'string') return false;
  return about.includes('[') && about.includes(']');
}
