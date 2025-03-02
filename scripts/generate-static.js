import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateLocationPageHTML, generateAppraiserPageHTML, validateAndUpdateAppraiserImages, saveValidatedAppraiserData } from './utils/template-generators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Default placeholder image for missing images
const DEFAULT_PLACEHOLDER_IMAGE = 'https://ik.imagekit.io/appraisily/placeholder-art-image.jpg';

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

// Read all location JSON files
const locationFiles = fs.readdirSync(LOCATIONS_DIR)
  .filter(file => file.endsWith('.json') && !file.includes('copy') && !file.includes('lifecycle') && !file.includes('cors') && !file.includes('hugo'));

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

// Common header HTML with Google Tag Manager
function getHeaderHTML(title, description, cssPath) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/directory/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="stylesheet" href="${cssPath}" />
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
    <!-- End Google Tag Manager (noscript) -->`;
}

// Common footer HTML
function getFooterHTML(jsPath) {
  // Define cities list for the footer
  const citiesList = `
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-gray-400 text-sm">
      <a href="/location/new-york" class="hover:text-white transition">New York, New York</a>
      <a href="/location/los-angeles" class="hover:text-white transition">Los Angeles, California</a>
      <a href="/location/chicago" class="hover:text-white transition">Chicago, Illinois</a>
      <a href="/location/houston" class="hover:text-white transition">Houston, Texas</a>
      <a href="/location/phoenix" class="hover:text-white transition">Phoenix, Arizona</a>
      <a href="/location/philadelphia" class="hover:text-white transition">Philadelphia, Pennsylvania</a>
      <a href="/location/san-antonio" class="hover:text-white transition">San Antonio, Texas</a>
      <a href="/location/san-diego" class="hover:text-white transition">San Diego, California</a>
      <a href="/location/dallas" class="hover:text-white transition">Dallas, Texas</a>
      <a href="/location/san-jose" class="hover:text-white transition">San Jose, California</a>
      <a href="/location/austin" class="hover:text-white transition">Austin, Texas</a>
      <a href="/location/jacksonville" class="hover:text-white transition">Jacksonville, Florida</a>
      <a href="/location/fort-worth" class="hover:text-white transition">Fort Worth, Texas</a>
      <a href="/location/columbus" class="hover:text-white transition">Columbus, Ohio</a>
      <a href="/location/san-francisco" class="hover:text-white transition">San Francisco, California</a>
      <a href="/location/charlotte" class="hover:text-white transition">Charlotte, North Carolina</a>
      <a href="/location/indianapolis" class="hover:text-white transition">Indianapolis, Indiana</a>
      <a href="/location/seattle" class="hover:text-white transition">Seattle, Washington</a>
      <a href="/location/denver" class="hover:text-white transition">Denver, Colorado</a>
      <a href="/location/washington-dc" class="hover:text-white transition">Washington, District of Columbia</a>
      <a href="/location/boston" class="hover:text-white transition">Boston, Massachusetts</a>
      <a href="/location/nashville" class="hover:text-white transition">Nashville, Tennessee</a>
      <a href="/location/portland" class="hover:text-white transition">Portland, Oregon</a>
      <a href="/location/las-vegas" class="hover:text-white transition">Las Vegas, Nevada</a>
      <a href="/location/atlanta" class="hover:text-white transition">Atlanta, Georgia</a>
      <a href="/location/miami" class="hover:text-white transition">Miami, Florida</a>
      <a href="/location/minneapolis" class="hover:text-white transition">Minneapolis, Minnesota</a>
      <a href="/location/new-orleans" class="hover:text-white transition">New Orleans, Louisiana</a>
      <a href="/location/cleveland" class="hover:text-white transition">Cleveland, Ohio</a>
      <a href="/location/st-louis" class="hover:text-white transition">St. Louis, Missouri</a>
      <a href="/location/pittsburgh" class="hover:text-white transition">Pittsburgh, Pennsylvania</a>
      <a href="/location/cincinnati" class="hover:text-white transition">Cincinnati, Ohio</a>
      <a href="/location/kansas-city" class="hover:text-white transition">Kansas City, Missouri</a>
      <a href="/location/sacramento" class="hover:text-white transition">Sacramento, California</a>
      <a href="/location/salt-lake-city" class="hover:text-white transition">Salt Lake City, Utah</a>
      <a href="/location/providence" class="hover:text-white transition">Providence, Rhode Island</a>
      <a href="/location/richmond" class="hover:text-white transition">Richmond, Virginia</a>
      <a href="/location/buffalo" class="hover:text-white transition">Buffalo, New York</a>
      <a href="/location/raleigh" class="hover:text-white transition">Raleigh, North Carolina</a>
      <a href="/location/hartford" class="hover:text-white transition">Hartford, Connecticut</a>
      <a href="/location/charleston" class="hover:text-white transition">Charleston, South Carolina</a>
      <a href="/location/savannah" class="hover:text-white transition">Savannah, Georgia</a>
      <a href="/location/santa-fe" class="hover:text-white transition">Santa Fe, New Mexico</a>
      <a href="/location/palm-beach" class="hover:text-white transition">Palm Beach, Florida</a>
      <a href="/location/aspen" class="hover:text-white transition">Aspen, Colorado</a>
    </div>
  `;

  return `<footer class="bg-gray-900 text-white py-12">
      <div class="container mx-auto px-6">
        <div class="mb-10">
          <h3 class="text-xl font-bold mb-4">Find Art Appraisers Near You</h3>
          ${citiesList}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-gray-800 pt-8">
          <div class="flex flex-col items-start">
            <img src="https://cdn.mcauto-images-production.sendgrid.net/304ac75ef1d5c007/8aeb2689-2b5b-402d-a6f3-6521621e123a/300x300.png" alt="Appraisily Logo" class="w-12 h-12 mb-3" />
            <h3 class="text-xl font-bold">Appraisily</h3>
            <p class="text-gray-400 text-sm mt-2">Professional online art and antique appraisals. Get accurate valuations from certified experts within 48 hours.</p>
            <a href="/start-appraisal" class="mt-4 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md inline-block transition-colors">Start Appraisal</a>
          </div>
          
          <div>
            <h3 class="text-xl font-bold mb-4">Quick Links</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="/directory" class="text-gray-400 hover:text-white transition">Directory</a></li>
              <li><a href="/" class="text-gray-400 hover:text-white transition">Home</a></li>
              <li><a href="/about" class="text-gray-400 hover:text-white transition">About Us</a></li>
              <li><a href="/contact" class="text-gray-400 hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-xl font-bold mb-4">Services</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="/services" class="text-gray-400 hover:text-white transition">Services</a></li>
              <li><a href="/how-it-works" class="text-gray-400 hover:text-white transition">How It Works</a></li>
              <li><a href="/free-ai-art-analysis" class="text-gray-400 hover:text-white transition">Free AI Art Analysis</a></li>
              <li><a href="/terms" class="text-gray-400 hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h3 class="text-xl font-bold mb-4">Contact Us</h3>
            <p class="text-gray-400 text-sm">Have questions? Need assistance?</p>
            <p class="text-gray-400 text-sm mt-2">Email: <a href="mailto:info@appraisily.com" class="text-primary hover:text-white transition">info@appraisily.com</a></p>
          </div>
        </div>
        
        <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400 text-sm">&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
          <div class="flex space-x-4 mt-4 md:mt-0 text-sm">
            <a href="/privacy" class="text-gray-400 hover:text-white transition">Privacy Policy</a>
            <a href="/terms" class="text-gray-400 hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
    <script type="module" src="${jsPath}"></script>
  </body>
