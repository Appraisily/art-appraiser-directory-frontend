import { buildSiteUrl } from '../config/site';
import { BRAND_LOGO_URL } from '../config/assets';
import { normalizeAssetUrl } from './assetUrls';

type BusinessHoursEntry = { day: string; hours: string };
type ServiceEntry = { name: string; description?: string; price?: string };
type ReviewEntry = { author: string; rating: number; date: string; content: string };
type SocialLinks = { facebook?: string; instagram?: string; linkedin?: string; twitter?: string };
type AddressObject = { street?: string; city?: string; state?: string; zip?: string; formatted?: string };

type SchemaAppraiserInput = {
  id?: string;
  slug?: string;
  name: string;
  businessName?: string;
  image?: string;
  imageUrl?: string;
  about?: string;
  yearEstablished?: string;
  address?: string | AddressObject;
  city?: string;
  state?: string;
  postalCode?: string;
  contact?: { phone?: string; email?: string; website?: string };
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: SocialLinks;
  paymentMethods?: string;
  businessHours?: BusinessHoursEntry[];
  business?: { hours?: BusinessHoursEntry[]; pricing?: string; rating?: number; reviewCount?: number };
  priceRange?: string;
  pricing?: string;
  rating?: number;
  reviewCount?: number;
  services?: ServiceEntry[];
  services_offered?: string[];
  certifications?: string[];
  specialties?: string[];
  latitude?: number;
  longitude?: number;
  reviews?: ReviewEntry[];
};

type SchemaLocationInput = {
  city?: string;
  state?: string;
  slug?: string;
  appraisers?: Array<{
    id?: string;
    slug?: string;
    name?: string;
    image?: string;
    imageUrl?: string;
    pricing?: string;
    business?: { pricing?: string };
    phone?: string;
    contact?: { phone?: string; website?: string };
    website?: string;
  }>;
};

function extractAddressParts(appraiser: SchemaAppraiserInput) {
  const address = appraiser.address;
  if (typeof address === 'object' && address) {
    return {
      street: address.street || '',
      city: address.city || appraiser.city || '',
      state: address.state || appraiser.state || '',
      zip: address.zip || appraiser.postalCode || '',
    };
  }

  const raw = typeof address === 'string' ? address : '';
  const parts = raw.split(',').map((part) => part.trim());
  const city = parts[0] || appraiser.city || '';
  const state = parts[1] || appraiser.state || '';
  return {
    street: parts[0] || '',
    city,
    state,
    zip: appraiser.postalCode || '',
  };
}

