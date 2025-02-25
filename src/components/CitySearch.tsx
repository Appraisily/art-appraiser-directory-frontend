import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Locate } from 'lucide-react';
import { cities } from '../utils/staticData';

export function CitySearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof cities>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
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
    const filtered = cities.filter(
      city => 
        city.name.toLowerCase().includes(normalizedQuery) || 
        city.state.toLowerCase().includes(normalizedQuery)
    ).slice(0, 5);

    setSuggestions(filtered);
    setIsOpen(true);
  }, [query]);

  const handleLocationClick = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            if (data.city) {
              setQuery(data.city);
              const cityMatch = cities.find(
                c => c.name.toLowerCase() === data.city.toLowerCase()
              );
              if (cityMatch) {
                navigate(`/location/${cityMatch.slug}`);
              }
            }
          } catch (error) {
            console.error('Error getting location:', error);
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
        }
      );
    }
  };

  const handleSelect = (city: typeof cities[0]) => {
    setQuery(`${city.name}, ${city.state}`);
    setIsOpen(false);
    navigate(`/location/${city.slug}`);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter your city..."
        />
        <button
          type="button"
          onClick={handleLocationClick}
          disabled={isLocating}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Locate className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          <ul className="py-1">
            {suggestions.map((city) => (
              <li key={city.slug}>
                <button
                  onClick={() => handleSelect(city)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {city.name}, <span className="text-muted-foreground">{city.state}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}