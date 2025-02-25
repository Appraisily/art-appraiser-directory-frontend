export function generateAppraiserSchema(appraiser: any) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": appraiser.name,
    "image": appraiser.image,
    "description": appraiser.about,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": appraiser.address.split(',')[0].trim(),
      "addressRegion": appraiser.address.split(',')[1].trim(),
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
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": appraiser.rating.toString(),
      "reviewCount": appraiser.reviewCount.toString()
    },
    "review": appraiser.reviews?.map((review: any) => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString()
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
    }))
  };
}

export function generateLocationSchema(locationData: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Art Appraisal Services in ${locationData.city}`,
    "serviceType": "Art Appraisal",
    "areaServed": {
      "@type": "City",
      "name": locationData.city,
      "state": locationData.state
    },
    "provider": locationData.appraisers.map((appraiser: any) => ({
      "@type": "LocalBusiness",
      "name": appraiser.name,
      "image": appraiser.image,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": locationData.city,
        "addressRegion": locationData.state,
        "addressCountry": "US"
      }
    }))
  };
}

export function generateFAQSchema(appraiser: any) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What services does ${appraiser.name} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": appraiser.services?.map((s: any) => s.name).join(', ')
        }
      },
      {
        "@type": "Question",
        "name": `What are ${appraiser.name}'s specialties?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": appraiser.specialties.join(', ')
        }
      },
      {
        "@type": "Question",
        "name": `What certifications does ${appraiser.name} have?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": appraiser.certifications?.join(', ')
        }
      }
    ]
  };
}