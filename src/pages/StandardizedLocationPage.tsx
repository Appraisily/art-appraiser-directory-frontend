import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, Globe, Clock } from 'lucide-react';
import { getStandardizedLocation, StandardizedAppraiser, StandardizedLocation } from '../utils/standardizedData';
import { SEO } from '../components/SEO';
import { generateLocationSchema } from '../utils/schemaGenerators';

export function StandardizedLocationPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [locationData, setLocationData] = useState<StandardizedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Make sure we have a valid citySlug before proceeding
  const validCitySlug = typeof citySlug === 'string' ? citySlug : '';
  
  // Fetch location data when component mounts or citySlug changes
  useEffect(() => {
    async function fetchData() {
      if (!validCitySlug) {
        setError('Invalid city slug');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await getStandardizedLocation(validCitySlug);
        if (data) {
          setLocationData(data);
        } else {
          setError(`No data found for ${validCitySlug}`);
        }
      } catch (err) {
        console.error('Error fetching location data:', err);
        setError('Failed to load location data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [validCitySlug]);

  // Safely transform city slug to display name
  const cityName = validCitySlug
    ? validCitySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : 'Location';
    
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
        "item": `https://appraisily.com/location/${validCitySlug}`
      }
    ]
  });

  const seoTitle = `Top Art Appraisers in ${cityName} | Expert Art Valuation Services`;
  const seoDescription = `Find the best certified art appraisers in ${cityName}. Get expert art valuations, authentication services, and professional advice from trusted local professionals.`;
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Loading {cityName} Art Appraisers...</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !locationData || !locationData.appraisers) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO 
          title={`Art Appraisers Directory | ${cityName}`}
          description={`We couldn't find art appraisers in ${cityName}. Browse our directory for other locations.`}
        />
        <h1 className="text-2xl font-bold mb-4">Art Appraisers in {cityName}</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error || `No art appraisers found in ${cityName}.`}
        </div>
        <Link to="/" className="text-blue-600 hover:underline">
          Browse all locations
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        schema={[
          generateLocationSchema(cityName, validCitySlug),
          generateBreadcrumbSchema()
        ]}
      />
      
      <h1 className="text-3xl font-bold mb-2">Art Appraisers in {cityName}</h1>
      <p className="text-gray-600 mb-6">
        Find certified art appraisers specializing in various types of artwork and collectibles
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locationData.appraisers.map((appraiser) => (
          <div key={appraiser.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <Link to={`/appraiser/${appraiser.slug}`} className="block">
              <div className="h-48 bg-gray-200 overflow-hidden">
                <img 
                  src={appraiser.imageUrl} 
                  alt={`${appraiser.name} - Art Appraiser in ${appraiser.address.city}`}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-gray-900">{appraiser.name}</h2>
                
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{appraiser.address.formatted}</span>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="ml-1 text-gray-700">{appraiser.business.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    ({appraiser.business.reviewCount} reviews)
                  </span>
                </div>
                
                <div className="space-y-2">
                  {appraiser.expertise.specialties.slice(0, 3).map((specialty, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-blue-50 text-blue-700 rounded-full px-2 py-1 text-xs mr-2 mb-2"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link 
                    to={`/appraiser/${appraiser.slug}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                  >
                    View Profile
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}