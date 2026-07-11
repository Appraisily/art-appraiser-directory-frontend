/**
 * Standardized Data Utilities
 *
 * This module provides access to the standardized appraiser data
 * stored in src/data/standardized/*.json
 *
 * Performance: Uses appraiser-index.json to map appraiser IDs/slugs
 * directly to their city file, avoiding loading all ~46 city files.
 */

import citiesData from '../data/cities.json';
import appraiserIndex from '../data/standardized/appraiser-index.json';

// Define types for standardized data
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
    rating: number;
    reviewCount: number;
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
  reviews: Array<{
    author: string;
    rating: number;
    date: string;
    content: string;
  }>;
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

interface PublicLocationFeed {
  location?: {
    slug?: string;
    city?: string;
    region?: string;
    listedAppraisers?: PublicLocationAppraiser[];
  };
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
}

// Export cities from cities.json
export const cities = citiesData.cities;

async function loadStandardizedLocation(citySlug: string): Promise<StandardizedLocation | null> {
  if (!citySlug) return null;

  try {
    const normalizedSlug = citySlug.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    const module = await import(`../data/standardized/${normalizedSlug}.json`);
    return module.default ?? null;
  } catch {
    return null;
  }
}

function normalizeCitySlug(citySlug: string): string {
  return citySlug.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
}

function getSlugFromProfileUrl(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const appraiserIndex = segments.indexOf('appraiser');
    if (appraiserIndex >= 0 && segments[appraiserIndex + 1]) {
      return segments[appraiserIndex + 1];
    }
  } catch {
    const match = url.match(/\/appraiser\/([^/?#]+)/);
    if (match?.[1]) return match[1];
  }
  return '';
}

function getCityMeta(citySlug: string) {
  const normalizedSlug = normalizeCitySlug(citySlug);
  return cities.find(city => city.slug === normalizedSlug);
}

function publishedEntryToStandardizedAppraiser({
  entry,
  citySlug,
  sourceAppraisers,
}: {
  entry: PublicLocationAppraiser;
  citySlug: string;
  sourceAppraisers: StandardizedAppraiser[];
}): StandardizedAppraiser | null {
  const slug = entry.slug || getSlugFromProfileUrl(entry.url);
  if (entry.publicRouteAvailable === false || !entry.url || !slug) {
    return null;
  }
  const source = sourceAppraisers.find(appraiser =>
    appraiser.slug === slug ||
    appraiser.name.toLowerCase() === (entry.name || '').toLowerCase()
  );

  if (source) {
    return source;
  }

  if (!entry.name || !slug) {
    return null;
  }

  const cityMeta = getCityMeta(citySlug);
  const city = cityMeta?.name || citySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const state = cityMeta?.state || '';
  const formattedAddress = [city, state].filter(Boolean).join(', ');
  const description = entry.description || `${entry.name} offers fine art appraisal services serving ${formattedAddress || city}.`;

  return {
    id: `${citySlug}-${slug}`,
    name: entry.name,
    slug,
    imageUrl: entry.image || '',
    address: {
      street: '',
      city,
      state,
      zip: '',
      formatted: formattedAddress || city,
    },
    contact: {
      phone: '',
      email: '',
      website: '',
    },
    business: {
      yearsInBusiness: '',
      hours: [],
      pricing: 'Contact for pricing information',
      rating: 0,
      reviewCount: 0,
    },
    expertise: {
      specialties: ['Fine art appraisals'],
      certifications: [],
      services: ['Art appraisal services'],
    },
    content: {
      about: description,
      notes: description,
    },
    reviews: [],
    metadata: {
      lastUpdated: '',
      inService: true,
    },
  };
}

async function getPublishedLocationFeed(citySlug: string): Promise<PublicLocationFeed | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return null;
  }

  const normalizedSlug = normalizeCitySlug(citySlug);

  try {
    const response = await fetch('/locations.json', {
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      const feed = await response.json() as {
        locations?: PublicLocationFeed['location'][];
      };
      const location = feed.locations?.find(item => item?.slug === normalizedSlug);
      if (location) {
        return { location };
      }
    }
  } catch {
    // Fall back to the route-local feed below.
  }

  try {
    const response = await fetch(`/location/${normalizedSlug}/index.json`, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      return await response.json() as PublicLocationFeed;
    }
  } catch {
    // The route-local feed is a fallback only. Public routing should not depend
    // on it because edge slash canonicalization can turn it into an HTML route.
    return null;
  }
}

/**
 * Get standardized location data by city slug.
 * Uses dynamic import to load only the needed city file.
 */
export async function getStandardizedLocation(citySlug: string): Promise<StandardizedLocation | null> {
  return loadStandardizedLocation(citySlug);
}

/**
 * Get the published city-page appraiser list.
 *
 * Static city pages expose their canonical listed profiles at
 * /location/<city>/index.json. Hydrated pages use that feed first so React does
 * not replace valid server-rendered cards with an empty state if a chunk is
 * stale or missing.
 */
export async function getPublishedStandardizedLocation(citySlug: string): Promise<StandardizedLocation | null> {
  if (!citySlug) return null;

  const normalizedSlug = normalizeCitySlug(citySlug);
  const [publishedFeed, standardizedLocation] = await Promise.all([
    getPublishedLocationFeed(normalizedSlug),
    loadStandardizedLocation(normalizedSlug),
  ]);

  const hasPublishedLocation = Boolean(publishedFeed?.location);
  const publishedEntries = publishedFeed?.location?.listedAppraisers || [];
  if (publishedEntries.length > 0) {
    const sourceAppraisers = standardizedLocation?.appraisers || [];
    const appraisers = publishedEntries
      .map(entry => publishedEntryToStandardizedAppraiser({
        entry,
        citySlug: normalizedSlug,
        sourceAppraisers,
      }))
      .filter((appraiser): appraiser is StandardizedAppraiser => Boolean(appraiser));

    if (appraisers.length > 0) {
      return { appraisers };
    }
  }

  if (hasPublishedLocation) {
    return { appraisers: [] };
  }

  if (standardizedLocation?.appraisers?.length) {
    return standardizedLocation;
  }

  return null;
}

// Cache for loaded locations to avoid re-fetching
const locationCache = new Map<string, StandardizedLocation | null>();

async function getStandardizedLocationCached(citySlug: string): Promise<StandardizedLocation | null> {
  if (locationCache.has(citySlug)) return locationCache.get(citySlug)!;
  const data = await getStandardizedLocation(citySlug);
  locationCache.set(citySlug, data);
  return data;
}

/**
 * Get appraiser data by ID or slug.
 * Uses the pre-built appraiser-index.json to find the city file
 * containing the appraiser, then loads only that one file.
 */
export async function getStandardizedAppraiser(appraiserId: string): Promise<StandardizedAppraiser | null> {
  if (!appraiserId) return null;

  // Look up which city file contains this appraiser
  const citySlug = (appraiserIndex as Record<string, string>)[appraiserId];

  if (citySlug) {
    // Direct lookup: load only the specific city file
    const location = await getStandardizedLocationCached(citySlug);
    if (location?.appraisers) {
      const appraiser = location.appraisers.find(a => a.id === appraiserId || a.slug === appraiserId);
      if (appraiser) return appraiser;
    }
  }

  // Fallback: scan all cities (for appraisers not in the index)
  const allLocations = await Promise.all(
    cities.map(city => {
      const slug = city.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
      return getStandardizedLocationCached(slug);
    })
  );

  for (const location of allLocations) {
    if (!location?.appraisers) continue;
    const appraiser = location.appraisers.find(a => a.id === appraiserId || a.slug === appraiserId);
    if (appraiser) return appraiser;
  }

  return null;
}

function publishedEntryToSafeAppraiser(entry: PublicAppraiserEntry): StandardizedAppraiser | null {
  if (!entry.slug || !entry.name || !entry.url) return null;
  const address = entry.address || {};
  const formatted = [address.streetAddress, [address.city, address.region].filter(Boolean).join(', '), address.postalCode]
    .filter(Boolean)
    .join(', ');
  return {
    id: entry.slug,
    slug: entry.slug,
    name: entry.name,
    imageUrl: entry.image || '',
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
      website: entry.website || '',
    },
    business: {
      yearsInBusiness: '',
      hours: [],
      pricing: entry.priceRange || '',
      rating: 0,
      reviewCount: 0,
    },
    expertise: {
      specialties: entry.specialties || [],
      certifications: [],
      services: entry.services || [],
    },
    content: {
      about: entry.description || `${entry.name} has a limited directory listing for ${formatted || 'this service area'}.`,
      notes: 'Directory details are limited to information present in the approved public profile.',
    },
    reviews: [],
    metadata: { lastUpdated: '', inService: true },
  };
}

