/**
 * Template generators for static HTML generation
 * This module provides functions to generate complete HTML templates for different page types
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { getEnhancedHeaderHTML, getEnhancedFooterHTML, createEnhancedImageMarkup, createSchemaScriptTag } from './template-helpers.js';
import { generateSeoTitle, generateSeoDescription, generateKeywords, generateCanonicalUrl } from './seo-utils.js';

// Image generation service URL
const IMAGE_GENERATION_SERVICE_URL = process.env.IMAGE_GENERATION_SERVICE_URL || 'https://image-generation.appraisily.com/generate';
// ImageKit API URL base
const IMAGEKIT_URL_BASE = 'https://ik.imagekit.io/appraisily';
// Local cache to avoid repeated checks for the same image
const imageValidationCache = new Map();

/**
 * Checks if an ImageKit URL is valid and accessible
 * @param {string} imageUrl - The URL to check
 * @returns {Promise<boolean>} True if the image exists
 */
async function isImageValid(imageUrl) {
  try {
    // Check if we have this result cached
    if (imageValidationCache.has(imageUrl)) {
      return imageValidationCache.get(imageUrl);
    }
    
    // Make a HEAD request to check if the image exists
    const response = await axios.head(imageUrl, { timeout: 5000 });
    const isValid = response.status === 200;
    
    // Cache the result
    imageValidationCache.set(imageUrl, isValid);
    return isValid;
  } catch (error) {
    console.error(`Error checking image at ${imageUrl}:`, error.message);
    // Cache the negative result
    imageValidationCache.set(imageUrl, false);
    return false;
  }
}

/**
 * Generates or retrieves an image URL for an appraiser
 * @param {Object} appraiser - Appraiser data
 * @returns {Promise<string>} URL to use for the appraiser image
 */
async function getValidAppraiserImageUrl(appraiser) {
  if (!appraiser) return '';
  
  // Check if an image URL is already provided
  if (appraiser.imageUrl) {
    const isValid = await isImageValid(appraiser.imageUrl);
    if (isValid) return appraiser.imageUrl;
  }
  
  // Generate a filename based on appraiser details
  const appraiserSlug = appraiser.slug || appraiser.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  
  // Check if there's an existing image with this naming pattern
  const standardImageUrl = `${IMAGEKIT_URL_BASE}/appraiser-images/appraiser_${appraiserSlug}_${Date.now()}_placeholder.jpg`;
  const isStandardValid = await isImageValid(standardImageUrl);
  if (isStandardValid) return standardImageUrl;
  
  // If no valid image found, generate one using the image generation service
  try {
    const response = await axios.post(IMAGE_GENERATION_SERVICE_URL, {
      name: appraiser.name,
      type: 'appraiser',
      location: appraiser.location || appraiser.city,
      description: `Professional art appraiser specializing in ${appraiser.specialties?.join(', ') || 'fine art'}`
    }, { timeout: 15000 });
    
    if (response.data && response.data.imageUrl) {
      console.log(`Generated new image for ${appraiser.name} at ${response.data.imageUrl}`);
      return response.data.imageUrl;
    }
  } catch (error) {
    console.error(`Error generating image for ${appraiser.name}:`, error.message);
  }
  
  // If all else fails, return a default image
  return `${IMAGEKIT_URL_BASE}/appraisily-og-image.jpg`;
}

/**
 * Generates the complete HTML for a location page
 * @param {Object} options - The options for the location page
 * @param {string} options.cityName - The name of the city
 * @param {string} options.stateName - The name of the state
 * @param {Array} options.appraisers - Array of appraisers in this location
 * @param {Object} options.seoData - Additional SEO data
 * @returns {Promise<string>} The complete HTML for the location page
 */
