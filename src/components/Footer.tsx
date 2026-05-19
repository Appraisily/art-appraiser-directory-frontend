import React from 'react';
import { Facebook, Twitter, Instagram, Mail, ArrowRight } from 'lucide-react';
import { PARENT_SITE_URL, SITE_NAME, getPrimaryCtaUrl } from '../config/site';
import { trackEvent } from '../utils/analytics';

const links = {
  quickLinks: [
    { name: 'Services', href: `${PARENT_SITE_URL}/services` },
    { name: 'How It Works', href: `${PARENT_SITE_URL}/how-it-works` },
    { name: 'Free AI Art Analysis', href: `${PARENT_SITE_URL}/screener` },
    { name: 'Priority Appraisal Guides', href: 'https://articles.appraisily.com/priority-guides/' },
    { name: 'IRS Qualified Appraiser Guide', href: 'https://articles.appraisily.com/irs-qualified-appraiser-near-me/' },
    { name: 'Antique Furniture Value Guide', href: 'https://articles.appraisily.com/how-to-determine-value-of-antique-furniture/' },
    { name: 'Terms of Service', href: `${PARENT_SITE_URL}/terms` }
  ],
  legal: [
    { name: 'Privacy Policy', href: `${PARENT_SITE_URL}/privacy` },
    { name: 'Terms of Service', href: `${PARENT_SITE_URL}/terms` }
  ],
  social: [
    { name: 'Facebook', icon: Facebook, href: 'https://www.facebook.com/appraisily' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/appraisily' },
    { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/appraisily/' }
  ]
};

export function Footer() {
  const primaryCtaUrl = getPrimaryCtaUrl();

  const handleFooterCtaClick = () => {
    trackEvent('cta_click', {
      placement: 'footer_primary',
      destination: primaryCtaUrl
    });
    window.location.assign(primaryCtaUrl);
  };

  const handleFooterLinkClick = (name: string, section: 'quick' | 'legal') => {
    trackEvent('footer_link_click', {
      section,
      link_text: name
    });
  };

  const handleSocialLinkClick = (network: string) => {
    trackEvent('social_link_click', {
      network,
      placement: 'footer'
    });
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-sm font-bold text-gray-900">
                A
              </span>
              <span className="text-2xl font-bold text-gray-900">{SITE_NAME}</span>
            </div>
            <p className="text-gray-600 max-w-md">
              Professional art appraisal reports, local directory research, and appraisal guides for insurance, estate, donation, resale, and collection decisions.
            </p>
            <button
              type="button"
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 min-h-[48px] rounded-md inline-flex items-center justify-center text-base font-medium transition-colors"
              data-gtm-event="cta_click"
              data-gtm-placement="footer_primary"
              onClick={handleFooterCtaClick}
            >
              Start Appraisal <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          
          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {links.quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
                    data-gtm-event="footer_link_click"
                    data-gtm-section="quick"
                    data-gtm-label={link.name}
                    onClick={() => handleFooterLinkClick(link.name, 'quick')}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Contact Us
            </h3>
            <div className="space-y-3">
              <a 
                href="mailto:info@appraisily.com"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                info@appraisily.com
              </a>
              <div className="flex space-x-4">
                {links.social.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                    href={social.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={`Visit our ${social.name} page`}
                    data-gtm-event="social_link_click"
                    data-gtm-network={social.name}
                    onClick={() => handleSocialLinkClick(social.name)}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-gray-600">©</span>
              <span className="text-gray-900 font-medium">{new Date().getFullYear()} Appraisily.</span>
              <span className="text-gray-600">All rights reserved.</span>
            </div>
            <nav className="flex items-center gap-6">
              {links.legal.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  data-gtm-event="footer_link_click"
                  data-gtm-section="legal"
                  data-gtm-label={link.name}
                  onClick={() => handleFooterLinkClick(link.name, 'legal')}
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
