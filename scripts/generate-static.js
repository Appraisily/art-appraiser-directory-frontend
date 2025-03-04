import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateLocationPageHTML, generateAppraiserPageHTML, validateAndUpdateAppraiserImages, saveValidatedAppraiserData } from './utils/template-generators.js';
// Fix glob import with a dynamic import
const glob = await import('glob').then(module => module.default || module);

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

// Load all location data
const locations = [];
const locationFiles = fs.readdirSync(LOCATIONS_DIR)
  .filter(file => file.endsWith('.json') && !file.includes('copy') && !file.includes('backup'));

for (const file of locationFiles) {
  try {
    const locationData = JSON.parse(fs.readFileSync(path.join(LOCATIONS_DIR, file), 'utf8'));
    const citySlug = file.replace('.json', '');
    const cityName = locationData.cityName || citySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    
    // Add the location to the array
    locations.push({
      cityName,
      citySlug,
      state: locationData.state || '',
      appraisers: locationData.appraisers || []
    });
  } catch (error) {
    console.error(`Error loading location data from ${file}:`, error);
  }
}

console.log(`Loaded ${locations.length} locations with ${locations.reduce((count, location) => count + location.appraisers.length, 0)} appraisers.`);

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

/**
 * Generate a static HTML for a location page
 */
