import React from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { getLocation } from '../utils/staticData';
import { SEO } from '../components/SEO';
import { generateLocationSchema } from '../utils/schemaGenerators';

export type Appraiser = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  address: string;
  specialties: string[];
};

export function LocationPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  console.log('LocationPage - citySlug:', citySlug);
  const locationData = citySlug ? getLocation(citySlug) : null;
  console.log('LocationPage - locationData:', locationData);

  const cityName = citySlug
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
    
  const generateBreadcrumbSchema = () => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://appraisily.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Art Appraisers in ${cityName}`,
        "item": `https://appraisily.com/location/${citySlug}`
      }
    ]
  });

  if (!locationData) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">Location not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={locationData.seo?.title || `Art Appraisers in ${cityName} | Expert Art Valuation Services`}
        description={locationData.seo?.description || `Find certified art appraisers in ${cityName}. Get expert art valuations, authentication services, and professional advice for your art collection.`}
        keywords={[
          ...(locationData.seo?.keywords || []),
          `art appraisers ${cityName.toLowerCase()}`,
          `art valuation ${cityName.toLowerCase()}`,
          `art authentication ${locationData.state?.toLowerCase() || 'usa'}`,
          `fine art appraisal ${cityName.toLowerCase()}`
        ]}
        schema={[
          locationData.seo?.schema || {},
          generateBreadcrumbSchema(),
          generateLocationSchema(locationData)
        ]}
        canonicalUrl={`https://appraisily.com/location/${citySlug}`}
      />

      <div className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
          <div className="container mx-auto px-6">
            <h1 key="page-title" className="text-4xl font-bold text-foreground mb-4">
              Art Appraisers in {cityName}
            </h1>
            <p key="page-description" className="text-lg text-muted-foreground max-w-2xl">
              Connect with certified art appraisers in {cityName}. Get expert valuations,
              authentication services, and professional advice for your art collection.
            </p>
          </div>
        </div>

        <main className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {locationData.appraisers.map((appraiser, index) => (
                <a key={`appraiser-${appraiser.id || appraiser.name}-${index}`} href={`/appraiser/${appraiser.id}`}>
                  <div className="rounded-lg border bg-white text-foreground shadow-sm group overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative">
                      <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
                        <div style={{ position: 'absolute', inset: 0 }}>
                          <img
                            src={appraiser.image}
                            alt={appraiser.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-white font-semibold">{appraiser.rating}/5</span>
                          <span className="text-white/80 text-sm">({appraiser.reviewCount} reviews)</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                        {appraiser.name}
                      </h2>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm truncate">{appraiser.address}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Array.isArray(appraiser.specialties) && appraiser.specialties.map((specialty, index) => (
                          <span
                            key={`${appraiser.id || appraiser.name}-${specialty}-${index}`}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </main>
      </div>
    </>
  );
}