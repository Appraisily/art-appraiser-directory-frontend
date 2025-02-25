import React, { useState } from 'react';
import { MapPin, Star, Search, Palette, Award, Badge, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CitySearch } from './components/CitySearch';

function App() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1">
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-blue-50 py-20 md:py-28">
        <div className="container mx-auto px-6 relative">
          {/* Decorative Elements */}
          <div className="absolute top-1/4 left-10 w-12 h-12 bg-primary/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/4 right-10 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
          <div className="absolute top-3/4 left-1/3 w-8 h-8 bg-primary/30 rounded-full blur-lg"></div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-center leading-tight">
            Find <span className="text-primary">Art Appraisers</span> Near You
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-center">
            Connect with certified art appraisers, get expert valuations, and make informed decisions about your art collection.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto relative z-10 bg-white p-2 rounded-lg shadow-lg">
            <CitySearch />
            <button
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground hover:bg-primary/90 h-12 px-8 py-2 bg-primary md:w-auto w-full shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300"
              type="submit"
            >
              <Search className="w-4 h-4" />
              Find Appraisers
            </button>
          </form>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Appraisily?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Palette className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Appraisers</h3>
              <p className="text-muted-foreground">Access to certified art professionals with years of experience.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Accurate Valuations</h3>
              <p className="text-muted-foreground">Precise art valuations based on current market trends.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Turnaround</h3>
              <p className="text-muted-foreground">Fast appraisal services to meet your timeline needs.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Badge className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Reviews</h3>
              <p className="text-muted-foreground">Read authentic feedback from clients who've used our services.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Appraisers Section */}
      <main className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-10 text-center">Featured Art Appraisers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Example Appraiser Card - Enhanced */}
          <a href="/appraiser/metropolitan-art-appraisers-chicago" className="group">
            <div className="rounded-xl border border-gray-200 bg-white text-foreground shadow-sm overflow-hidden group-hover:shadow-xl transition-all duration-300 cursor-pointer transform group-hover:-translate-y-2">
              <div className="relative">
                <div style={{ position: 'relative', width: '100%', paddingBottom: '65%' }}>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                      src="https://images.unsplash.com/photo-1594732832278-abd644401426?auto=format&fit=crop&q=80"
                      alt="Metropolitan Art Appraisers"
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md shadow-md text-sm font-medium text-primary flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" /> 4.9
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">Metropolitan Art Appraisers</h3>
                <div className="flex items-center text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4 mr-1" /> New York, NY
                </div>
                <p className="text-muted-foreground text-sm mb-4">Expert appraisers specializing in modern and contemporary artwork with over 20 years of experience.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Modern Art</span>
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Contemporary</span>
                  <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">Sculptures</span>
                </div>
              </div>
            </div>
          </a>
          
          {/* You can add more cards here */}
        </div>
        
        <div className="mt-12 text-center">
          <a href="/location/new-york" className="inline-flex items-center justify-center rounded-lg border border-primary bg-white px-6 py-3 text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary hover:text-white mr-4">
            Browse All Appraisers
          </a>
          <a href="/directory" className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 h-12 bg-primary shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-300">
            View Full Directory
          </a>
        </div>
      </main>
      
      {/* Testimonials Section */}
      <div className="bg-primary/5 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">What Our Clients Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/women/32.jpg" 
                    alt="Client" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <div className="flex">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The appraisal service was exceptional. They gave me an accurate valuation of my family heirloom paintings with detailed explanations."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/men/44.jpg" 
                    alt="Client" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Michael Trent</h4>
                  <div className="flex">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Found an amazing appraiser through this directory. Professional, knowledgeable, and provided great insights on my collection."
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <img 
                    src="https://randomuser.me/api/portraits/women/68.jpg" 
                    alt="Client" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Amanda Pierce</h4>
                  <div className="flex">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Easy to use directory that helped me connect with a local art appraiser. The process was smooth from start to finish."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
