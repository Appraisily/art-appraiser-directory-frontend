/**
 * Standardized Data Utilities
 * 
 * This module provides access to the standardized appraiser data
 * stored in src/data/standardized/*.json
 */

import citiesData from '../data/cities.json';

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
 * @param {string} citySlug - The slug of the city to find
 * @returns {StandardizedLocation|null} - The location data or null if not found
 */
export async function getStandardizedLocation(citySlug: string): Promise<StandardizedLocation | null> {
  if (!citySlug) {
    console.error('getStandardizedLocation called with undefined or null citySlug');
    return null;
  }
  
  try {
    // Normalize the slug - replace spaces with dashes, remove periods, ensure lowercase
    const normalizedSlug = citySlug.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
    
    // Dynamic import of the city file
    return import(`../data/standardized/${normalizedSlug}.json`)
      .then(module => module.default)
      .catch(error => {
        console.error(`Error loading location data for ${normalizedSlug}:`, error);
        return null;
      });
  } catch (error) {
    console.error(`Error in getStandardizedLocation for ${citySlug}:`, error);
    return null;
  }
}

/**
 * Get appraiser data by ID
 * @param {string} appraiserId - The ID of the appraiser to find
 * @returns {StandardizedAppraiser|null} - The appraiser data or null if not found
 */
export async function getStandardizedAppraiser(appraiserId: string): Promise<StandardizedAppraiser | null> {
  if (!appraiserId) {
    console.error('getStandardizedAppraiser called with undefined or null appraiserId');
    return null;
  }
  
  // If we're in a browser environment, we need to fetch all locations
  // and search through them for the appraiser
  try {
    // In a browser environment, we need to load all location files
    const allLocations = await Promise.all(
      cities.map(city => {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
        return getStandardizedLocation(citySlug);
      })
    );
    
    // Search through all locations for the appraiser
    for (const location of allLocations) {
      if (!location?.appraisers) continue;
      
      const appraiser = location.appraisers.find(a => 
        a.id === appraiserId || a.slug === appraiserId
      );
      
      if (appraiser) return appraiser;
    }
    
    console.error(`No appraiser found with ID: ${appraiserId}`);
    return null;
  } catch (error) {
    console.error(`Error in getStandardizedAppraiser for ${appraiserId}:`, error);
    return null;
  }
}

/**
 * Get all appraisers across all locations
 * @returns {Promise<StandardizedAppraiser[]>} - Array of all appraisers
 */
export async function getAllStandardizedAppraisers(): Promise<StandardizedAppraiser[]> {
  try {
    const allLocations = await Promise.all(
      cities.map(city => {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
        return getStandardizedLocation(citySlug);
      })
    );
    
    const allAppraisers: StandardizedAppraiser[] = [];
    
    allLocations.forEach(location => {
      if (location?.appraisers?.length) {
        allAppraisers.push(...location.appraisers);
      }
    });
    
    return allAppraisers;
  } catch (error) {
    console.error('Error in getAllStandardizedAppraisers:', error);
    return [];
  }
}

export default {
  getStandardizedLocation,
  getStandardizedAppraiser,
  getAllStandardizedAppraisers,
  cities
};
