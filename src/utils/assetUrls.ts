import { ASSET_HOST, DEFAULT_PLACEHOLDER_IMAGE } from '../config/assets';

const PLACEHOLDER_PATTERNS = [
  /(?:^|[/_-])placeholder(?:[._/-]|$)/i,
  /default-favicon/i,
  /logo-default/i,
  /\/favicon(?:[./?_-]|$)/i,
  /\.ico(?:[?#]|$)/i,
];

export function isPlaceholderImageUrl(input?: string | null): boolean {
  const url = String(input || '').trim();
  return !url || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(url));
}

export function normalizeProviderImageUrl(input?: string | null): string {
  const url = String(input || '').trim();
  if (isPlaceholderImageUrl(url)) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return '';
    if (parsed.origin !== new URL(ASSET_HOST).origin) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

export function normalizeAssetUrl(input?: string | null): string {
  const url = String(input || '').trim();
  if (!url) return DEFAULT_PLACEHOLDER_IMAGE;

  if (url.startsWith('https://placehold.co')) return DEFAULT_PLACEHOLDER_IMAGE;

  if (url === '/placeholder-image.jpg') return DEFAULT_PLACEHOLDER_IMAGE;

  if (url.startsWith('/') && !url.startsWith('//')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && parsed.origin === new URL(ASSET_HOST).origin) return url;
  } catch {
    // Malformed values use the intentional first-party placeholder.
  }

  return DEFAULT_PLACEHOLDER_IMAGE;
}
