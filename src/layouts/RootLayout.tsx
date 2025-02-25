import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <a href="https://appraisily.com" className="flex items-center pl-4">
            <div className="flex items-center gap-3">
              <img 
                src="http://cdn.mcauto-images-production.sendgrid.net/304ac75ef1d5c007/8aeb2689-2b5b-402d-a6f3-6521621e123a/300x300.png" 
                alt="Appraisily Logo" 
                className="w-10 h-10"
              />
              <span className="font-bold text-2xl tracking-tight">Appraisily</span>
            </div>
          </a>
        </div>
      </header>
      <Outlet />
      <Footer />
    </div>
  );
}