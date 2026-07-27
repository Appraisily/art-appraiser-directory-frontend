import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SEO } from '../components/SEO';

export function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found | Art Appraisers Directory"
        description="The page you're looking for doesn't exist. Browse the directory's reviewed art appraiser locations."
        noIndex
      />
      <div className="flex-1 flex items-center justify-center py-12 md:py-16 mt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-200 mb-3 sm:mb-4">404</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">Page not found</h2>
          <p className="text-gray-600 mb-6 sm:mb-8 px-2">
            The page you're looking for doesn't exist or has been moved.
            Try browsing the directory's source-reviewed provider profiles.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 sm:mb-12">
            <Link
              to="/location/"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-blue-200 px-5 py-3 text-base font-semibold text-blue-700 transition-colors hover:bg-blue-50"
              data-clarity-action="not_found_browse"
              data-gtm-surface="not_found"
              data-gtm-cta="browse_reviewed_locations"
            >
              <Search className="h-5 w-5" />
              Browse reviewed locations
            </Link>
            <a
              href="https://appraisily.com/start?utm_source=art_directory&utm_medium=not_found&utm_campaign=directory_recovery"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
              data-clarity-action="not_found_appraisily"
              data-gtm-surface="not_found"
              data-gtm-cta="online_appraisal"
            >
              Get an online appraisal from Appraisily
            </a>
          </div>

          <p className="border-t border-gray-200 pt-6 text-sm text-gray-600 sm:pt-8">
            The directory does not publish generic city pages without independent, sourced local
            guidance.
          </p>
        </div>
      </div>
    </>
  );
}