function generateLocationHTML(location, cssPath, jsPath) {
  const { cityName, citySlug, state = 'USA' } = location;
  const appraisers = location.appraisers || [];
  
  const title = `Art Appraisers in ${cityName}, ${state} | Find Local Art Valuation Experts | Appraisily`;
  const description = `Find professional art appraisers in ${cityName}, ${state}. Our directory features ${appraisers.length} certified experts specializing in fine art valuation, insurance appraisals, and estate valuations.`;
  const canonicalUrl = `https://art-appraiser.appraisily.com/location/${citySlug}`;
  
  // Create schema data for the location page
  const locationSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": `${cityName}, ${state}`,
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": state,
      "addressCountry": "US"
    }
  };
  
  // Breadcrumb schema
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
  
  // Combine all schema
  const combinedSchema = JSON.stringify([locationSchema, breadcrumbSchema]);
  
  // Generate appraiser cards
  const appraiserCards = appraisers.map(appraiser => {
    const appraiserUrl = `/appraiser/${appraiser.id}`;
    const imageUrl = appraiser.image || appraiser.imageUrl || 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
    const specialties = appraiser.specialties ? appraiser.specialties.join(', ') : 'Art Appraisal';
    
    return `
      <div class="appraiser-card">
        <div class="appraiser-image">
          <img 
            src="${imageUrl}" 
            alt="${appraiser.name}" 
            width="150" 
            height="150"
            onerror="this.onerror=null; this.src='https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';"
          />
        </div>
        <div class="appraiser-info">
          <h3><a href="${appraiserUrl}">${appraiser.name}</a></h3>
          <div class="rating">
            <span class="stars">★★★★★</span>
            <span>${appraiser.rating || '4.5'}/5</span>
          </div>
          <p class="specialties"><strong>Specialties:</strong> ${specialties}</p>
          <p class="address">${appraiser.address || `${cityName}, ${state}`}</p>
          <a href="${appraiserUrl}" class="view-profile">View Profile</a>
        </div>
      </div>
    `;
  }).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="Appraisily" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${combinedSchema}
    </script>
    
    <!-- Styles -->
    <link href="${cssPath}" rel="stylesheet" />
    <style>
      /* Additional custom styles */
      .location-hero {
        background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1577720580479-7d839d829c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80');
        background-size: cover;
        background-position: center;
        color: white;
        padding: 60px 0;
        text-align: center;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .appraiser-list {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
        margin-top: 40px;
      }
      @media (min-width: 768px) {
        .appraiser-list {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .appraiser-card {
        display: flex;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      .appraiser-image {
        flex: 0 0 150px;
      }
      .appraiser-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .appraiser-info {
        flex: 1;
        padding: 15px;
      }
      .appraiser-info h3 {
        margin-top: 0;
        margin-bottom: 10px;
      }
      .appraiser-info h3 a {
        color: #333;
        text-decoration: none;
      }
      .appraiser-info h3 a:hover {
        text-decoration: underline;
      }
      .rating {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      .stars {
        color: #ffc107;
        margin-right: 5px;
      }
      .specialties, .address {
        margin: 5px 0;
        font-size: 14px;
      }
      .view-profile {
        display: inline-block;
        background: #4a6cf7;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        text-decoration: none;
        font-size: 14px;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <header>
      <nav class="container">
        <a href="/">Art Appraisers Directory</a>
        <span> / </span>
        <span>Art Appraisers in ${cityName}</span>
      </nav>
    </header>
    
    <main>
      <section class="location-hero">
        <div class="container">
          <h1>Art Appraisers in ${cityName}, ${state}</h1>
          <p>Find professional art appraisers specializing in fine art valuation, insurance appraisals, and estate valuations.</p>
        </div>
      </section>
      
      <section class="container">
        <h2>${appraisers.length} Art Appraisers in ${cityName}</h2>
        <p>Browse our directory of certified art appraisers in ${cityName} to find the right expert for your needs.</p>
        
        <div class="appraiser-list">
          ${appraiserCards}
        </div>
      </section>
    </main>
    
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
      </div>
    </footer>
    
    <!-- Basic JavaScript for image error handling -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.onerror = function() {
            console.log('Replacing broken image with placeholder:', this.alt);
            this.onerror = null;
            this.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
          };
        });
      });
    </script>
  </body>
</html>`;
}

function generateAppraiserHTML(appraiser, cityName, cssPath, jsPath) {
  // Format appraiser name and business name for SEO-friendly title
  const displayName = appraiser.businessName 
    ? `${appraiser.name} (${appraiser.businessName})` 
    : appraiser.name;
  
  // Ensure no undefined values in specialties
  const specialties = appraiser.specialties || [];
  const specialtiesText = specialties.join(', ') || 'Art Appraisal Services';
  
  const title = `${displayName} - Art Appraiser in ${cityName} | Expert Art Valuation Services | Appraisily`;
  const description = `Get professional art appraisal services from ${displayName}. Specializing in ${specialtiesText}. Find certified art appraisers near you.`;
  const canonicalUrl = `https://art-appraiser.appraisily.com/appraiser/${appraiser.id}`;
  
  // Ensure image URL is valid
  const imageUrl = appraiser.image || appraiser.imageUrl || 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
  
  // Create schema data for structured data
  const appraiserSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": displayName,
    "image": imageUrl,
    "description": description,
    "url": canonicalUrl,
    "telephone": appraiser.phone || '',
    "email": appraiser.email || '',
    "priceRange": "$$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": appraiser.rating?.toString() || "4.5",
      "reviewCount": appraiser.reviewCount?.toString() || "1",
      "bestRating": "5",
      "worstRating": "1"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": appraiser.city || cityName,
      "addressRegion": appraiser.state || "",
      "addressCountry": "US"
    }
  };
  
  // Breadcrumb schema
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
        "item": `https://art-appraiser.appraisily.com/location/${appraiser.id.split('-')[0]}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": displayName,
        "item": canonicalUrl
      }
    ]
  };
  
  // Combine all schema
  const combinedSchema = JSON.stringify([appraiserSchema, breadcrumbSchema]);
  
  // Create a static HTML page that does not rely on React hydration
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="Appraisily" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${combinedSchema}
    </script>
    
    <!-- Styles -->
    <link href="${cssPath}" rel="stylesheet" />
    <style>
      /* Additional custom styles */
      .appraiser-hero {
        position: relative;
        height: 300px;
        overflow: hidden;
      }
      .appraiser-hero img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .appraiser-hero-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 20px;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        color: white;
      }
      .appraiser-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .appraiser-header {
        margin-bottom: 30px;
      }
      .appraiser-profile {
        display: grid;
        grid-template-columns: 1fr;
        gap: 30px;
      }
      @media (min-width: 768px) {
        .appraiser-profile {
          grid-template-columns: 3fr 1fr;
        }
      }
      .appraiser-details {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
      }
      .appraiser-contact {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
      }
      .appraiser-specialties {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }
      .appraiser-specialty {
        background: #f0f0f0;
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 14px;
      }
      .rating {
        display: flex;
        align-items: center;
        margin: 10px 0;
      }
      .stars {
        color: #ffc107;
        margin-right: 5px;
      }
    </style>
  </head>
  <body>
    <header>
      <nav class="appraiser-container">
        <a href="/">Art Appraisers Directory</a>
        <span> / </span>
        <a href="/location/${appraiser.id.split('-')[0]}">Art Appraisers in ${cityName}</a>
        <span> / </span>
        <span>${displayName}</span>
      </nav>
    </header>
    
    <main>
      <div class="appraiser-hero">
        <img 
          src="${imageUrl}" 
          alt="${displayName}" 
          width="1200" 
          height="300"
          onerror="this.onerror=null; this.src='https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';"
        />
        <div class="appraiser-hero-overlay">
          <h1>${displayName}</h1>
          <div class="rating">
            <span class="stars">★★★★★</span>
            <span>${appraiser.rating || '4.5'}/5 (${appraiser.reviewCount || '1'} reviews)</span>
          </div>
        </div>
      </div>
      
      <div class="appraiser-container">
        <div class="appraiser-profile">
          <div class="appraiser-details">
            <div class="appraiser-header">
              <h2>About ${displayName}</h2>
              <p>${appraiser.about || `${displayName} provides professional art appraisal services in ${cityName}. With expertise in ${specialtiesText}, they offer reliable valuations for insurance, estate planning, and donations.`}</p>
            </div>
            
            <div class="appraiser-section">
              <h3>Specialties</h3>
              <div class="appraiser-specialties">
                ${specialties.map(specialty => `<span class="appraiser-specialty">${specialty}</span>`).join('') || '<span class="appraiser-specialty">Art Appraisal</span>'}
              </div>
            </div>
            
            <div class="appraiser-section">
              <h3>Services</h3>
              <ul>
                ${(() => {
                  // Handle different data structures for services
                  if (appraiser.services_offered) {
                    if (Array.isArray(appraiser.services_offered)) {
                      return appraiser.services_offered.map(service => {
                        if (typeof service === 'string') {
                          return `<li>${service}</li>`;
                        } else if (typeof service === 'object' && service.name) {
                          return `<li>${service.name}</li>`;
                        }
                        return '';
                      }).join('');
                    } else if (typeof appraiser.services_offered === 'string') {
                      return `<li>${appraiser.services_offered}</li>`;
                    }
                  }
                  
                  // Fallback for no services
                  return '<li>Art Appraisal Services</li>';
                })()}
              </ul>
            </div>
            
            ${appraiser.pricing ? `
            <div class="appraiser-section">
              <h3>Pricing</h3>
              <p>${appraiser.pricing}</p>
            </div>
            ` : ''}
            
            ${appraiser.certifications && appraiser.certifications.length > 0 ? `
            <div class="appraiser-section">
              <h3>Certifications</h3>
              <ul>
                ${appraiser.certifications.map(cert => `<li>${cert}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
          </div>
          
          <div class="appraiser-contact">
            <h3>Contact Information</h3>
            <p><strong>Location:</strong> ${appraiser.address || `${cityName}, ${appraiser.state || ''}`}</p>
            ${appraiser.phone ? `<p><strong>Phone:</strong> <a href="tel:${appraiser.phone}">${appraiser.phone}</a></p>` : ''}
            ${appraiser.email ? `<p><strong>Email:</strong> <a href="mailto:${appraiser.email}">${appraiser.email}</a></p>` : ''}
            ${appraiser.website ? `<p><strong>Website:</strong> <a href="${appraiser.website}" target="_blank" rel="noopener">${appraiser.website.replace(/^https?:\/\//, '')}</a></p>` : ''}
            
            ${appraiser.years_in_business ? `<p><strong>Experience:</strong> ${appraiser.years_in_business}</p>` : ''}
            
            ${appraiser.notes ? `<div class="appraiser-section">
              <h3>Additional Information</h3>
              <p>${appraiser.notes}</p>
            </div>` : ''}
          </div>
        </div>
      </div>
    </main>
    
    <footer>
      <div class="appraiser-container">
        <p>&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
      </div>
    </footer>
    
    <!-- Basic JavaScript for image error handling -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.onerror = function() {
            console.log('Replacing broken image with placeholder:', this.alt);
            this.onerror = null;
            this.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
          };
        });
      });
    </script>
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