export async function generateLocationPageHTML({
  cityName,
  stateName,
  appraisers = [],
  seoData = {}
}) {
  // Generate SEO metadata
  const locationName = `${cityName}, ${stateName}`;
  const pageTitle = generateSeoTitle({
    name: `Art Appraisers in ${locationName}`,
    location: '',
    includeKeywords: true
  });
  
  const pageDescription = generateSeoDescription({
    name: '',
    location: locationName,
    baseDescription: seoData.description || ''
  });
  
  const keywords = generateKeywords({
    type: 'location',
    name: '',
    location: locationName
  });
  
  const canonicalUrl = generateCanonicalUrl({
    path: `/location/${cityName.toLowerCase().replace(/\s+/g, '-')}`
  });
  
  // Create the schema.org data
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": `${cityName}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": stateName,
      "addressCountry": "US"
    },
    "description": `Find professional art appraisers in ${locationName}`
  };
  
  // Schema for local business list
  const localBusinessListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": []
  };
  
  // Generate HTML for each appraiser
  const appraiserCardsHTML = await Promise.all(appraisers.map(async (appraiser, index) => {
    // Get a valid image URL for this appraiser
    const imageUrl = await getValidAppraiserImageUrl(appraiser);
    
    // Add this appraiser to the local business list schema
    localBusinessListSchema.itemListElement.push({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": appraiser.name,
        "image": imageUrl,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": appraiser.city || cityName,
          "addressRegion": appraiser.state || stateName,
          "addressCountry": "US"
        },
        "url": `https://art-appraiser.appraisily.com/appraiser/${appraiser.slug}`,
        "telephone": appraiser.phone || "",
        "priceRange": appraiser.priceRange || "$$-$$$"
      }
    });
    
    // Generate card HTML
    return `
      <div class="appraiser-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row mb-8" itemscope itemtype="https://schema.org/LocalBusiness">
        <div class="appraiser-image w-full md:w-1/3 h-48 md:h-auto">
          ${createEnhancedImageMarkup({
            src: imageUrl,
            alt: `${appraiser.name} - Art Appraiser in ${locationName}`,
            className: "object-cover w-full h-full",
            width: 400,
            height: 300
          })}
          <meta itemprop="image" content="${imageUrl}" />
        </div>
        <div class="p-6 flex-1">
          <h2 class="text-2xl font-bold mb-2" itemprop="name">
            <a href="/appraiser/${appraiser.slug}" class="text-primary hover:text-primary-dark transition">
              ${appraiser.name}
            </a>
          </h2>
          <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
            <meta itemprop="addressLocality" content="${appraiser.city || cityName}" />
            <meta itemprop="addressRegion" content="${appraiser.state || stateName}" />
            <meta itemprop="addressCountry" content="US" />
          </div>
          <p class="text-gray-600 mb-4 line-clamp-3" itemprop="description">
            ${appraiser.description || `Professional art appraiser serving ${locationName} and surrounding areas. Specializing in ${appraiser.specialties?.join(', ') || 'fine art appraisals'}.`}
          </p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${(appraiser.specialties || ['Fine Art', 'Paintings', 'Antiques']).map(specialty => 
              `<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">${specialty}</span>`
            ).join('')}
          </div>
          <a href="/appraiser/${appraiser.slug}" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md inline-block transition">
            View Details
          </a>
          <meta itemprop="url" content="https://art-appraiser.appraisily.com/appraiser/${appraiser.slug}" />
          ${appraiser.phone ? `<meta itemprop="telephone" content="${appraiser.phone}" />` : ''}
          <meta itemprop="priceRange" content="${appraiser.priceRange || '$$-$$$'}" />
        </div>
      </div>
    `;
  }));
  
  // Generate the FAQ schema for the location
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How much does art appraisal cost in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Art appraisal costs in ${cityName} typically range from $125 to $350 per hour, depending on the appraiser's expertise and the complexity of the artwork. Many appraisers also offer flat rates for certain types of appraisals.`
        }
      },
      {
        "@type": "Question",
        "name": `How do I find a reliable art appraiser in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `To find a reliable art appraiser in ${cityName}, look for appraisers with certifications from recognized organizations such as the International Society of Appraisers (ISA), American Society of Appraisers (ASA), or Appraisers Association of America (AAA). You can also check reviews, ask for references, and verify their area of specialization.`
        }
      },
      {
        "@type": "Question",
        "name": `What information do I need to provide for an art appraisal in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `For an art appraisal in ${cityName}, you'll typically need to provide clear photographs of the artwork (front, back, signature, details), dimensions, medium, information about the artist if known, provenance (history of ownership), any documentation or certificates of authenticity, and the purpose of the appraisal (insurance, estate planning, donation, sale).`
        }
      }
    ]
  };
  
  // Begin constructing the page HTML
  const headerHTML = getEnhancedHeaderHTML({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: canonicalUrl,
    keywords: keywords,
    cssPath: '/assets/index.css',
    ogType: 'website'
  });
  
  // Content HTML
  const contentHTML = `
    <main class="container mx-auto px-4 py-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-6">Art Appraisers in ${locationName}</h1>
      
      <div class="bg-gray-50 p-6 rounded-lg mb-8">
        <p class="mb-4">Looking for professional art appraisal services in ${locationName}? Browse our directory of certified art appraisers specializing in valuation, authentication, and assessment of artwork in ${cityName} and surrounding areas.</p>
        <p>Our listed appraisers can assist with insurance valuations, estate appraisals, donation appraisals, and more.</p>
      </div>
      
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Featured Art Appraisers in ${locationName}</h2>
        <div class="appraiser-list">
          ${appraiserCardsHTML.join('\n')}
        </div>
        ${appraisers.length === 0 ? `
          <div class="bg-white p-6 rounded-lg shadow-sm text-center">
            <p class="mb-4">We're currently updating our directory of art appraisers in ${locationName}.</p>
            <p>Please check back soon or <a href="/contact" class="text-primary hover:underline">contact us</a> for recommendations.</p>
          </div>
        ` : ''}
      </section>
      
      <section class="mb-12 bg-white p-6 rounded-lg shadow-sm">
        <h2 class="text-2xl font-bold mb-4">Art Appraisal Services in ${locationName}</h2>
        <p class="mb-4">Professional art appraisers in ${cityName} provide a range of specialized services:</p>
        <ul class="list-disc pl-5 mb-4 space-y-2">
          <li><strong>Insurance Appraisals:</strong> For insuring your artwork against loss or damage</li>
          <li><strong>Estate Appraisals:</strong> For estate tax purposes, equitable distribution, or probate</li>
          <li><strong>Donation Appraisals:</strong> For charitable contributions of artwork</li>
          <li><strong>Fair Market Value Appraisals:</strong> For buying or selling artwork</li>
          <li><strong>Replacement Value Appraisals:</strong> For determining the cost to replace artwork</li>
          <li><strong>Art Authentication:</strong> For verifying the authenticity of artwork</li>
        </ul>
        <p>Contact an appraiser directly to discuss your specific needs and requirements.</p>
      </section>
      
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-4">Frequently Asked Questions About Art Appraisal in ${locationName}</h2>
        <div class="space-y-4">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-xl font-semibold mb-2">How much does art appraisal cost in ${cityName}?</h3>
            <p>Art appraisal costs in ${cityName} typically range from $125 to $350 per hour, depending on the appraiser's expertise and the complexity of the artwork. Many appraisers also offer flat rates for certain types of appraisals.</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-xl font-semibold mb-2">How do I find a reliable art appraiser in ${cityName}?</h3>
            <p>To find a reliable art appraiser in ${cityName}, look for appraisers with certifications from recognized organizations such as the International Society of Appraisers (ISA), American Society of Appraisers (ASA), or Appraisers Association of America (AAA). You can also check reviews, ask for references, and verify their area of specialization.</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="text-xl font-semibold mb-2">What information do I need to provide for an art appraisal in ${cityName}?</h3>
            <p>For an art appraisal in ${cityName}, you'll typically need to provide clear photographs of the artwork (front, back, signature, details), dimensions, medium, information about the artist if known, provenance (history of ownership), any documentation or certificates of authenticity, and the purpose of the appraisal (insurance, estate planning, donation, sale).</p>
          </div>
        </div>
      </section>
    </main>
  `;
  
  // Schema scripts
  const schemaScripts = `
    ${createSchemaScriptTag(locationSchema)}
    ${createSchemaScriptTag(localBusinessListSchema)}
    ${createSchemaScriptTag(faqSchema)}
  `;
  
  // Footer HTML
  const footerHTML = getEnhancedFooterHTML('/assets/index.js');
  
  // Combine all HTML sections
  return `
    ${headerHTML}
    ${contentHTML}
    ${schemaScripts}
    ${footerHTML}
  `;
}

