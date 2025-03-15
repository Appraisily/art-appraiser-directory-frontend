import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateLocationPageHTML, 
  generateAppraiserPageHTML, 
  validateAndUpdateAppraiserImages, 
  saveValidatedAppraiserData 
} from './utils/template-generators.js';
import { 
  getEnhancedHeaderHTML, 
  getEnhancedFooterHTML, 
  createEnhancedImageMarkup 
} from './utils/template-helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Default placeholder image for missing images
const DEFAULT_PLACEHOLDER_IMAGE = 'https://ik.imagekit.io/appraisily/placeholder-art-image.jpg';

// Update the error handling script - MOVED UP to avoid reference issues
const imageErrorHandlingScript = `
    <!-- Image error handling script -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          // Only add error handler if not already present
          if (!img.hasAttribute('data-has-error-handler')) {
            img.setAttribute('data-has-error-handler', 'true');
            img.onerror = function() {
              console.log('Replacing broken image:', this.src);
              this.onerror = null;
              // Use placehold.co instead of ImageKit for better reliability
              this.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
              // Add a class for styling broken images
              this.classList.add('fallback-image');
            };
            // Force reload to trigger onerror for already broken images
            if (img.complete) {
              if (!img.naturalWidth) {
                img.src = img.src;
              }
            }
          }
        });
      });
    </script>`;

// ImageKit base URL for appraiser images
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/appraisily/appraiser-images';

// Ensure dist directory exists
fs.ensureDirSync(DIST_DIR);

