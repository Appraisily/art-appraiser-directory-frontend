import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { SEO } from '../components/SEO';
import { cities } from '../data/cities.json';

export function NotFoundPage() {
  const popularCities = cities.slice(0, 12);

  return (
    <>
      <SEO
        title="Page Not Found | Art Appraisers Directory"
        description="The page you're looking for doesn't exist. Browse our directory of certified art appraisers by city."
        noIndex
      />
      <div className="flex-1 flex items-center justify-center py-12 md:py-16 mt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-200 mb-3 sm:mb-4">404</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">Page not found</h2>
          <p className="text-gray-600 mb-6 sm:mb-8 px-2">
            The page you're looking for doesn't exist or has been moved.
            Try browsing our directory of certified art appraisers below.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 sm:mb-12">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 min-h-[48px] text-white font-semibold hover:bg-blue-700 transition-colors text-base"
            >
              <Search className="h-5 w-5" />
              Search Appraisers
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-6 sm:pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular cities</h3>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2">
              {popularCities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/location/${city.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 px-4 py-2 min-h-[44px] text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{city.name}, {city.state}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
