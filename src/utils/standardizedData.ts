import { publishedCities } from '../data/publishedCities';
import { normalizeProviderImageUrl } from './assetUrls';
import { sanitizePublicSourceUrl } from './publicUrls';

export interface StandardizedAppraiser {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    formatted: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  business: {
    yearsInBusiness: string;
    hours: Array<{
      day: string;
      hours: string;
    }>;
    pricing: string;
  };
  expertise: {
    specialties: string[];
    certifications: string[];
    services: string[];
  };
  content: {
    about: string;
    notes: string;
  };
  metadata: {
    lastUpdated: string;
    inService: boolean;
  };
}

export interface StandardizedLocation {
  appraisers: StandardizedAppraiser[];
}

interface PublicLocationAppraiser {
  name?: string;
  url?: string;
  slug?: string;
  image?: string;
  description?: string;
  publicRouteAvailable?: boolean;
}

interface PublicLocationEntry {
  slug?: string;
  listedAppraisers?: PublicLocationAppraiser[];
}

interface PublicAppraiserEntry {
  slug?: string;
  url?: string;
  name?: string;
  description?: string;
  image?: string;
  telephone?: string;
  email?: string;
  website?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
  };
  priceRange?: string;
  specialties?: string[];
  services?: string[];
  source?: {
    verifiedAt?: string;
  };
}

interface PublishedRegistry {
  locations: PublicLocationEntry[];
  appraisers: PublicAppraiserEntry[];
}

function getSlugFromProfileUrl(url?: string): string {
  if (!url) return '';
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    const index = segments.indexOf('appraiser');
    return index >= 0 ? segments[index + 1] || '' : '';
  } catch {
    return url.match(/\/appraiser\/([^/?#]+)/)?.[1] || '';
  }
}

function toStandardizedAppraiser(entry: PublicAppraiserEntry): StandardizedAppraiser | null {
  if (!entry.slug || !entry.name || !entry.url) return null;

  const address = entry.address || {};
  const cityState = [address.city, address.region].filter(Boolean).join(', ');
  const formatted = [address.streetAddress, cityState, address.postalCode]
    .filter(Boolean)
    .join(', ');

  return {
    id: entry.slug,
    slug: entry.slug,
    name: entry.name,
    imageUrl: normalizeProviderImageUrl(entry.image),
    address: {
      street: address.streetAddress || '',
      city: address.city || '',
      state: address.region || '',
      zip: address.postalCode || '',
      formatted,
    },
    contact: {
      phone: entry.telephone || '',
      email: entry.email || '',
      website: sanitizePublicSourceUrl(entry.website),
    },
    business: {
      yearsInBusiness: '',
      hours: [],
      pricing: entry.priceRange || '',
    },
    expertise: {
      specialties: entry.specialties || [],
      certifications: [],
      services: entry.services || [],
    },
    content: {
      about: entry.description || `${entry.name} is listed in the reviewed art appraiser directory.`,
      notes: 'Directory details are limited to the reviewed public profile.',
    },
    metadata: {
      lastUpdated: entry.source?.verifiedAt || '',
      inService: true,
    },
  };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function getPublishedRegistry(): Promise<PublishedRegistry | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return null;

  const [locationsFeed, appraisersFeed] = await Promise.all([
    fetchJson<{ locations?: PublicLocationEntry[] }>('/locations.json'),
    fetchJson<{ appraisers?: PublicAppraiserEntry[] }>('/appraisers.json'),
  ]);

  if (!locationsFeed || !appraisersFeed) return null;
  return {
    locations: locationsFeed.locations || [],
    appraisers: appraisersFeed.appraisers || [],
  };
}

export async function getPublishedStandardizedLocation(
  citySlug: string
): Promise<StandardizedLocation | null> {
  if (!citySlug) return null;
  const registry = await getPublishedRegistry();
  if (!registry) return null;

  const location = registry.locations.find((entry) => entry.slug === citySlug);
  if (!location) return { appraisers: [] };

  const approvedSlugs = new Set(
    (location.listedAppraisers || [])
      .filter((entry) => entry.publicRouteAvailable !== false)
      .map((entry) => entry.slug || getSlugFromProfileUrl(entry.url))
      .filter(Boolean)
  );

  return {
    appraisers: registry.appraisers
      .filter((entry) => entry.slug && approvedSlugs.has(entry.slug))
      .map(toStandardizedAppraiser)
      .filter((entry): entry is StandardizedAppraiser => Boolean(entry)),
  };
}

export async function getPublishedStandardizedAppraiser(
  appraiserId: string
): Promise<StandardizedAppraiser | null> {
  if (!appraiserId) return null;
  const registry = await getPublishedRegistry();
  if (!registry) return null;
  const entry = registry.appraisers.find(
    (item) => item.slug === appraiserId || getSlugFromProfileUrl(item.url) === appraiserId
  );
  return entry ? toStandardizedAppraiser(entry) : null;
}

export const cities = publishedCities;

export default {
  getPublishedStandardizedLocation,
  getPublishedStandardizedAppraiser,
  cities,
};