// Get and copy assets
const assetsDir = path.join(DIST_DIR, 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find(file => file.endsWith('.css'));
const jsFile = assetFiles.find(file => file.endsWith('.js'));

// Construct the ABSOLUTE asset paths
// This is important - let's use absolute URLs to avoid path issues
const cssPath = `/assets/${cssFile}`;
const jsPath = `/assets/${jsFile}`;

console.log(`CSS file path: ${cssPath}`);
console.log(`JS file path: ${jsPath}`);

// Function to generate standardized image URL that matches the image generator pattern
function generateImageUrl(appraiser) {
  // First check if the appraiser already has a proper imageUrl that includes the timestamp/ID pattern
  if (appraiser.imageUrl && appraiser.imageUrl.includes('_') && (appraiser.imageUrl.includes('?updatedAt=') || appraiser.imageUrl.includes('_V'))) {
    return appraiser.imageUrl;
  }
  
  // If appraiser has image URL but doesn't match the pattern, use it as fallback
  if (appraiser.image || appraiser.imageUrl) {
    return appraiser.image || appraiser.imageUrl;
  }
  
  // Otherwise return the default placeholder
  return DEFAULT_PLACEHOLDER_IMAGE;
}

// Generate Home Page with Search Functionality
function generateHomePageHTML(cssPath, jsPath) {
  const title = 'Find Art Appraisers Near You | Expert Art Valuation Services | Appraisily';
  const description = 'Connect with certified art appraisers in your area. Get expert valuations, authentication services, and professional advice for your art collection. Compare ratings and read verified reviews.';
  const canonicalUrl = 'https://art-appraiser-directory.appraisily.com/';
  const heroImage = 'https://ik.imagekit.io/appraisily/site-images/hero-image.jpg';
  
  // Popular cities for the grid
  const popularCities = [
    { name: 'New York', slug: 'new-york', state: 'NY', image: 'https://ik.imagekit.io/appraisily/location-images/new-york.jpg' },
    { name: 'Los Angeles', slug: 'los-angeles', state: 'CA', image: 'https://ik.imagekit.io/appraisily/location-images/los-angeles.jpg' },
    { name: 'Chicago', slug: 'chicago', state: 'IL', image: 'https://ik.imagekit.io/appraisily/location-images/chicago.jpg' },
    { name: 'Miami', slug: 'miami', state: 'FL', image: 'https://ik.imagekit.io/appraisily/location-images/miami.jpg' },
    { name: 'San Francisco', slug: 'san-francisco', state: 'CA', image: 'https://ik.imagekit.io/appraisily/location-images/san-francisco.jpg' },
    { name: 'Boston', slug: 'boston', state: 'MA', image: 'https://ik.imagekit.io/appraisily/location-images/boston.jpg' },
    { name: 'Dallas', slug: 'dallas', state: 'TX', image: 'https://ik.imagekit.io/appraisily/location-images/dallas.jpg' },
    { name: 'Washington DC', slug: 'washington-dc', state: 'DC', image: 'https://ik.imagekit.io/appraisily/location-images/washington-dc.jpg' }
  ];
  
  // Create search form HTML
  const searchFormHTML = `
  <div class="relative flex-1 max-w-2xl mx-auto">
    <form action="/search" method="GET" class="flex flex-col md:flex-row gap-4">
      <div class="relative flex-1">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <input
          type="text"
          name="location"
          class="w-full h-12 pl-10 pr-12 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          placeholder="Enter city name or ZIP code"
          required
        />
        <button
          type="button"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        </button>
      </div>
      <button
        type="submit"
        class="h-12 px-6 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <span class="flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Search
        </span>
      </button>
    </form>
  </div>`;
  
  // Create city grid HTML
  const citiesGridHTML = `
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    ${popularCities.map(city => `
      <a href="/location/${city.slug}" class="group">
        <div class="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
          <div class="relative h-48">
            <img 
              src="${city.image}" 
              alt="Art appraisers in ${city.name}, ${city.state}" 
              class="w-full h-full object-cover"
              width="300"
              height="200"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-20 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h3 class="text-white text-xl font-bold">${city.name}</h3>
                <p class="text-white text-sm mt-1">View appraisers</p>
              </div>
            </div>
          </div>
        </div>
      </a>
    `).join('')}
  </div>`;
  
  // Get enhanced header and footer
  const headerOptions = {
    title,
    description,
    canonicalUrl,
    imageUrl: heroImage,
    keywords: ['art appraiser directory', 'art valuation services', 'find art appraisers', 'certified art appraisers'],
    cssPath
  };
  
  return `${getEnhancedHeaderHTML(headerOptions)}
    <div id="root">
      <!-- Main Navigation -->
      <header class="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="text-2xl font-bold text-primary">Art Appraiser Directory</a>
          <nav class="hidden md:flex space-x-8">
            <a href="/" class="text-gray-700 hover:text-primary transition-colors">Home</a>
            <a href="/about" class="text-gray-700 hover:text-primary transition-colors">About</a>
            <a href="/services" class="text-gray-700 hover:text-primary transition-colors">Services</a>
          </nav>
        </div>
      </header>
      
      <main class="pt-16">
        <!-- Hero Section -->
        <section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24">
          <div class="container mx-auto px-4">
            <div class="max-w-3xl mx-auto text-center mb-12">
              <h1 class="text-3xl md:text-5xl font-bold mb-6">Find Art Appraisers Near You</h1>
              <p class="text-lg md:text-xl opacity-90">Connect with certified art appraisers in your area. Get expert valuations, authentication services, and professional advice for your art collection.</p>
            </div>
            
            ${searchFormHTML}
          </div>
        </section>
        
        <!-- Popular Cities Section -->
        <section class="py-16 bg-gray-50">
          <div class="container mx-auto px-4">
            <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center">Popular Cities</h2>
            ${citiesGridHTML}
          </div>
        </section>
        
        <!-- Services Section -->
        <section class="py-16">
          <div class="container mx-auto px-4">
            <h2 class="text-2xl md:text-3xl font-bold mb-10 text-center">Art Appraisal Services</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="text-blue-600 text-4xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 12h5m10 0h5"></path><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle>
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-2">Insurance Appraisals</h3>
                <p class="text-gray-600">Get accurate valuations for insurance coverage, ensuring your art and collectibles are properly protected.</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="text-blue-600 text-4xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 12V8H6a2 2 0 1 1 0-4h12v4"></path><path d="M20 12v4H6a2 2 0 1 0 0 4h12v-4"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-2">Estate Planning</h3>
                <p class="text-gray-600">Detailed appraisal reports for estate planning, tax purposes, and equitable distribution among heirs.</p>
              </div>
              
              <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="text-blue-600 text-4xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6l9 6 9-6"></path><path d="M21 15a3 3 0 0 1-6 0"></path><path d="M3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold mb-2">Donation Appraisals</h3>
                <p class="text-gray-600">IRS-compliant appraisals for charitable donations and gifts, ensuring proper tax deductions.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
    ${getEnhancedFooterHTML(jsPath)}`;
}

// Read all location JSON files
const locationFiles = fs.readdirSync(LOCATIONS_DIR)
  .filter(file => file.endsWith('.json') && !file.includes('copy') && !file.includes('lifecycle') && !file.includes('cors') && !file.includes('hugo'));

// Generate Home Page first
console.log('Generating home page with search functionality...');
const homePageHTML = generateHomePageHTML(cssPath, jsPath);
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homePageHTML);

