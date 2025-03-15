import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';  
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "./ui/navigation-menu"
import { cn } from '../lib/utils';
import { cities } from '../data/cities.json';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [citiesDropdownOpen, setCitiesDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
    setCitiesDropdownOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'About', href: 'https://appraisily.com/about' },
    { name: 'Services', href: 'https://appraisily.com/services' },
    { name: 'Expertise', href: 'https://appraisily.com/expertise' },
    { name: 'Team', href: 'https://appraisily.com/team' }
  ];

  return (
    <nav className={cn(
      "fixed w-full z-50 transition-all duration-200",
      isScrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-md"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Directory Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://ik.imagekit.io/appraisily/WebPage/logo_new.png?updatedAt=1731919266638"
                alt="Appraisily Logo"
                className="h-8 w-auto"
                loading="eager"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-semibold text-gray-900">Appraisily</span>
                <span className="text-xs text-gray-600 -mt-1">Art Appraiser Directory</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem className="relative">
                  <button
                    onClick={() => setCitiesDropdownOpen(!citiesDropdownOpen)}
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  >
                    Locations <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  
                  {citiesDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-4 z-50 w-64 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {cities.map((city) => (
                          <a
                            key={city.slug}
                            href={`https://appraisily.com/location/${city.slug}`}
                            className="text-sm text-gray-700 hover:text-blue-600 py-1"
                          >
                            {city.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </NavigationMenuItem>

                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <a
                      href={item.href}
                      className="px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      {item.name}
                    </a>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <a
              href="https://appraisily.com/start"
              id="start-appraisal-nav"
              className="inline-flex items-center justify-center px-4 py-2 ml-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors gap-1.5 shadow-sm hover:shadow-md"
            >
              Start Appraisal <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <a
              href="https://appraisily.com/start"
              id="start-appraisal-nav-mobile"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-sm"
            >
              Start
            </a>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">{isOpen ? "Close main menu" : "Open main menu"}</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="px-3 py-2 font-medium border-b border-gray-200 mb-2">
              <span className="block text-blue-600">Locations</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 px-3 pb-3 border-b border-gray-200 mb-2">
              {cities.map((city) => (
                <a
                  key={city.slug}
                  href={`https://appraisily.com/location/${city.slug}`}
                  className="text-sm text-gray-700 hover:text-blue-600 py-1"
                >
                  {city.name}
                </a>
              ))}
            </div>
            
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}