function parsePriceToNumber(price: string): number | null {
  const cleaned = price.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function generateAppraiserSchema(appraiser: SchemaAppraiserInput) {
  const appraiserId = appraiser.id || appraiser.slug || 'unknown-appraiser';
  // Normalize business hours if available
  const hoursSource = appraiser.businessHours || appraiser.business?.hours || [];
  const formattedHours = hoursSource.map((hours) => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": hours.day,
    "opens": hours.hours.split(' - ')[0],
    "closes": hours.hours.split(' - ')[1]
  }));

  // Generate price range indicator if exact prices aren't available
  const priceRange =
    appraiser.priceRange ||
    (appraiser.services?.some((service) => {
      if (!service.price) return false;
      const numeric = parsePriceToNumber(service.price);
      return typeof numeric === 'number' && numeric > 500;
    })
      ? "$$$"
      : "$$");

  const { street, city, state, zip } = extractAddressParts(appraiser);
  const phone = appraiser.contact?.phone || appraiser.phone || "";
  const email = appraiser.contact?.email || appraiser.email || "";
  const website = appraiser.contact?.website || appraiser.website || "";
  const ratingValue = appraiser.rating ?? appraiser.business?.rating;
  const reviewCountValue = appraiser.reviewCount ?? appraiser.business?.reviewCount;
  const socialLinks: SocialLinks | undefined = appraiser.socialLinks;

  // Create safe schema with null checks for missing properties
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": buildSiteUrl(`/appraiser/${appraiserId}`),
    "name": appraiser.name,
    "alternateName": appraiser.businessName || undefined,
    "image": {
      "@type": "ImageObject",
      "url": normalizeAssetUrl(appraiser.image || appraiser.imageUrl || ''),
      "width": 800,
      "height": 600,
      "caption": `${appraiser.name} - Art Appraiser`
    },
    "description": appraiser.about || `${appraiser.name} provides professional art appraisal services.`,
    "foundingDate": appraiser.yearEstablished,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": street,
      "addressLocality": city,
      "addressRegion": state,
      "postalCode": zip,
      "addressCountry": "US"
    },
    "url": website || buildSiteUrl(`/appraiser/${appraiserId}`),
    "telephone": phone,
    "email": email,
    "sameAs": [
      socialLinks?.facebook || "",
      socialLinks?.instagram || "",
      socialLinks?.linkedin || "",
      socialLinks?.twitter || ""
    ].filter(url => url !== ""),
    "priceRange": priceRange,
    "paymentAccepted": appraiser.paymentMethods || "Cash, Credit Card",
    "openingHoursSpecification": formattedHours
  };

  // Only add geo if coordinates are available
  if (appraiser.latitude && appraiser.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": appraiser.latitude,
      "longitude": appraiser.longitude
    };
  }

  // Only add rating information if rating and reviewCount exist
  if (ratingValue !== undefined && ratingValue !== null) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": String(ratingValue),
      "reviewCount": String(reviewCountValue || 0),
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  // Only add reviews if they exist
  if (Array.isArray(appraiser.reviews) && appraiser.reviews.length > 0) {
    schema.review = appraiser.reviews.map((review) => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": String(review.rating),
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "datePublished": review.date,
      "reviewBody": review.content
    }));
  }

  // Only add services if they exist
  if (Array.isArray(appraiser.services) && appraiser.services.length > 0) {
    schema.makesOffer = appraiser.services.map((service) => ({
      "@type": "Offer",
      "name": service.name,
      "description": service.description,
      "price": service.price?.replace(/[^0-9]/g, '') || "",
      "priceCurrency": "USD"
    }));
  }

  // Only add certifications if they exist
  if (Array.isArray(appraiser.certifications) && appraiser.certifications.length > 0) {
    schema.hasCredential = appraiser.certifications.map((certification: string) => ({
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "certification",
      "name": certification
    }));
  }

  // Only add specialties if they exist
  if (Array.isArray(appraiser.specialties) && appraiser.specialties.length > 0) {
    schema.knowsAbout = appraiser.specialties.map((specialty: string) => specialty);
  }

  // Add area served information
  schema.areaServed = {
    "@type": "City",
    "name": city || appraiser.city || "",
    "containedInPlace": {
      "@type": "State",
      "name": state || appraiser.state || ""
    }
  };

  // Add services catalog if services exist
  if (Array.isArray(appraiser.services) && appraiser.services.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      "name": "Art Appraisal Services",
      "itemListElement": appraiser.services.map((service, index: number) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.name,
          "description": service.description
        },
        "position": index + 1
      }))
    };
  } else if (Array.isArray(appraiser.services_offered) && appraiser.services_offered.length > 0) {
    // Fallback to services_offered if services array doesn't exist
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      "name": "Art Appraisal Services",
      "itemListElement": appraiser.services_offered.map((service: string, index: number) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service,
          "description": `Professional ${service} by ${appraiser.name}`
        },
        "position": index + 1
      }))
    };
  }

  schema.additionalType = "https://schema.org/ProfessionalService";
  schema.isAccessibleForFree = false;

  return schema;
}

export function generateLocationSchema(locationData: SchemaLocationInput | null, displayName?: string, slug?: string) {
  // Add safety check for locationData
  if (!locationData) {
    console.error('Cannot generate location schema: locationData is undefined');
    return {};
  }
  
  // Create a safe slug value
  const displayParts = (displayName || '').split(',').map(part => part.trim());
  const safeCity = locationData.city || displayParts[0] || 'Unknown City';
  const stateCode = locationData.state || displayParts[1] || 'USA';
  const safeSlug = (slug || locationData.slug || safeCity.toLowerCase().replace(/\s+/g, '-'));
  const canonicalUrl = buildSiteUrl(`/location/${safeSlug}`);
  
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": canonicalUrl,
    "name": `Art Appraisal Services in ${safeCity}`,
    "description": `Find top-rated art appraisers near you in ${safeCity}, ${stateCode}. Professional art valuation services for insurance, estate planning, donations, and more.`,
    "serviceType": "Art Appraisal",
    "areaServed": {
      "@type": "City",
      "name": safeCity,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": safeCity,
        "addressRegion": stateCode,
        "addressCountry": "US"
      },
      "containedInPlace": {
        "@type": "State",
        "name": stateCode
      }
    },
    "provider": Array.isArray(locationData.appraisers) ? locationData.appraisers.map((appraiser) => ({
      "@type": "LocalBusiness",
      "name": appraiser?.name || 'Art Appraiser',
      "image": normalizeAssetUrl(appraiser?.imageUrl || appraiser?.image || ''),
      "address": {
        "@type": "PostalAddress",
        "addressLocality": safeCity,
        "addressRegion": stateCode,
        "addressCountry": "US"
      },
      "priceRange": appraiser?.pricing || appraiser?.business?.pricing || "$$-$$$",
      "telephone": appraiser?.contact?.phone || appraiser?.phone || "",
      "url": buildSiteUrl(`/appraiser/${appraiser?.id || appraiser?.slug || 'unknown'}`),
      "sameAs": appraiser?.contact?.website || appraiser?.website || ""
    })) : [],
    "offers": {
      "@type": "Offer",
      "description": `Professional art appraisal services in ${safeCity}`,
      "areaServed": {
        "@type": "City",
        "name": safeCity,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": safeCity,
          "addressRegion": stateCode,
          "addressCountry": "US"
        }
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };
}

