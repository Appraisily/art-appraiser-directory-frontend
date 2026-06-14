import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Locate } from 'lucide-react';
import { cities } from '../utils/staticData';
import { trackEvent } from '../utils/analytics';

export type CitySearchHandle = {
  submitSearch: () => void;
  focusInput: () => void;
};

const SEARCH_REDIRECTS: Record<string, string> = {
  '07832': 'new-york',
  '16510': 'pittsburgh',
  '19087': 'philadelphia',
  '28461': 'raleigh',
  '30189': 'atlanta',
  '32934': 'orlando',
  '35201': 'birmingham',
  '35226': 'birmingham',
  '44839': 'cleveland',
  '45814': 'toledo',
  '46060': 'indianapolis',
  '46311': 'chicago',
  '46375': 'chicago',
  '54601': 'minneapolis',
  '60048': 'chicago',
  '60050': 'chicago',
  '72118': 'little-rock',
  '83301': 'boise',
  '85710': 'tucson',
  '93446': 'los-angeles',
  'lakehurst nj': 'new-york',
  'lakehurst, nj': 'new-york',
  'marietta ga': 'atlanta',
  'marietta, ga': 'atlanta',
  'new jersey': 'new-york',
  'northwest indiana': 'chicago',
  'toms river nj': 'new-york',
  'toms river, nj': 'new-york',
  'toms river nj 08751': 'new-york',
  'toms river, nj 08751': 'new-york',
  'twin falls': 'boise',
};

const normalizeSearchQuery = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ');

