import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Menu, X } from 'lucide-react';

export function RootLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center pl-0">
            <div className="flex items-center gap-3">
              <img 
                src="http://cdn.mcauto-images-production.sendgrid.net/304ac75ef1d5c007/8aeb2689-2b5b-402d-a6f3-6521621e123a/300x300.png" 
                alt="Appraisily Logo" 
                className="w-10 h-10 transition-transform duration-300 hover:scale-110" 
              />
              <span className="font-bold text-2xl tracking-tight bg-gradient-to-r from-primary to-blue-600 text-transparent bg-clip-text">Appraisily</span>
            </div>
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">Home</Link>
            <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium">Services</a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium">About</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">Contact</a>
          </nav>
          
          {/* Mobile Navigation Button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b shadow-lg animate-fadeIn">
            <div className="container py-4 flex flex-col space-y-4">
              <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium p-2" onClick={() => setIsMenuOpen(false)}>Home</Link>
              <a href="#services" className="text-foreground hover:text-primary transition-colors font-medium p-2" onClick={() => setIsMenuOpen(false)}>Services</a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium p-2" onClick={() => setIsMenuOpen(false)}>About</a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium p-2" onClick={() => setIsMenuOpen(false)}>Contact</a>
            </div>
          </div>
        )}
      </header>
      <Outlet />
      <Footer />
    </div>
  );
}