import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import { getStandardizedLocation, StandardizedAppraiser, StandardizedLocation } from '../utils/standardizedData';
import { SEO } from '../components/SEO';
import { generateLocationSchema } from '../utils/schemaGenerators';
import { SITE_URL, buildSiteUrl, getPrimaryCtaUrl } from '../config/site';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../config/assets';
import { trackEvent } from '../utils/analytics';
import { cities as directoryCities } from '../data/cities.json';
import { normalizeAssetUrl } from '../utils/assetUrls';

type DirectoryCity = {
  name: string;
  state: string;
  slug: string;
  latitude?: number;
  longitude?: number;
};

function estimateDistanceKm(fromCity: DirectoryCity, toCity: DirectoryCity): number {
  if (
    typeof fromCity.latitude !== 'number' ||
    typeof fromCity.longitude !== 'number' ||
    typeof toCity.latitude !== 'number' ||
    typeof toCity.longitude !== 'number'
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(toCity.latitude - fromCity.latitude);
  const dLon = toRad(toCity.longitude - fromCity.longitude);
  const lat1 = toRad(fromCity.latitude);
  const lat2 = toRad(toCity.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function StandardizedLocationPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [locationData, setLocationData] = useState<StandardizedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const primaryCtaUrl = getPrimaryCtaUrl();
  const getAppraiserPath = (appraiser: StandardizedAppraiser) =>
    `/appraiser/${appraiser.id || appraiser.slug}`;

  const validCitySlug = typeof citySlug === 'string' ? citySlug : '';
  const cityMeta = useMemo(
    () => directoryCities.find(city => city.slug === validCitySlug) ?? null,
    [validCitySlug]
  );

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

  useEffect(() => {
    if (!locationData || locationData.appraisers.length === 0) {
      return;
    }

    trackEvent('view_item_list', {
      page_type: 'location',
      city_slug: validCitySlug,
      city_name: cityMeta?.name,
      state: cityMeta?.state,
      items: locationData.appraisers.slice(0, 25).map(appraiser => ({
        item_id: appraiser.id || appraiser.slug,
        item_name: appraiser.name,
        city: appraiser.address.city,
        state: appraiser.address.state,
        rating: appraiser.business.rating,
        review_count: appraiser.business.reviewCount
      }))
    });
  }, [cityMeta, locationData, validCitySlug]);
  const cityName = useMemo(() => {
    if (cityMeta) {
      return `${cityMeta.name}, ${cityMeta.state}`;
    }

    if (!validCitySlug) {
      return 'Location';
    }

    return validCitySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [cityMeta, validCitySlug]);
  const citySearchName = useMemo(() => {
    if (cityMeta?.name) return cityMeta.name;
    return cityName.split(',')[0]?.trim() || cityName;
  }, [cityMeta, cityName]);
  const topSpecialties = useMemo(() => {
    if (!locationData?.appraisers?.length) return [];
    const counts = new Map<string, number>();
    locationData.appraisers.forEach(appraiser => {
      appraiser.expertise.specialties.forEach(specialty => {
        counts.set(specialty, (counts.get(specialty) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([specialty]) => specialty);
  }, [locationData]);
  const relatedCities = useMemo(() => {
    const typedCities = directoryCities as DirectoryCity[];
    const fallback = typedCities
      .filter(city => city.slug !== validCitySlug)
      .slice(0, 6);

    if (!cityMeta?.state) {
      return fallback;
    }

    const sameStateCities = typedCities.filter(
      city => city.slug !== validCitySlug && city.state === cityMeta.state
    );

    if (sameStateCities.length === 0) {
      return fallback;
    }

    const origin = cityMeta as DirectoryCity;
    return sameStateCities
      .map(city => ({
        city,
        distanceKm: estimateDistanceKm(origin, city),
      }))
      .sort((a, b) => {
        if (a.distanceKm !== b.distanceKm) {
          return a.distanceKm - b.distanceKm;
        }
        return a.city.name.localeCompare(b.city.name);
      })
      .slice(0, 6)
      .map(item => item.city);
  }, [cityMeta, validCitySlug]);
  const seoKeywords = useMemo(
    () => [
      `art appraisers in ${citySearchName}`,
      `${citySearchName} art appraisers`,
      `${citySearchName} art appraisal`,
      `art appraisal ${citySearchName}`,
      `art appraiser near ${citySearchName}`,
      'art appraisers near me',
      'art appraisal near me',
      'online art appraisal',
    ],
    [citySearchName]
  );

  const generateBreadcrumbSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: `Art Appraisers in ${cityName}`,
        item: buildSiteUrl(`/location/${validCitySlug}`)
      }
    ]
  });

  const seoTitle = `Art Appraisers in ${cityName} | In-Person & Online Art Appraisal`;
  const seoDescription = locationData?.appraisers?.length
    ? `Compare ${locationData.appraisers.length} art appraisers in ${cityName}. See specialties, reviews, and contact details, then choose local in-person service or start online.`
    : `Find art appraisers in ${cityName}. Compare local professionals and start an online appraisal with Appraisily for a faster turnaround.`;
  const generateLocationFaqSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Do you offer in-person art appraisals in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This directory lists local art appraisers in ${cityName}. You can contact them directly for in-person services, or use Appraisily for an online appraisal.`,
        },
      },
      {
        '@type': 'Question',
        name: 'How does an online art appraisal work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Upload photos, measurements, and provenance details. Our team reviews your submission and sends a written valuation report online.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the typical turnaround time?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Online appraisals are usually faster than scheduling in-person appointments. Timing depends on item complexity.',
        },
      },
      {
        '@type': 'Question',
        name: `What should I prepare before contacting an appraiser in ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Prepare clear photos, dimensions, condition notes, signatures or maker marks, and any purchase or provenance documents.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I compare local and online appraisal options?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes. Use this directory to compare local providers in ${cityName}, then decide whether in-person or online service is the better fit for your timeline.`,
        },
      },
    ],
  });

  const handleAppraiserCardClick = (appraiser: StandardizedAppraiser, placement: string) => {
    trackEvent('appraiser_card_click', {
      placement,
      appraiser_slug: appraiser.slug,
      appraiser_name: appraiser.name,
      city: appraiser.address.city,
      state: appraiser.address.state
    });
  };

  const handleLocationCtaClick = (placement: string) => {
    trackEvent('cta_click', {
      placement,
      destination: primaryCtaUrl,
      city_slug: validCitySlug
    });
  };
  const handleRelatedCityClick = (relatedCity: DirectoryCity, placement: string) => {
    trackEvent('related_city_click', {
      placement,
      city_slug: validCitySlug,
      city_name: citySearchName,
      related_city_slug: relatedCity.slug,
      related_city_name: relatedCity.name,
      related_city_state: relatedCity.state,
    });
  };

  const breadcrumbSchema = generateBreadcrumbSchema();
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
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

  if (error || !locationData || !locationData.appraisers || locationData.appraisers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <SEO 
          title={`Art Appraisers in ${cityName} | Find Local Art Appraisal Services`}
          description={`We're currently updating our list of art appraisers in ${cityName}. Browse our directory for other locations or check back soon.`}
          schema={[breadcrumbSchema]}
          path={`/location/${validCitySlug}`}
        />
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Art Appraisers in {cityName}</h1>
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg mb-6">
            <p className="font-medium">We're currently updating our database of art appraisers in {cityName}.</p>
            <p className="mt-2">Please check back soon or explore other cities in our directory.</p>
          </div>
          <a href={SITE_URL} className="text-blue-600 hover:underline font-medium">
            Browse all locations
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        schema={[
          generateLocationSchema(locationData, cityName, validCitySlug),
          breadcrumbSchema,
          generateLocationFaqSchema(),
        ]}
        path={`/location/${validCitySlug}`}
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-lg mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-blue-700 mb-2">Need art appraisal help quickly?</p>
              <h1 className="text-3xl font-bold mb-3">Art Appraisers in {cityName}</h1>
              <p className="text-gray-600">
                Compare local providers in {cityName}, then choose in-person service or Appraisily&rsquo;s online appraisal for
                a faster start.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={primaryCtaUrl}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
                data-gtm-event="cta_click"
                data-gtm-placement="location_hero_primary"
                onClick={() => handleLocationCtaClick('location_hero_primary')}
              >
                Start an online appraisal
              </a>
              <a
                href="#local-appraisers"
                className="inline-flex items-center justify-center rounded-md border border-blue-200 px-5 py-3 text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
                data-gtm-event="cta_click"
                data-gtm-placement="location_hero_secondary"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById('local-appraisers')?.scrollIntoView({ behavior: 'smooth' });
                  window.history.replaceState(
                    null,
                    '',
                    `${window.location.pathname}${window.location.search}#local-appraisers`
                  );
                }}
              >
                See local appraisers
              </a>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-1">Insurance-ready valuations</p>
              <p>Compare appraisers who support insurance, estate, and donation needs.</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-1">Local + online options</p>
              <p>Choose in-person expertise in {cityName} or use Appraisily online.</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="font-semibold text-gray-900 mb-1">Faster decision path</p>
              <p>Review specialties and ratings first, then contact the right appraiser.</p>
            </div>
          </div>
        </div>

        {locationData.appraisers.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-2">Art appraisal snapshot for {cityName}</h2>
            <p className="text-gray-600">
              We currently list {locationData.appraisers.length} art appraisers in {cityName}.
              {topSpecialties.length > 0 && ` Popular specialties include ${topSpecialties.join(', ')}.`}
            </p>
          </div>
        )}

        {relatedCities.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold mb-2">
              More art appraisal directories near {cityMeta?.state || citySearchName}
            </h2>
            <p className="text-gray-600">
              Explore nearby city pages to compare additional art appraisal providers and availability.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedCities.map(city => (
                <a
                  key={city.slug}
                  href={buildSiteUrl(`/location/${city.slug}`)}
                  className="inline-flex items-center rounded-full border border-blue-200 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-50"
                  data-gtm-event="related_city_click"
                  data-gtm-placement="location_related_cities"
                  data-gtm-city={city.slug}
                  onClick={() => handleRelatedCityClick(city, 'location_related_cities')}
                >
                  {city.name}, {city.state}
                </a>
              ))}
            </div>
          </div>
        )}

        <div id="local-appraisers" className="mb-6">
          <h2 className="text-2xl font-semibold">Local art appraisers in {cityName}</h2>
          <p className="text-gray-600 mt-2">
            Compare profiles below to shortlist the best fit for your valuation requirements.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locationData.appraisers.map((appraiser) => (
            <div key={appraiser.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <a 
                href={buildSiteUrl(getAppraiserPath(appraiser))}
                className="block"
                data-gtm-event="appraiser_card_click"
                data-gtm-appraiser={appraiser.id || appraiser.slug}
                data-gtm-placement="location_results"
                onClick={() => handleAppraiserCardClick(appraiser, 'location_results')}
              >
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img 
                    src={normalizeAssetUrl(appraiser.imageUrl)} 
                    alt={`${appraiser.name} - Art Appraiser in ${appraiser.address.city}`}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 hover:text-blue-600 transition-colors">
                    {appraiser.name}
                  </h2>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{appraiser.address.formatted}</span>
                  </div>
                  
                  {appraiser.business.reviewCount > 0 && appraiser.business.rating > 0 ? (
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="ml-1 text-gray-700">{appraiser.business.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-gray-500 ml-2">
                        ({appraiser.business.reviewCount} reviews)
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mb-3">Reviews not available</div>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-1">
                      {appraiser.expertise.specialties.slice(0, 3).map((specialty) => (
                        <span 
                          key={specialty}
                          className="inline-block bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 text-xs mb-1"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <span className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
                      View Profile
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
        
        {locationData.appraisers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600">No art appraisers found in {cityName} yet. Check back soon!</p>
          </div>
        )}
        
        <div className="mt-12 bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Need an appraisal without the wait?</h2>
          <p className="text-gray-600 mb-4">
            Appraisily delivers online art valuations backed by research and market data. Start online first, then decide if you
            still need an in-person visit.
          </p>
          <a 
            href={primaryCtaUrl}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            data-gtm-event="cta_click"
            data-gtm-placement="location_footer"
            onClick={() => handleLocationCtaClick('location_footer')}
          >
            Request an online appraisal
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">FAQ for {cityName} art appraisals</h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <p className="font-semibold text-gray-900">Do you offer in-person appraisals in {cityName}?</p>
              <p>
                Use this directory to contact local providers directly, or request an online appraisal from Appraisily if you
                prefer a faster process.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">How does an online art appraisal work?</p>
              <p>Share photos, measurements, and provenance. Our team reviews the submission and returns a written valuation.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">What should I prepare before requesting an appraisal?</p>
              <p>Provide multiple photos, dimensions, condition notes, and any signatures, labels, or ownership history.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Can I still use a local appraiser?</p>
              <p>Yes. Browse the local profiles above if you prefer in-person services in {cityName}.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