// Generate HTML for each location
locationFiles.forEach(file => {
  const locationData = JSON.parse(fs.readFileSync(path.join(LOCATIONS_DIR, file)));
  const citySlug = file.replace('.json', '');
  const cityName = citySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Create location directory
  const locationDir = path.join(DIST_DIR, 'location', citySlug);
  fs.ensureDirSync(locationDir);

  // Generate HTML
  const html = generateLocationHTML(locationData, cityName, citySlug, cssPath, jsPath);
  fs.writeFileSync(path.join(locationDir, 'index.html'), html);

  // Generate HTML for each appraiser
  locationData.appraisers?.forEach(appraiser => {
    if (appraiser.id) {
      const appraiserDir = path.join(DIST_DIR, 'appraiser', appraiser.id);
      fs.ensureDirSync(appraiserDir);

      const appraiserHtml = generateAppraiserHTML(appraiser, cityName, cssPath, jsPath);
      fs.writeFileSync(path.join(appraiserDir, 'index.html'), appraiserHtml);
    }
  });
});

// Common footer HTML - replace the old script with the new one
function getFooterHTML(jsPath) {
  return `
    <script type="module" crossorigin src="${jsPath}"></script>
    ${imageErrorHandlingScript}
  </body>
</html>`;
}

function generateLocationHTML(locationData, cityName, citySlug, cssPath, jsPath) {
  const title = `Art Appraisers in ${cityName} | Expert Art Valuation Services | Appraisily`;
  const description = `Find certified art appraisers in ${cityName}. Get expert art valuations, authentication services, and professional advice for your art collection.`;
  const canonicalUrl = `https://art-appraiser.appraisily.com/location/${citySlug}`;
  const locationImage = locationData.imageUrl || 'https://ik.imagekit.io/appraisily/location-images/default-city.jpg';
  
  // Create schema data
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Art Appraisal Services in ${cityName}`,
    "description": `Find top-rated art appraisers in ${cityName}, ${locationData.state}. Professional art valuation services for insurance, estate planning, donations, and more.`,
    "serviceType": "Art Appraisal",
    "areaServed": {
      "@type": "City",
      "name": cityName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cityName,
        "addressRegion": locationData.state,
        "addressCountry": "US"
      }
    },
    "provider": locationData.appraisers?.map(appraiser => ({
      "@type": "ProfessionalService",
      "name": appraiser.name,
      "image": appraiser.image || appraiser.imageUrl,
      "url": `https://art-appraiser.appraisily.com/appraiser/${appraiser.id}`
    }))
  };
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://art-appraiser.appraisily.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Art Appraisers in ${cityName}`,
        "item": canonicalUrl
      }
    ]
  };
  
  // FAQ schema specific to locations
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How do I find an art appraiser in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can find qualified art appraisers in ${cityName} through our directory. We list certified professionals who specialize in various types of art and collectibles.`
        }
      },
      {
        "@type": "Question",
        "name": `What services do art appraisers in ${cityName} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Art appraisers in ${cityName} offer various services including valuations for insurance purposes, estate planning, donations, sales, and purchases. Many also provide authentication services and consultations.`
        }
      },
      {
        "@type": "Question",
        "name": `How much does an art appraisal cost in ${cityName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Art appraisal costs in ${cityName} vary depending on the complexity of the item, the purpose of the appraisal, and the appraiser's experience. Many appraisers charge either a flat fee per item or an hourly rate.`
        }
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="art appraiser, ${cityName} art appraisal, artwork valuation, art authentication, art insurance appraisal, fine art appraisal" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="robots" content="index, follow" />
    
    <!-- Performance optimization -->
    <link rel="preload" href="${cssPath}" as="style" />
    <link rel="stylesheet" href="${cssPath}" />
    <link rel="preload" href="${jsPath}" as="script" />
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${locationImage}" />
    
    <!-- Twitter Card data -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${locationImage}" />
    
    <!-- Schema.org markup -->
    <script type="application/ld+json">
      ${JSON.stringify(locationSchema)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbSchema)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(faqSchema)}
    </script>
    
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-PSLHDGM');</script>
    <!-- End Google Tag Manager -->
  </head>
  <body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PSLHDGM"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    
    <div id="root">
      <!-- SSR content will be injected here during build -->
      <div data-location-city="${cityName}" data-location-slug="${citySlug}">
        <h1>Art Appraisers in ${cityName}</h1>
        <p>Find certified art appraisers in ${cityName}. Get expert art valuations, authentication services, and professional advice for your art collection.</p>
        
        <section>
          <h2>Top Art Appraisers in ${cityName}</h2>
          ${locationData.appraisers?.map(appraiser => `
            <div class="appraiser-card" data-appraiser-id="${appraiser.id}">
              <h3>${appraiser.name}</h3>
              <p>${appraiser.specialties?.join(', ')}</p>
              <a href="/appraiser/${appraiser.id}">View Details</a>
            </div>
          `).join('') || ''}
        </section>
      </div>
    </div>

    <script type="module" src="${jsPath}"></script>
    ${imageErrorHandlingScript}
  </body>
