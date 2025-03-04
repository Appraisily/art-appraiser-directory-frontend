export function generateAppraiserSchema(appraiser: any) {
  // Normalize business hours if available
  const formattedHours = appraiser.businessHours?.map((hours: any) => ({
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": hours.day,
    "opens": hours.hours.split(' - ')[0],
    "closes": hours.hours.split(' - ')[1]
  })) || [];

  // Generate price range indicator if exact prices aren't available
  const priceRange = appraiser.priceRange || (
    appraiser.services?.some((s: any) => 
      (s.price && parseInt(s.price.replace(/[^0-9]/g, '')) > 500)
    ) ? "$$$" : "$$"
  );

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://art-appraiser.appraisily.com/appraiser/${appraiser.id}`,
    "name": appraiser.name,
    "alternateName": appraiser.businessName || undefined,
    "image": {
      "@type": "ImageObject",
      "url": appraiser.image,
      "width": 800,
      "height": 600,
      "caption": `${appraiser.name} - Art Appraiser`
    },
    "description": appraiser.about,
    "foundingDate": appraiser.yearEstablished,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": appraiser.address.split(',')[0].trim(),
      "addressLocality": appraiser.address.split(',')[0].trim(),
      "addressRegion": appraiser.address.split(',')[1]?.trim() || "",
      "postalCode": appraiser.postalCode || "",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": appraiser.latitude,
      "longitude": appraiser.longitude
    },
    "url": appraiser.website,
    "telephone": appraiser.phone,
    "email": appraiser.email,
    "sameAs": [
      appraiser.socialLinks?.facebook || "",
      appraiser.socialLinks?.instagram || "",
      appraiser.socialLinks?.linkedin || "",
      appraiser.socialLinks?.twitter || ""
    ].filter(url => url !== ""),
    "priceRange": priceRange,
    "paymentAccepted": appraiser.paymentMethods || "Cash, Credit Card",
    "openingHoursSpecification": formattedHours,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": appraiser.rating.toString(),
      "reviewCount": appraiser.reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": appraiser.reviews?.map((review: any) => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "datePublished": review.date,
      "reviewBody": review.content
    })),
    "makesOffer": appraiser.services?.map((service: any) => ({
      "@type": "Offer",
      "name": service.name,
      "description": service.description,
      "price": service.price.replace(/[^0-9]/g, ''),
      "priceCurrency": "USD"
    })),
    "hasCredential": appraiser.certifications?.map((certification: string) => ({
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "certification",
      "name": certification
    })),
    "knowsAbout": appraiser.specialties?.map((specialty: string) => specialty),
    "areaServed": {
      "@type": "City",
      "name": appraiser.address.split(',')[0].trim(),
      "containedInPlace": {
        "@type": "State",
        "name": appraiser.address.split(',')[1]?.trim() || ""
      }
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Art Appraisal Services",
      "itemListElement": appraiser.services?.map((service: any, index: number) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": service.name,
          "description": service.description
        },
        "position": index + 1
      }))
    },
    "additionalType": "https://schema.org/ProfessionalService",
    "isAccessibleForFree": false
  };
}

export function generateLocationSchema(locationData: any) {
  // Add safety check for locationData
  if (!locationData) {
    console.error('Cannot generate location schema: locationData is undefined');
    return {};
  }
  
  // Create a safe slug value
  const safeCity = locationData.city || 'unknown-location';
  const safeSlug = (locationData.slug || safeCity.toLowerCase().replace(/\s+/g, '-'));
  const stateCode = locationData.state || 'USA';
  
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://art-appraiser.appraisily.com/location/${safeSlug}`,
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
    "provider": Array.isArray(locationData.appraisers) ? locationData.appraisers.map((appraiser: any) => ({
      "@type": "LocalBusiness",
      "name": appraiser?.name || 'Art Appraiser',
      "image": appraiser?.image || '',
      "address": {
        "@type": "PostalAddress",
        "addressLocality": safeCity,
        "addressRegion": stateCode,
        "addressCountry": "US"
      },
      "priceRange": appraiser?.pricing || "$$-$$$",
      "telephone": appraiser?.phone || "",
      "url": `https://art-appraiser.appraisily.com/appraiser/${appraiser?.id || 'unknown'}`,
      "sameAs": appraiser?.website || ""
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
      "@id": `https://art-appraiser.appraisily.com/location/${safeSlug}`
    }
  };
}

export function generateFAQSchema(appraiser: any) {
  const services = appraiser.services?.map((s: any) => s.name).join(', ') || '';
  const specialties = appraiser.specialties?.join(', ') || '';
  const certifications = appraiser.certifications?.join(', ') || '';
  const city = appraiser.address?.split(',')[0]?.trim() || appraiser.city || '';
  const state = appraiser.address?.split(',')[1]?.trim() || '';
  
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
          "text": appraiser.services?.some((s: any) => s.price) 
            ? `Art appraisal services with ${appraiser.name} start at ${appraiser.services.reduce((min: any, s: any) => 
              (s.price && (!min || parseFloat(s.price.replace(/[^0-9.]/g, '')) < parseFloat(min.replace(/[^0-9.]/g, '')))) 
                ? s.price : min, null) || 'competitive rates'}.` 
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
          "text": `${appraiser.name} is highly rated with ${appraiser.rating} stars and ${appraiser.reviewCount} reviews, making them one of the most respected art appraisers in ${city}${state ? ', ' + state : ''}. Their expertise in ${specialties || 'various art forms'} has earned them a strong reputation in the local community.`
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
    "image": imageUrl || "https://ik.imagekit.io/appraisily/placeholder-art-image.jpg",
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
      "url": "https://art-appraiser.appraisily.com/"
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
        "image": "https://ik.imagekit.io/appraisily/how-to/document-artwork.jpg",
        "url": "https://appraisily.com/how-to-document-artwork"
      },
      {
        "@type": "HowToStep",
        "name": "Gather documentation",
        "text": "Collect any existing documentation about your artwork, including receipts, certificates of authenticity, provenance documents, and restoration records.",
        "image": "https://ik.imagekit.io/appraisily/how-to/gather-documentation.jpg",
        "url": "https://appraisily.com/artwork-documentation"
      },
      {
        "@type": "HowToStep",
        "name": "Find a qualified appraiser",
        "text": "Search our directory to find a certified art appraiser who specializes in your type of artwork.",
        "image": "https://ik.imagekit.io/appraisily/how-to/find-appraiser.jpg",
        "url": "https://art-appraiser.appraisily.com"
      },
      {
        "@type": "HowToStep",
        "name": "Contact the appraiser",
        "text": "Reach out to the appraiser to discuss your needs, the purpose of the appraisal, and to schedule an appointment.",
        "image": "https://ik.imagekit.io/appraisily/how-to/contact-appraiser.jpg"
      },
      {
        "@type": "HowToStep",
        "name": "Get your appraisal",
        "text": "Meet with the appraiser (in-person or virtually) and receive your professional appraisal report with the valuation and detailed description of your artwork.",
        "image": "https://ik.imagekit.io/appraisily/how-to/receive-appraisal.jpg"
      }
    ]
  };
}