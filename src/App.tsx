import React, { useState } from 'react';
import { MapPin, Star, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CitySearch } from './components/CitySearch';

function App() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 py-12 md:py-16">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-center">
              Find Art Appraisers Near You
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-center">
              Connect with certified art appraisers, get expert valuations, and make informed decisions about your art collection.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
              <CitySearch />
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground hover:bg-primary/90 h-12 px-8 py-2 bg-primary md:w-auto w-full shadow-sm"
                type="submit"
              >
                <Search className="w-4 h-4" />
                Find Appraisers
              </button>
            </form>
          </div>
        </div>

        <main className="container mx-auto px-6 py-12">
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Example Appraiser Card */}
              <a href="/appraiser/metropolitan-art-appraisers">
                <div className="rounded-lg border bg-white text-foreground shadow-sm group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="relative">
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
                      <div style={{ position: 'absolute', inset: 0 }}>
                        <img
                          src="https://images.unsplash.com/photo-1594732832278-abd644401426?auto=format&fit=crop&q=80"
                          alt="Metropolitan Art Appraisers"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-white font-semibold">4.9/5</span>
                        <span className="text-white/80 text-sm">(128 reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                      Metropolitan Art Appraisers
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">New York, NY</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>

            <div className="mt-12 border-t pt-8">
              <h2 className="text-2xl font-semibold mb-4">Find Art Appraisers in Other Cities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <a href="/location/los-angeles" className="text-primary hover:text-primary/80 transition-colors">
                  Appraisers in Los Angeles
                </a>
                <a href="/location/chicago" className="text-primary hover:text-primary/80 transition-colors">
                  Appraisers in Chicago
                </a>
                <a href="/location/miami" className="text-primary hover:text-primary/80 transition-colors">
                  Appraisers in Miami
                </a>
                <a href="/location/san-francisco" className="text-primary hover:text-primary/80 transition-colors">
                  Appraisers in San Francisco
                </a>
                <a href="/location/boston" className="text-primary hover:text-primary/80 transition-colors">
                  Appraisers in Boston
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}

export default App;