</html>`;
}

function generateLocationHTML(locationData, cityName, citySlug, cssPath, jsPath) {
  const title = `Art Appraisers in ${cityName} | Expert Art Valuation Services`;
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
    <link rel="icon" type="image/svg+xml" href="/directory/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="art appraiser, ${cityName} art appraisal, artwork valuation, art authentication, art insurance appraisal, fine art appraisal" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta name="robots" content="index, follow" />
    
    <!-- Performance optimization -->
    <link rel="preload" href="${cssPath}" as="style" />
    <link rel="stylesheet" href="${cssPath}" />
    
    <!-- Open Graph tags -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${locationImage}" />
    <meta property="og:site_name" content="Appraisily" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${locationImage}" />
    
    <!-- Schema.org structured data -->
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

    <div id="location-content">
      <!-- This content will be replaced by client-side React when JS loads -->
      <header>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/services">Services</a>
        </nav>
      </header>
      
      <main>
        <h1>Art Appraisers in ${cityName}</h1>
        <p>Find certified art appraisers in ${cityName}. Get expert art valuations, authentication services, and professional advice for your art collection.</p>
        
        <section>
          <h2>Top Art Appraisers in ${cityName}</h2>
          <div class="appraiser-list">
            ${locationData.appraisers?.map(appraiser => `
              <div class="appraiser-card">
                <h3><a href="/appraiser/${appraiser.id}">${appraiser.name}</a></h3>
                <p>${appraiser.specialties?.slice(0, 3).join(', ')}</p>
              </div>
            `).join('') || ''}
          </div>
        </section>
      </main>
      
      <footer>
        <p>&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
      </footer>
    </div>
    
    <!-- Load JS at the end for better performance -->
    <script src="${jsPath}" defer></script>
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

    <div id="appraiser-content">
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