export const CitySearch = forwardRef<CitySearchHandle>(function CitySearch(_props, ref) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'info'; message: string } | null>(null);
  const [suggestions, setSuggestions] = useState<typeof cities>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const filtered = cities
      .filter(
        city => 
          city.name.toLowerCase().includes(normalizedQuery) || 
          city.state.toLowerCase().includes(normalizedQuery)
      )
      .sort((a, b) => {
        // Prioritize exact matches and matches at the beginning of the string
        const aNameMatch = a.name.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        const bNameMatch = b.name.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        
        return aNameMatch - bNameMatch || a.name.localeCompare(b.name);
      })
      .slice(0, 5);

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [query]);

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setFeedback({ tone: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsLocating(true);
    setFeedback({ tone: 'info', message: 'Detecting your location...' });
    trackEvent('search_geolocate_request', {
      source: 'hero_directory'
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Find the nearest city from the directory
        let nearestCity: typeof cities[0] | null = null;
        let nearestDistance = Infinity;

        for (const city of cities) {
          if (city.latitude == null || city.longitude == null) continue;
          const dLat = city.latitude - latitude;
          const dLon = city.longitude - longitude;
          const distance = dLat * dLat + dLon * dLon;
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCity = city;
          }
        }

        if (nearestCity) {
          setQuery(`${nearestCity.name}, ${nearestCity.state}`);
          setFeedback({ tone: 'info', message: 'Location detected. Press Enter or click Find Appraisers.' });
          trackEvent('search_geolocate_complete', {
            source: 'hero_directory',
            resolved_city: nearestCity.slug
          });
        } else {
          setFeedback({ tone: 'error', message: 'No nearby city found in our directory.' });
          trackEvent('search_geolocate_no_match', {
            source: 'hero_directory',
            lat: latitude,
            lon: longitude,
          });
        }

        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please enter a city manually.',
          2: 'Location unavailable. Please enter a city manually.',
          3: 'Location request timed out. Please enter a city manually.',
        };
        setFeedback({ tone: 'error', message: messages[err.code] || 'Failed to detect location.' });
        trackEvent('search_geolocate_error', {
          source: 'hero_directory',
          error_code: err.code,
        });
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSelect = (city: typeof cities[0]) => {
    setQuery(`${city.name}, ${city.state}`);
    setIsOpen(false);
    setFeedback(null);
    trackEvent('location_search_select', {
      source: 'hero_directory',
      city_slug: city.slug,
      city_name: city.name,
      state: city.state
    });
    navigate(`/location/${city.slug}`);
  };

  const resolveRedirect = (rawQuery: string) => {
    const normalizedQuery = normalizeSearchQuery(rawQuery);
    const zip = normalizedQuery.match(/\b\d{5}\b/)?.[0];
    const redirectSlug = SEARCH_REDIRECTS[normalizedQuery] || (zip ? SEARCH_REDIRECTS[zip] : undefined);
    if (!redirectSlug) return null;
    return cities.find((city) => city.slug === redirectSlug) || null;
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      return;
    }

    const rawQuery = query.trim();
    if (rawQuery.length === 0) {
      setFeedback({ tone: 'error', message: 'Enter a city or state to search.' });
      inputRef.current?.focus();
      return;
    }

    const redirectMatch = resolveRedirect(rawQuery);
    if (redirectMatch) {
      trackEvent('location_search_alias_redirect', {
        source: 'hero_directory',
        query: rawQuery,
        city_slug: redirectMatch.slug,
        city_name: redirectMatch.name,
        state: redirectMatch.state
      });
      handleSelect(redirectMatch);
      return;
    }

    trackEvent('search_no_results', {
      source: 'hero_directory',
      query: rawQuery
    });
    setFeedback({ tone: 'error', message: 'No matching city found. Try a nearby city or state.' });
  };

  const submitSearch = () => {
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      return;
    }

    const rawQuery = inputRef.current?.value ?? query;
    const normalizedQuery = rawQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      setFeedback({ tone: 'error', message: 'Enter a city or state to search.' });
      inputRef.current?.focus();
      return;
    }

    const namePart = normalizedQuery.split(',')[0]?.trim();
    const directMatch = cities.find((city) => {
      const name = city.name.toLowerCase();
      return name === normalizedQuery || (namePart && name === namePart);
    });

    if (directMatch) {
      handleSelect(directMatch);
      return;
    }

    const redirectMatch = resolveRedirect(rawQuery);
    if (redirectMatch) {
      trackEvent('location_search_alias_redirect', {
        source: 'hero_directory',
        query: rawQuery.trim(),
        city_slug: redirectMatch.slug,
        city_name: redirectMatch.name,
        state: redirectMatch.state
      });
      handleSelect(redirectMatch);
      return;
    }

    trackEvent('search_no_results', {
      source: 'hero_directory',
      query: rawQuery.trim()
    });
    setFeedback({ tone: 'error', message: 'No matching city found. Try a nearby city or state.' });
    inputRef.current?.focus();
  };

  useImperativeHandle(ref, () => ({
    submitSearch,
    focusInput: () => inputRef.current?.focus()
  }));

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    // split with a capturing group gives: [non-match, match, non-match, match, ...]
    return parts.map((part, index) =>
      index % 2 === 1
        ? <span key={index} className="bg-primary/20 text-primary font-semibold">{part}</span>
        : <span key={index}>{part}</span>
    );
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="w-full h-12 pl-10 pr-12 rounded-lg border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
          placeholder="Enter city or state"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (feedback) {
              setFeedback(null);
            }
          }}
          onFocus={() => {
            if (query && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-invalid={feedback?.tone === 'error' ? true : undefined}
        />
        <button
          type="button"
          onClick={handleLocationClick}
          disabled={isLocating}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary transition-colors"
        >
          {isLocating ? (
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Locate className="h-5 w-5" />
          )}
        </button>
      </div>
      {feedback && (
        <div
          className={`mt-2 text-sm ${feedback.tone === 'error' ? 'text-red-600' : 'text-blue-600'}`}
          role="status"
          aria-live="polite"
        >
          {feedback.message}
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="relative z-10 w-full mt-1 bg-white rounded-lg shadow-lg overflow-hidden border border-border animate-fadeInUp md:absolute">
          <ul className="py-1 divide-y divide-gray-100">
            {suggestions.map((city) => (
              <li 
                key={city.slug}
                onClick={() => handleSelect(city)}
                className="px-4 py-3 cursor-pointer hover:bg-primary/5 transition-colors flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <div>
                  <div className="font-medium">
                    {highlightMatch(city.name, query)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {city.state}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});