async function createStaticHtml() {
  try {
    // Clear out the dist directory if it exists
    if (fs.existsSync(DIST_DIR)) {
      fs.rmSync(DIST_DIR, { recursive: true, force: true });
      console.log('Cleared existing dist directory');
    }
    
    // Create the root output directory
    fs.mkdirSync(DIST_DIR);
    console.log('Created dist directory');

    // Copy the CSS and JS from the Vite build
    const buildDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(buildDir)) {
      console.error('Build directory does not exist. Please run "npm run build" first.');
      process.exit(1);
    }
    
    // Create the assets directory
    const outputAssetsDir = path.join(DIST_DIR, 'assets');
    fs.mkdirSync(outputAssetsDir, { recursive: true });
    console.log('Created assets directory');
    
    // Find the CSS and JS files
    const assetsDir = path.join(buildDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      console.error('Assets directory does not exist in the build directory.');
      // Use default paths as fallback
      const cssPath = '/assets/index.css';
      const jsPath = '/assets/index.js';
      
      // Create empty files to prevent errors
      fs.writeFileSync(path.join(outputAssetsDir, 'index.css'), '/* Placeholder CSS */');
      fs.writeFileSync(path.join(outputAssetsDir, 'index.js'), '/* Placeholder JS */');
      console.log('Created placeholder CSS and JS files');
      
      // Continue with the rest of the function using default paths
      await generateStaticPages(cssPath, jsPath);
      return;
    }
    
    const cssFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.css'));
    const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js'));
    
    if (cssFiles.length === 0 || jsFiles.length === 0) {
      console.error('Could not find CSS or JS files in the build directory.');
      // Use default paths as fallback
      const cssPath = '/assets/index.css';
      const jsPath = '/assets/index.js';
      
      // Create empty files to prevent errors
      fs.writeFileSync(path.join(outputAssetsDir, 'index.css'), '/* Placeholder CSS */');
      fs.writeFileSync(path.join(outputAssetsDir, 'index.js'), '/* Placeholder JS */');
      console.log('Created placeholder CSS and JS files');
      
      // Continue with the rest of the function using default paths
      await generateStaticPages(cssPath, jsPath);
      return;
    }
    
    const cssPath = `/assets/${cssFiles[0]}`;
    const jsPath = `/assets/${jsFiles[0]}`;
    
    // Copy the assets
    fs.copyFileSync(path.join(assetsDir, cssFiles[0]), path.join(outputAssetsDir, cssFiles[0]));
    fs.copyFileSync(path.join(assetsDir, jsFiles[0]), path.join(outputAssetsDir, jsFiles[0]));
    console.log('Copied CSS and JS files');
    
    // Continue with the rest of the function
    await generateStaticPages(cssPath, jsPath);
  } catch (error) {
    console.error('Error generating static HTML:', error);
    process.exit(1);
  }
}