</html>`;
}

function generateAppraiserHTML(appraiser, cityName, cssPath, jsPath) {
  // Format appraiser name and business name for SEO-friendly title
  const displayName = appraiser.businessName 
    ? `${appraiser.name} (${appraiser.businessName})` 
    : appraiser.name;
  
  const title = `${displayName} - Art Appraiser | Expert Art Valuation Services`;
  const specialties = appraiser.specialties?.join(', ') || '';
  const description = `Get professional art appraisal services from ${displayName}. Specializing in ${specialties}. Certified expert with ${appraiser.reviewCount || 'verified'} reviews.`;
  const canonicalUrl = `https://art-appraiser.appraisily.com/appraiser/${appraiser.id}`;
  const imageUrl = generateImageUrl(appraiser);
  
  // Create schema data for appraiser
  const appraiserSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": displayName,
    "image": imageUrl,
    "description": appraiser.about || description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": appraiser.address?.split(',')[0]?.trim() || cityName,
      "addressRegion": appraiser.address?.split(',')[1]?.trim() || '',
      "addressCountry": "US"
    },
    "url": canonicalUrl,
    "telephone": appraiser.phone || '',
    "email": appraiser.email || '',
    "priceRange": "$$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": appraiser.rating?.toString() || "5",
      "reviewCount": appraiser.reviewCount?.toString() || "1",
      "bestRating": "5",
      "worstRating": "1"
    }
  };
  
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://art-appraiser.appraisily.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": `Art Appraisers in ${cityName}`,
        "item": `https://art-appraiser.appraisily.com/location/${cityName.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": displayName,
        "item": canonicalUrl
      }
    ]
  };
  
  // FAQ schema specific to this appraiser
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `What services does ${displayName} offer?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": appraiser.services?.map(s => s.name).join(', ') || `${displayName} offers professional art appraisal services including valuations for insurance, estate planning, donations, and sales.`
        }
      },
      {
        "@type": "Question",
        "name": `What are ${displayName}'s specialties?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": specialties || `${displayName} specializes in appraising various types of artwork and collectibles.`
        }
      },
      {
        "@type": "Question",
        "name": `How can I contact ${displayName}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can contact ${displayName} by phone at ${appraiser.phone || 'the number listed on their profile'} or by email at ${appraiser.email || 'the email address on their profile'}.`
        }
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/directory/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${specialties}, art appraiser, art valuation, ${cityName} art appraiser" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="robots" content="index, follow" />
    
    <!-- Performance optimization -->
    <link rel="preload" href="${cssPath}" as="style" />
    <link rel="stylesheet" href="${cssPath}" />
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="Appraisily" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${JSON.stringify(appraiserSchema)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(breadcrumbSchema)}
    </script>
    <script type="application/ld+json">
      ${JSON.stringify(faqSchema)}
    </script>
    
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-PSLHDGM');</script>
    <!-- End Google Tag Manager -->
  </head>
  <body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PSLHDGM"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->

    <div id="root">
      <!-- This content will be replaced by client-side React when JS loads -->
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/services">Services</a>
        </nav>
      </header>
      
      <main>
        <article itemscope itemtype="https://schema.org/ProfessionalService">
          <h1 itemprop="name">${displayName}</h1>
          
          <div class="appraiser-info">
            <div class="appraiser-image">
              <img src="${imageUrl}" alt="${displayName}" itemprop="image" width="300" height="300" loading="lazy" />
            </div>
            
            <div class="appraiser-details">
              <p itemprop="description">${appraiser.about || description}</p>
              
              <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
                <p><strong>Location:</strong> <span itemprop="addressLocality">${appraiser.address || cityName}</span></p>
              </div>
              
              ${appraiser.phone ? `<p><strong>Phone:</strong> <span itemprop="telephone">${appraiser.phone}</span></p>` : ''}
              ${appraiser.email ? `<p><strong>Email:</strong> <span itemprop="email">${appraiser.email}</span></p>` : ''}
              ${appraiser.website ? `<p><strong>Website:</strong> <a href="${appraiser.website}" itemprop="url" rel="noopener noreferrer">${appraiser.website}</a></p>` : ''}
            </div>
          </div>
          
          <section>
            <h2>Specialties</h2>
            <ul>
              ${appraiser.specialties?.map(specialty => `<li>${specialty}</li>`).join('') || '<li>Fine Art Appraisal</li>'}
            </ul>
          </section>
        </article>
      </main>
      
      <footer>
        <p>&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
      </footer>
    </div>
    
    <!-- Load JS at the end for better performance -->
    <script src="${jsPath}" defer></script>
    ${imageErrorHandlingScript}
  </body>
</html>`;
}