export async function getPublishedStandardizedAppraiser(appraiserId: string): Promise<StandardizedAppraiser | null> {
  if (!appraiserId || typeof window === 'undefined' || typeof fetch === 'undefined') return null;
  try {
    const response = await fetch('/appraisers.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const feed = await response.json() as { appraisers?: PublicAppraiserEntry[] };
    const entry = feed.appraisers?.find(item => item.slug === appraiserId || getSlugFromProfileUrl(item.url) === appraiserId);
    return entry ? publishedEntryToSafeAppraiser(entry) : null;
  } catch {
    return null;
  }
}

/**
 * Get all appraisers across all locations
 */
export async function getAllStandardizedAppraisers(): Promise<StandardizedAppraiser[]> {
  const allLocations = await Promise.all(
    cities.map(city => {
      const citySlug = city.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
      return getStandardizedLocationCached(citySlug);
    })
  );

  const allAppraisers: StandardizedAppraiser[] = [];
  for (const location of allLocations) {
    if (location?.appraisers?.length) {
      allAppraisers.push(...location.appraisers);
    }
  }

  return allAppraisers;
}

export default {
  getStandardizedLocation,
  getPublishedStandardizedLocation,
  getPublishedStandardizedAppraiser,
  getStandardizedAppraiser,
  getAllStandardizedAppraisers,
  cities
};