// Helper function to generate static pages
async function generateStaticPages(cssPath, jsPath) {
  // Generate the sitemap and robots.txt
  await generateSitemap();
  console.log('Generated sitemap.xml and robots.txt');
  
  // Process all locations
  for (const location of locations) {
    console.log(`Processing ${location.cityName}...`);
    
    // Create the directory for this location
    const locationDir = path.join(DIST_DIR, 'location', location.citySlug);
    fs.mkdirSync(locationDir, { recursive: true });
    
    // Generate location HTML
    const locationHtml = generateLocationHTML(location, cssPath, jsPath);
    fs.writeFileSync(path.join(locationDir, 'index.html'), locationHtml);
    
    // Process all appraisers in this location
    for (const appraiser of location.appraisers) {
      // Create the directory for this appraiser
      const appraiserDir = path.join(DIST_DIR, 'appraiser', appraiser.id);
      fs.mkdirSync(appraiserDir, { recursive: true });
      
      // Generate appraiser HTML
      const appraiserHtml = generateAppraiserHTML(appraiser, location.cityName, cssPath, jsPath);
      fs.writeFileSync(path.join(appraiserDir, 'index.html'), appraiserHtml);
      console.log(`  - Generated page for ${appraiser.name}`);
    }
  }
  
  // Create index.html for the home page
  const indexHtml = generateIndexHTML(cssPath, jsPath);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
  console.log('Generated index.html');
  
  // Copy the necessary static assets (images, favicon, etc.)
  const buildDir = path.join(process.cwd(), 'dist');
  if (fs.existsSync(path.join(buildDir, 'img'))) {
    fs.cpSync(path.join(buildDir, 'img'), path.join(DIST_DIR, 'img'), { recursive: true });
    console.log('Copied img directory');
  }
  
  // Inject the fallback image handler scripts to all HTML files
  injectFallbackHandlerToAllHtml();
  
  console.log('Static HTML generation complete!');
}