// Add image validation at the beginning of the process
async function generateStaticHTML() {
  console.log('Starting static HTML generation...');
  try {
    // Create necessary directories
    // ... existing code ...
    
    // Get appraiser data
    const appraisersData = await getAppraisers();
    
    // Validate and update appraiser images
    console.log('Validating appraiser images...');
    const validatedAppraisers = await validateAndUpdateAppraiserImages(appraisersData);
    
    // Cache validated data for future use
    await saveValidatedAppraiserData(validatedAppraisers, path.join(DIST_DIR, 'data', 'validated-appraisers.json'));
    
    // Generate appraiser pages
    console.log('Generating appraiser pages...');
    for (const appraiser of validatedAppraisers) {
      // ... existing code ...
      const htmlContent = await generateAppraiserPageHTML(appraiser);
      // ... existing code ...
    }
    
    // Generate location pages
    console.log('Generating location pages...');
    const locations = getUniqueLocations(validatedAppraisers);
    for (const location of locations) {
      // ... existing code ...
      const appraisersInLocation = validatedAppraisers.filter(a => 
        (a.city && a.city.toLowerCase() === location.city.toLowerCase()) || 
        (a.location && a.location.toLowerCase().includes(location.city.toLowerCase()))
      );
      const htmlContent = await generateLocationPageHTML({
        cityName: location.city,
        stateName: location.state,
        appraisers: appraisersInLocation,
        seoData: {}
      });
      // ... existing code ...
    }
    
    // ... existing code ...
  } catch (error) {
    console.error('Error generating static HTML:', error);
  }
}