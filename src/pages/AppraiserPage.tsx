import React from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Mail, Phone, Globe, Clock, Award, Shield } from 'lucide-react';
import { getAppraiser } from '../utils/staticData';
import { SEO } from '../components/SEO';
import { generateAppraiserSchema, generateFAQSchema } from '../utils/schemaGenerators';

type Appraiser = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  address: string;
  phone: string;
  email: string;
  website: string;
  specialties: string[];
  certifications: string[];
  businessHours: {
    day: string;
    hours: string;
  }[];
  about: string;
  services: {
    name: string;
    description: string;
    price: string;
  }[];
  reviews: {
    id: string;
    author: string;
    rating: number;
    date: string;
    content: string;
  }[];
};

export function AppraiserPage() {
  const { appraiserId } = useParams<{ appraiserId: string }>();
  const appraiser = appraiserId ? getAppraiser(appraiserId) : null;

  const generateBreadcrumbSchema = (appraiser: any) => ({
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
        "name": `Art Appraisers in ${appraiser.address.split(',')[0].trim()}`,
        "item": `https://appraisily.com/location/${appraiser.address.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": appraiser.name,
        "item": `https://appraisily.com/appraiser/${appraiserId}`
      }
    ]
  });

  if (!appraiser) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-muted-foreground">Appraiser not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${appraiser.name} - Art Appraiser | Expert Art Valuation Services | Appraisily`}
        description={`Get professional art appraisal services from ${appraiser.name}. Specializing in ${appraiser.specialties.join(', ')}. Certified expert with ${appraiser.reviewCount} verified reviews.`}
        keywords={[
          `${appraiser.name.toLowerCase()} art appraiser`,
          `art appraisal ${appraiser.address.split(',')[0].toLowerCase()}`,
          ...appraiser.specialties.map(s => s.toLowerCase()),
          'art valuation',
          'art authentication',
          'certified art appraiser'
        ]}
        schema={[
          generateAppraiserSchema(appraiser),
          generateBreadcrumbSchema(appraiser),
          generateFAQSchema(appraiser)
        ]}
        canonicalUrl={`https://appraisily.com/appraiser/${appraiserId}`}
      />

      <div className="flex-1">
        <div className="relative h-[300px] md:h-[400px]">
          <img
            src={appraiser.image}
            alt={appraiser.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-6 -mt-16 relative z-10">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{appraiser.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-400" />
                    <span className="font-semibold">{appraiser.rating}/5</span>
                    <span className="text-muted-foreground">({appraiser.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{appraiser.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`mailto:${appraiser.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact
                </a>
                <a
                  href={`tel:${appraiser.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call Now
                </a>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-muted-foreground">{appraiser.about}</p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Services</h2>
                  <div className="space-y-4">
                    {appraiser.services?.map((service) => (
                      <div key={service.name} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <span className="text-primary font-medium">{service.price}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {appraiser.reviews?.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{review.author}</span>
                          <span className="text-sm text-muted-foreground">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-muted-foreground">{review.content}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Website:</strong>{' '}
                      <a href={appraiser.website} className="text-primary hover:underline">
                        {appraiser.website.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                    <p>
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${appraiser.email}`} className="text-primary hover:underline">
                        {appraiser.email}
                      </a>
                    </p>
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href={`tel:${appraiser.phone}`} className="text-primary hover:underline">
                        {appraiser.phone}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Business Hours
                  </h3>
                  <div className="space-y-2 text-sm">
                    {appraiser.businessHours?.map((hours) => (
                      <div key={hours.day} className="flex justify-between">
                        <span>{hours.day}</span>
                        <span className="text-muted-foreground">{hours.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {appraiser.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Certifications
                  </h3>
                  <div className="space-y-2 text-sm">
                    {appraiser.certifications?.map((certification) => (
                      <div key={certification} className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-primary" />
                        <span>{certification}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}