export function generateFAQSchema(appraiser: SchemaAppraiserInput) {
  // Safely check if arrays exist and then join them or provide fallbacks
  const services = Array.isArray(appraiser.services) 
    ? appraiser.services.map((service) => service.name).join(', ') 
    : (Array.isArray(appraiser.services_offered) ? appraiser.services_offered.join(', ') : '');
    
  const specialties = Array.isArray(appraiser.specialties) ? appraiser.specialties.join(', ') : '';
  const certifications = Array.isArray(appraiser.certifications) ? appraiser.certifications.join(', ') : '';
  
  // Safely extract city and state from address with fallbacks
  const { city, state } = extractAddressParts(appraiser);
  const ratingValue = appraiser.rating ?? appraiser.business?.rating ?? 0;
  const reviewCountValue = appraiser.reviewCount ?? appraiser.business?.reviewCount ?? 0;
  
  const minServicePrice = (() => {
    if (!Array.isArray(appraiser.services)) return null;
    const candidates = appraiser.services
      .map((service) => (service.price ? parsePriceToNumber(service.price) : null))
      .filter((value): value is number => typeof value === 'number');
    if (!candidates.length) return null;
    return Math.min(...candidates);
  })();

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What services does ${appraiser.name} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": services || `${appraiser.name} offers professional art appraisal services including valuations for insurance, estate planning, donations, and sales.`
        }
      },
      {
        "@type": "Question",
        "name": `What are ${appraiser.name}'s specialties?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": specialties || `${appraiser.name} specializes in appraising various types of artwork and collectibles.`
        }
      },
      {
        "@type": "Question",
        "name": `What certifications does ${appraiser.name} have?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": certifications || `${appraiser.name} holds professional certifications in art appraisal.`
        }
      },
      {
        "@type": "Question",
        "name": `How can I contact ${appraiser.name} for an art appraisal?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can contact ${appraiser.name} by phone at ${appraiser.phone || '[contact number on website]'} or by email at ${appraiser.email || '[email on website]'}.`
        }
      },
      {
        "@type": "Question",
        "name": `Where is ${appraiser.name} located?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${appraiser.name} is located in ${city || 'your area'} and provides art appraisal services to clients in the surrounding regions.`
        }
      },
      {
        "@type": "Question",
        "name": `How much does an art appraisal cost with ${appraiser.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": typeof minServicePrice === 'number'
            ? `Art appraisal services with ${appraiser.name} start at about $${minServicePrice}.`
            : (appraiser.pricing || appraiser.business?.pricing)
              ? `${appraiser.name} offers art appraisal services with the following pricing: ${(appraiser.pricing || appraiser.business?.pricing) as string}.`
              : `${appraiser.name} offers art appraisal services at competitive rates. Contact directly for a quote based on your specific needs.`
        }
      },
      {
        "@type": "Question",
        "name": `How long does an art appraisal take with ${appraiser.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The time required for an art appraisal with ${appraiser.name} depends on the complexity and quantity of items being appraised. Please contact directly for an estimated timeline for your specific appraisal needs.`
        }
      },
      {
        "@type": "Question",
        "name": `Is ${appraiser.name} the best art appraiser in ${city}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${appraiser.name} is highly rated with ${ratingValue} stars and ${reviewCountValue} reviews, making them one of the most respected art appraisers in ${city}${state ? ', ' + state : ''}. Their expertise in ${specialties || 'various art forms'} has earned them a strong reputation in the local community.`
        }
      },
      {
        "@type": "Question",
        "name": `Can I get an art appraisal near me in ${city}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, ${appraiser.name} provides art appraisal services to clients in ${city} and surrounding areas. They offer ${services || 'comprehensive appraisal services'} for residents looking for professional art valuation near them.`
        }
      },
      {
        "@type": "Question",
        "name": `What types of items can ${appraiser.name} appraise?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${appraiser.name} specializes in appraising ${specialties || 'a wide range of art and collectibles'}. Their expertise allows them to provide accurate valuations for various types of artwork and collectible items.`
        }
      }
    ]
  };
}

export function generateArticleSchema(pageTitle: string, pageDescription: string, url: string, imageUrl: string = '', author: string = '', publishDate: string = '', modifyDate: string = '') {
  // Use current date if no dates provided
  const currentDate = new Date().toISOString().split('T')[0];
  const publishedDate = publishDate || currentDate;
  const modifiedDate = modifyDate || currentDate;
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": pageTitle,
    "description": pageDescription,
    "image": imageUrl ? normalizeAssetUrl(imageUrl) : BRAND_LOGO_URL,
    "author": {
      "@type": "Organization",
      "name": author || "Appraisily",
      "url": "https://appraisily.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Appraisily",
      "logo": {
        "@type": "ImageObject",
        "url": "https://appraisily.com/logo.png",
        "width": 600,
        "height": 60
      }
    },
    "url": url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "datePublished": publishedDate,
    "dateModified": modifiedDate,
    "inLanguage": "en-US",
    "isAccessibleForFree": true,
    "isFamilyFriendly": true,
    "keywords": ["art appraisal", "artwork valuation", "art authentication", "fine art", "art collecting"]
  };
}

export function generateBreadcrumbSchema(items: {name: string, url: string}[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateWebPageSchema(title: string, description: string, url: string, lastModified: string = '') {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": url,
    "url": url,
    "name": title,
    "description": description,
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Appraisily",
      "url": buildSiteUrl('/')
    },
    "about": {
      "@type": "Thing",
      "name": "Art Appraisal Services"
    },
    "dateModified": lastModified || new Date().toISOString().split('T')[0],
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", "h2", ".summary", ".description"]
    },
    "hasPart": [
      {
        "@type": "WebPageElement",
        "isAccessibleForFree": "True",
        "cssSelector": ".main-content"
      }
    ]
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://appraisily.com",
    "name": "Appraisily",
    "alternateName": "Art Appraisal Services",
    "url": "https://appraisily.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://appraisily.com/logo.png",
      "width": 600,
      "height": 60
    },
    "sameAs": [
      "https://facebook.com/appraisily",
      "https://twitter.com/appraisily",
      "https://instagram.com/appraisily",
      "https://linkedin.com/company/appraisily"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-800-555-5555",
      "contactType": "customer service",
      "email": "info@appraisily.com",
      "availableLanguage": "English"
    },
    "areaServed": "US"
  };
}

export function generateHowToSchema(title: string = 'How to Get an Art Appraisal', description: string = 'Step-by-step guide to getting your artwork appraised by a professional.') {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": title,
    "description": description,
    "totalTime": "P3D",
    "tool": [
      {
        "@type": "HowToTool",
        "name": "Camera or smartphone"
      },
      {
        "@type": "HowToTool",
        "name": "Measuring tape"
      },
      {
        "@type": "HowToTool",
        "name": "Artwork documentation"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Document your artwork",
        "text": "Take clear, high-resolution photographs of your artwork from multiple angles, including any signatures, markings, or damage.",
        "image": normalizeAssetUrl('https://ik.imagekit.io/appraisily/how-to/document-artwork.jpg'),
        "url": "https://appraisily.com/how-to-document-artwork"
      },
      {
        "@type": "HowToStep",
        "name": "Gather documentation",
        "text": "Collect any existing documentation about your artwork, including receipts, certificates of authenticity, provenance documents, and restoration records.",
        "image": normalizeAssetUrl('https://ik.imagekit.io/appraisily/how-to/gather-documentation.jpg'),
        "url": "https://appraisily.com/artwork-documentation"
      },
      {
        "@type": "HowToStep",
        "name": "Find a qualified appraiser",
        "text": "Search our directory to find a certified art appraiser who specializes in your type of artwork.",
        "image": normalizeAssetUrl('https://ik.imagekit.io/appraisily/how-to/find-appraiser.jpg'),
        "url": buildSiteUrl('/')
      },
      {
        "@type": "HowToStep",
        "name": "Contact the appraiser",
        "text": "Reach out to the appraiser to discuss your needs, the purpose of the appraisal, and to schedule an appointment.",
        "image": normalizeAssetUrl('https://ik.imagekit.io/appraisily/how-to/contact-appraiser.jpg')
      },
      {
        "@type": "HowToStep",
        "name": "Get your appraisal",
        "text": "Meet with the appraiser (in-person or virtually) and receive your professional appraisal report with the valuation and detailed description of your artwork.",
        "image": normalizeAssetUrl('https://ik.imagekit.io/appraisily/how-to/receive-appraisal.jpg')
      }
    ]
  };
}
