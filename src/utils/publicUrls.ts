const TRACKING_PARAM_PATTERNS = [
  /^utm_/i,
  /^y_source$/i,
  /^gclid$/i,
  /^gbraid$/i,
  /^wbraid$/i,
  /^fbclid$/i,
  /^msclkid$/i,
  /^dclid$/i,
];

export function sanitizePublicSourceUrl(input?: string | null): string {
  const value = String(input || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM_PATTERNS.some((pattern) => pattern.test(key))) {
        url.searchParams.delete(key);
      }
    }
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}