/**
 * Generates the complete HTML for an appraiser page
 * @param {Object} appraiser - The appraiser data
 * @returns {Promise<string>} The complete HTML for the appraiser page
 */
export async function generateAppraiserPageHTML(appraiser) {
  if (!appraiser) return '';
  
  // Get a valid image URL
  const imageUrl = await getValidAppraiserImageUrl(appraiser);
  
  // Generate SEO metadata
  const locationDisplay = appraiser.city && appraiser.state ? `${appraiser.city}, ${appraiser.state}` : '';
  const pageTitle = generateSeoTitle({
    name: appraiser.name,
    location: locationDisplay,
    includeKeywords: true
  });
  
  const pageDescription = generateSeoDescription({
    name: appraiser.name,
    location: locationDisplay,
    specialties: appraiser.specialties?.join(', '),
    baseDescription: appraiser.description
  });
  
  const keywords = generateKeywords({
    type: 'appraiser',
    name: appraiser.name,
    location: locationDisplay,
    specialties: appraiser.specialties
  });
  
  const canonicalUrl = generateCanonicalUrl({
    path: `/appraiser/${appraiser.slug}`
  });
  
  // Create the schema.org data for the appraiser
  const appraiserSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://art-appraiser.appraisily.com/appraiser/${appraiser.slug}`,
    "name": appraiser.name,
    "image": imageUrl,
    "description": appraiser.description || `Professional art appraiser specializing in ${appraiser.specialties?.join(', ') || 'fine art appraisals'}.`,
    "url": `https://art-appraiser.appraisily.com/appraiser/${appraiser.slug}`,
    "telephone": appraiser.phone || "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": appraiser.city || "",
      "addressRegion": appraiser.state || "",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": appraiser.latitude || "",
      "longitude": appraiser.longitude || ""
    },
    "priceRange": appraiser.priceRange || "$$-$$$",
    "openingHours": appraiser.hours || "Mo-Fr 09:00-17:00",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Art Appraisal Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Insurance Appraisal"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Estate Appraisal"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Donation Appraisal"
          }
        }
      ]
    }
  };
  
  // Begin constructing the page HTML
  const headerHTML = getEnhancedHeaderHTML({
    title: pageTitle,
    description: pageDescription,
    canonicalUrl: canonicalUrl,
    imageUrl: imageUrl,
    keywords: keywords,
    cssPath: '/assets/index.css',
    ogType: 'business.business'
  });
  
  // Generate services HTML if available
  const servicesHTML = appraiser.services?.length > 0 
    ? `
      <section class="mb-10">
        <h2 class="text-2xl font-bold mb-4">Services Offered</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${appraiser.services.map(service => `
            <div class="bg-white p-6 rounded-lg shadow-sm">
              <h3 class="text-lg font-semibold mb-2">${service.name}</h3>
              <p>${service.description || 'Contact for more information.'}</p>
              ${service.price ? `<p class="mt-2 font-semibold">Starting at: $${service.price}</p>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `
    : '';
  
  // Content HTML
  const contentHTML = `
    <main class="container mx-auto px-4 py-8">
      <article class="appraiser-profile" itemscope itemtype="https://schema.org/LocalBusiness">
        <div class="mb-8 flex flex-col md:flex-row gap-8">
          <div class="w-full md:w-1/3">
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
              ${createEnhancedImageMarkup({
                src: imageUrl,
                alt: `${appraiser.name} - Art Appraiser ${locationDisplay ? `in ${locationDisplay}` : ''}`,
                className: "w-full h-auto",
                width: 400,
                height: 400
              })}
              <meta itemprop="image" content="${imageUrl}" />
            </div>
            
            <div class="mt-6 bg-white p-6 rounded-lg shadow-md">
              <h2 class="text-xl font-bold mb-4">Contact Information</h2>
              ${appraiser.phone ? `
                <div class="flex items-center mb-3">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <span itemprop="telephone">${appraiser.phone}</span>
                </div>
              ` : ''}
              
              ${appraiser.email ? `
                <div class="flex items-center mb-3">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <a href="mailto:${appraiser.email}" class="text-primary hover:underline" itemprop="email">${appraiser.email}</a>
                </div>
              ` : ''}
              
              ${appraiser.website ? `
                <div class="flex items-center mb-3">
                  <svg class="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clip-rule="evenodd"/>
                  </svg>
                  <a href="${appraiser.website}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer" itemprop="url">${appraiser.website.replace(/^https?:\/\//, '')}</a>
                </div>
              ` : ''}
              
              <div class="mt-4">
                <h3 class="text-lg font-semibold mb-2">Location</h3>
                <div class="text-gray-700" itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
                  ${appraiser.city && appraiser.state ? `
                    <span itemprop="addressLocality">${appraiser.city}</span>,
                    <span itemprop="addressRegion">${appraiser.state}</span>
                  ` : ''}
                  <meta itemprop="addressCountry" content="US" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="w-full md:w-2/3">
            <h1 class="text-3xl md:text-4xl font-bold mb-4" itemprop="name">${appraiser.name}</h1>
            
            <div class="mb-6">
              <h2 class="text-xl font-bold mb-2">About</h2>
              <div class="bg-white p-6 rounded-lg shadow-md prose max-w-none" itemprop="description">
                <p>${appraiser.description || `${appraiser.name} is a professional art appraiser ${locationDisplay ? `serving ${locationDisplay}` : ''} and surrounding areas. Specializing in ${appraiser.specialties?.join(', ') || 'fine art appraisals'}.`}</p>
              </div>
            </div>
            
            <div class="mb-6">
              <h2 class="text-xl font-bold mb-2">Specialties</h2>
              <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex flex-wrap gap-2">
                  ${(appraiser.specialties || ['Fine Art', 'Paintings', 'Antiques']).map(specialty => 
                    `<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">${specialty}</span>`
                  ).join('')}
                </div>
              </div>
            </div>
            
            ${appraiser.credentials ? `
              <div class="mb-6">
                <h2 class="text-xl font-bold mb-2">Credentials</h2>
                <div class="bg-white p-6 rounded-lg shadow-md prose max-w-none">
                  <p>${appraiser.credentials}</p>
                </div>
              </div>
            ` : ''}
            
            ${appraiser.hours ? `
              <div class="mb-6">
                <h2 class="text-xl font-bold mb-2">Business Hours</h2>
                <div class="bg-white p-6 rounded-lg shadow-md">
                  <p itemprop="openingHours" content="${appraiser.hours}">${appraiser.hours.replace(/;/g, '<br>')}</p>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${servicesHTML}
        
        <section class="mb-10">
          <h2 class="text-2xl font-bold mb-4">Request an Appraisal</h2>
          <div class="bg-white p-6 rounded-lg shadow-md">
            <p class="mb-4">Interested in getting your artwork appraised by ${appraiser.name}? Contact them directly or use our online appraisal request service.</p>
            <div class="flex flex-col sm:flex-row gap-4">
              <a href="/start-appraisal" class="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md text-center transition">Start Online Appraisal</a>
              ${appraiser.phone ? `<a href="tel:${appraiser.phone.replace(/[^0-9]/g, '')}" class="border border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-md text-center transition">Call Directly</a>` : ''}
            </div>
          </div>
        </section>
        
        <meta itemprop="priceRange" content="${appraiser.priceRange || '$$-$$$'}" />
      </article>
    </main>
  `;
  
  // Schema scripts
  const schemaScripts = `
    ${createSchemaScriptTag(appraiserSchema)}
  `;
  
  // Footer HTML
  const footerHTML = getEnhancedFooterHTML('/assets/index.js');
  
  // Combine all HTML sections
  return `
    ${headerHTML}
    ${contentHTML}
    ${schemaScripts}
    ${footerHTML}
  `;
}

/**
 * Validates and updates appraiser images in a data array
 * @param {Array} appraisersData - Array of appraiser data objects
 * @returns {Promise<Array>} Updated array with validated images
 */
export async function validateAndUpdateAppraiserImages(appraisersData) {
  if (!appraisersData || !Array.isArray(appraisersData)) {
    console.error("Invalid appraisers data provided");
    return [];
  }
  
  console.log(`Validating images for ${appraisersData.length} appraisers...`);
  
  const updatedAppraisers = [];
  
  for (const appraiser of appraisersData) {
    try {
      const validImageUrl = await getValidAppraiserImageUrl(appraiser);
      updatedAppraisers.push({
        ...appraiser,
        imageUrl: validImageUrl
      });
      console.log(`✓ Validated image for ${appraiser.name}: ${validImageUrl}`);
    } catch (error) {
      console.error(`Error validating image for ${appraiser.name}:`, error.message);
      // Still include the appraiser with original image data
      updatedAppraisers.push(appraiser);
    }
  }
  
  return updatedAppraisers;
}

/**
 * Saves validated appraiser data to a JSON file for caching
 * @param {Array} validatedAppraisers - Array of validated appraiser data
 * @param {string} outputPath - Path to save the cache file
 * @returns {Promise<boolean>} Success status
 */
export async function saveValidatedAppraiserData(validatedAppraisers, outputPath) {
  try {
    await fs.writeJSON(outputPath, {
      appraisers: validatedAppraisers,
      lastUpdated: new Date().toISOString()
    }, { spaces: 2 });
    console.log(`Saved validated appraiser data to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error saving validated appraiser data:`, error.message);
    return false;
  }
} 