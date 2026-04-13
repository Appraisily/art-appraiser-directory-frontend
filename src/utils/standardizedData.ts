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

// Export cities from cities.json
export const cities = citiesData.cities;

/**
 * Get standardized location data by city slug
 * Uses dynamic import to load only the needed city file.
 */
export async function getStandardizedLocation(citySlug: string): Promise<StandardizedLocation | null> {
  if (!citySlug) return null;

  try {
    const normalizedSlug = citySlug.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    const module = await import(`../data/standardized/${normalizedSlug}.json`);
    return module.default ?? null;
  } catch {
    return null;
  }
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
  getStandardizedAppraiser,
  getAllStandardizedAppraisers,
  cities
};
