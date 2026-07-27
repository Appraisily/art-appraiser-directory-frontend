import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, ExternalLink } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "./ui/navigation-menu";
import { cn } from '../lib/utils';
import { PARENT_SITE_URL, SITE_NAME, getPrimaryCtaUrl } from '../config/site';
import { BRAND_LOGO_URL } from '../config/assets';
import { trackEvent } from '../utils/analytics';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const primaryCtaUrl = getPrimaryCtaUrl();

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
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsOpen(false);
      mobileMenuButtonRef.current?.focus();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const navItems = [
    { name: 'Appraisers', href: '/appraiser/', external: false },
    { name: 'Locations', href: '/location/', external: false },
    { name: 'Methodology', href: '/methodology/', external: false },
    { name: 'Correct a listing', href: '/get-listed/', external: false },
    { name: 'Appraisily', href: PARENT_SITE_URL, external: true },
  ];

  const handleCtaClick = (placement: 'desktop' | 'mobile') => {
    trackEvent('cta_click', {
      placement: `nav_${placement}`,
      destination: primaryCtaUrl
    });
  };

  const handleNavLinkClick = (name: string, placement: 'desktop' | 'mobile') => {
    trackEvent('nav_link_click', {
      placement: `nav_${placement}`,
      link_text: name
    });
  };

  return (
    <nav className={cn(
      "fixed w-full z-50 transition-all duration-200",
      isScrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-md"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Directory Title */}
          <div className="flex items-center">
            <Link to="/" className="flex h-full items-center gap-2">
              <img
                src={BRAND_LOGO_URL}
                alt="Appraisily Logo"
                className="h-8 w-auto"
                loading="eager"
              />
              <span className="max-w-[11rem] font-serif text-base font-semibold leading-tight text-gray-900 sm:max-w-none sm:text-lg">
                {SITE_NAME}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavigationMenu>
              <NavigationMenuList>
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    {item.external ? (
                      <a
                        href={item.href}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-gtm-event="nav_link_click"
                        data-gtm-label={item.name}
                        data-gtm-placement="nav_desktop"
                        onClick={() => handleNavLinkClick(item.name, 'desktop')}
                      >
                        {item.name} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link
                        to={item.href}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        data-gtm-event="nav_link_click"
                        data-gtm-label={item.name}
                        data-gtm-placement="nav_desktop"
                        onClick={() => handleNavLinkClick(item.name, 'desktop')}
                      >
                        {item.name}
                      </Link>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            <a
              href={primaryCtaUrl}
              id="start-appraisal-nav"
              className="inline-flex items-center justify-center px-4 py-2 ml-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors gap-1.5 shadow-sm hover:shadow-md"
              data-gtm-event="cta_click"
              data-gtm-placement="nav_desktop"
              onClick={() => handleCtaClick('desktop')}
            >
              Start Appraisal <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            <button
              ref={mobileMenuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(!isOpen);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center p-3 min-w-[44px] min-h-[44px] rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close main menu" : "Open main menu"}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <a
              href={primaryCtaUrl}
              id="start-appraisal-nav-mobile"
              className="inline-flex items-center justify-center px-4 py-2 min-h-[44px] border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              data-gtm-event="cta_click"
              data-gtm-placement="nav_mobile"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                handleCtaClick('mobile');
              }}
            >
              Start
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white shadow-lg max-h-[80vh] overflow-y-auto">
            {/* Mobile menu header */}
            <div className="flex items-center justify-between px-3 py-3 font-medium border-b border-gray-200 mb-2">
              <span className="text-base text-gray-900">Directory menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-3 min-h-[44px] rounded-md text-base font-medium transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-gtm-event="nav_link_click"
                  data-gtm-label={item.name}
                  data-gtm-placement="nav_mobile"
                  onClick={() => {
                    handleNavLinkClick(item.name, 'mobile');
                    setIsOpen(false);
                  }}
                >
                  {item.name} <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-2 px-3 py-3 min-h-[44px] rounded-md text-base font-medium transition-colors text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  data-gtm-event="nav_link_click"
                  data-gtm-label={item.name}
                  data-gtm-placement="nav_mobile"
                  onClick={() => {
                    handleNavLinkClick(item.name, 'mobile');
                    setIsOpen(false);
                  }}
                >
                  {item.name}
                </Link>
              )
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