// Inject the fallback image handler script to all HTML files
function injectFallbackHandlerToAllHtml() {
  const htmlFiles = glob.sync(path.join(DIST_DIR, '**/*.html'));
  let count = 0;
  
  for (const htmlFile of htmlFiles) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Only inject if it doesn't already have the script
    if (!content.includes('document.addEventListener(\'DOMContentLoaded\'')) {
      // Insert before closing body tag
      content = content.replace('</body>', `
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.onerror = function() {
          console.log('Replacing broken image with placeholder:', this.alt);
          this.onerror = null;
          this.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
        };
      });
    });
  </script>
</body>`);
      
      fs.writeFileSync(htmlFile, content);
      count++;
    }
  }
  
  console.log(`Injected fallback image handler to ${count} HTML files.`);
}

/**
 * Generate a static HTML for the home page
 */
function generateIndexHTML(cssPath, jsPath) {
  const title = "Art Appraiser Directory | Find Certified Art Appraisers Near You | Appraisily";
  const description = "Find professional art appraisers near you. Our directory features certified experts specializing in fine art valuation, insurance appraisals, and estate valuations.";
  const canonicalUrl = "https://art-appraiser.appraisily.com";
  
  // Create schema data for the home page
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Art Appraiser Directory",
    "url": canonicalUrl,
    "description": description,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://art-appraiser.appraisily.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
  
  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Appraisily",
    "url": "https://appraisily.com",
    "logo": "https://appraisily.com/logo.png",
    "sameAs": [
      "https://www.facebook.com/appraisily",
      "https://twitter.com/appraisily"
    ]
  };
  
  // Combine all schema
  const combinedSchema = JSON.stringify([websiteSchema, organizationSchema]);
  
  // Generate popular locations list
  const popularLocations = locations.slice(0, 10).map(location => 
    `<li><a href="/location/${location.citySlug}">${location.cityName}</a></li>`
  ).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonicalUrl}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="Appraisily" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${canonicalUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    
    <!-- Schema.org structured data -->
    <script type="application/ld+json">
      ${combinedSchema}
    </script>
    
    <!-- Styles -->
    <link href="${cssPath}" rel="stylesheet" />
    <style>
      /* Additional custom styles */
      .hero {
        background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1577720580479-7d839d829c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80');
        background-size: cover;
        background-position: center;
        color: white;
        padding: 100px 0;
        text-align: center;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .locations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 40px;
      }
      .location-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 20px;
        transition: transform 0.3s ease;
      }
      .location-card:hover {
        transform: translateY(-5px);
      }
      .cta-section {
        background: #f5f5f5;
        padding: 60px 0;
        text-align: center;
        margin: 40px 0;
      }
      .button {
        display: inline-block;
        background: #4a6cf7;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: bold;
        margin-top: 20px;
      }
      .popular-locations {
        margin-top: 40px;
      }
      .popular-locations ul {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 10px;
        list-style: none;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <header>
      <nav class="container">
        <a href="/">Art Appraisers Directory</a>
      </nav>
    </header>
    
    <main>
      <section class="hero">
        <div class="container">
          <h1>Find Certified Art Appraisers Near You</h1>
          <p>Connect with professional art appraisers specializing in fine art valuation, insurance appraisals, and estate valuations.</p>
        </div>
      </section>
      
      <section class="container">
        <h2>Why Choose a Professional Art Appraiser?</h2>
        <p>Professional art appraisers provide expert valuations for insurance, estate planning, donations, and sales. Their expertise ensures you receive accurate and reliable valuations for your artwork.</p>
        
        <div class="locations-grid">
          <div class="location-card">
            <h3>Insurance Appraisals</h3>
            <p>Get accurate valuations for insurance coverage to protect your valuable art collection.</p>
          </div>
          <div class="location-card">
            <h3>Estate Valuations</h3>
            <p>Professional appraisals for estate planning, probate, and equitable distribution.</p>
          </div>
          <div class="location-card">
            <h3>Donation Appraisals</h3>
            <p>IRS-compliant appraisals for charitable donations and tax deductions.</p>
          </div>
          <div class="location-card">
            <h3>Sales Advisory</h3>
            <p>Expert guidance on market values when buying or selling artwork.</p>
          </div>
        </div>
      </section>
      
      <section class="cta-section">
        <div class="container">
          <h2>Ready to Find an Art Appraiser?</h2>
          <p>Browse our directory of certified art appraisers to find the right expert for your needs.</p>
          <a href="#popular-locations" class="button">Find an Appraiser</a>
        </div>
      </section>
      
      <section id="popular-locations" class="container popular-locations">
        <h2>Popular Locations</h2>
        <ul>
          ${popularLocations}
        </ul>
      </section>
    </main>
    
    <footer>
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
      </div>
    </footer>
    
    <!-- Basic JavaScript for image error handling -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.onerror = function() {
            console.log('Replacing broken image with placeholder:', this.alt);
            this.onerror = null;
            this.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
          };
        });
      });
    </script>
  </body>
</html>`;
}

/**
 * Generate a sitemap.xml file for the site
 */
async function generateSitemap() {
  const siteUrl = process.env.SITE_URL || 'https://art-appraiser.appraisily.com';
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`;
  
  // Add location pages
  for (const location of locations) {
    sitemap += `
  <url>
    <loc>${siteUrl}/location/${location.citySlug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    
    // Add appraiser pages for this location
    for (const appraiser of location.appraisers) {
      sitemap += `
  <url>
    <loc>${siteUrl}/appraiser/${appraiser.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  }
  
  // Close the sitemap
  sitemap += `
</urlset>`;
  
  // Write the sitemap to the dist directory
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
  console.log(`Generated sitemap with ${locations.length} locations and ${locations.reduce((count, location) => count + location.appraisers.length, 0)} appraisers.`);
  
  // Generate robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;
  
  fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);
  console.log('Generated robots.txt');
}

// Call the main function
createStaticHtml().catch(err => {
  console.error('Error generating static HTML:', err);
  process.exit(1);
});