export function generateAppraiserSchema(appraiser: any) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": appraiser.name,
    "image": appraiser.image,
    "description": appraiser.about,
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
    "priceRange": "$$$",
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
    "openingHoursSpecification": appraiser.businessHours?.map((hours: any) => ({
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": hours.day,
      "opens": hours.hours.split(' - ')[0],
      "closes": hours.hours.split(' - ')[1]
    })),
    "hasCredential": appraiser.certifications?.map((certification: string) => ({
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "certification",
      "name": certification
    })),
    "knowsAbout": appraiser.specialties?.map((specialty: string) => specialty)
  };
}

export function generateLocationSchema(locationData: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Art Appraisal Services in ${locationData.city}`,
    "description": `Find top-rated art appraisers in ${locationData.city}, ${locationData.state}. Professional art valuation services for insurance, estate planning, donations, and more.`,
    "serviceType": "Art Appraisal",
    "areaServed": {
      "@type": "City",
      "name": locationData.city,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": locationData.city,
        "addressRegion": locationData.state,
        "addressCountry": "US"
      }
    },
    "provider": locationData.appraisers.map((appraiser: any) => ({
      "@type": "ProfessionalService",
      "name": appraiser.name,
      "image": appraiser.image,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": locationData.city,
        "addressRegion": locationData.state,
        "addressCountry": "US"
      },
      "url": `/appraiser/${appraiser.id}`
    })),
    "offers": {
      "@type": "Offer",
      "description": `Professional art appraisal services in ${locationData.city}`,
      "areaServed": {
        "@type": "City",
        "name": locationData.city,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": locationData.city,
          "addressRegion": locationData.state,
          "addressCountry": "US"
        }
      }
    }
  };
}

export function generateFAQSchema(appraiser: any) {
  const services = appraiser.services?.map((s: any) => s.name).join(', ') || '';
  const specialties = appraiser.specialties?.join(', ') || '';
  const certifications = appraiser.certifications?.join(', ') || '';
  const city = appraiser.address?.split(',')[0]?.trim() || '';
  
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
      }
    ]
  };
}

export function generateArticleSchema(pageTitle: string, pageDescription: string, url: string, imageUrl: string = '') {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": pageTitle,
    "description": pageDescription,
    "image": imageUrl || "https://ik.imagekit.io/appraisily/placeholder-art-image.jpg",
    "author": {
      "@type": "Organization",
      "name": "Appraisily",
      "url": "https://appraisily.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Appraisily",
      "logo": {
        "@type": "ImageObject",
        "url": "https://appraisily.com/logo.png"
      }
    },
    "url": url,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "datePublished": new Date().toISOString().split('T')[0],
    "dateModified": new Date().toISOString().split('T')[0]
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