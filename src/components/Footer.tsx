import React from 'react';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowRight } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="http://cdn.mcauto-images-production.sendgrid.net/304ac75ef1d5c007/8aeb2689-2b5b-402d-a6f3-6521621e123a/300x300.png" 
                alt="Appraisily Logo" 
                className="w-10 h-10 bg-white rounded-md"
              />
              <span className="font-bold text-2xl tracking-tight">Appraisily</span>
            </div>
            <p className="text-slate-300 text-sm">
              Connecting art collectors with professional appraisers since 2015. Get accurate valuations from certified experts nationwide.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-primary transition-colors h-9 w-9 flex items-center justify-center bg-slate-800 rounded-full hover:bg-slate-700">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors h-9 w-9 flex items-center justify-center bg-slate-800 rounded-full hover:bg-slate-700">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors h-9 w-9 flex items-center justify-center bg-slate-800 rounded-full hover:bg-slate-700">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-primary transition-colors h-9 w-9 flex items-center justify-center bg-slate-800 rounded-full hover:bg-slate-700">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-6 relative">
              <span className="relative z-10">Quick Links</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-primary"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/about" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  About Us
                </a>
              </li>
              <li>
                <a href="/services" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  Services
                </a>
              </li>
              <li>
                <a href="/blog" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  Blog
                </a>
              </li>
              <li>
                <a href="/faq" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  FAQs
                </a>
              </li>
              <li>
                <a href="/contact" className="text-slate-300 hover:text-white transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-300" />
                  Contact
                </a>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-6 relative">
              <span className="relative z-10">Contact Us</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-primary"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <span className="text-slate-300">123 Art Avenue, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="tel:+1234567890" className="text-slate-300 hover:text-white transition-colors">(123) 456-7890</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <a href="mailto:info@appraisily.com" className="text-slate-300 hover:text-white transition-colors">info@appraisily.com</a>
              </li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-6 relative">
              <span className="relative z-10">Newsletter</span>
              <span className="absolute bottom-0 left-0 w-12 h-1 bg-primary"></span>
            </h3>
            <p className="text-slate-300 mb-4 text-sm">
              Subscribe to our newsletter for the latest news and updates on art appraisal.
            </p>
            <form className="flex flex-col space-y-2">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white placeholder:text-slate-400"
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        {/* Popular Cities Grid */}
        <div className="mb-16">
          <h3 className="font-bold text-lg mb-6 relative inline-block">
            <span className="relative z-10">Find Art Appraisers Near You</span>
            <span className="absolute bottom-0 left-0 w-12 h-1 bg-primary"></span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <a href="/location/new-york" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> New York
            </a>
            <a href="/location/los-angeles" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Los Angeles
            </a>
            <a href="/location/chicago" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Chicago
            </a>
            <a href="/location/houston" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Houston
            </a>
            <a href="/location/phoenix" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Phoenix
            </a>
            <a href="/location/philadelphia" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Philadelphia
            </a>
            <a href="/location/san-antonio" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> San Antonio
            </a>
            <a href="/location/san-diego" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> San Diego
            </a>
            <a href="/location/dallas" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Dallas
            </a>
            <a href="/location/san-jose" className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" /> San Jose
            </a>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 text-sm">
            © {currentYear} Appraisily. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">Terms of Service</a>
            <a href="/sitemap" className="text-slate-400 hover:text-white text-sm transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}