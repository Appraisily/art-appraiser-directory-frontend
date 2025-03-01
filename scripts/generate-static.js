import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

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
  return `    <footer class="bg-gray-900 text-white py-12">
      <div class="container mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-xl font-bold mb-4">Appraisily</h3>
            <p class="text-gray-400">Expert art appraisal services for collectors, estates, insurance, and more.</p>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-4">Quick Links</h3>
            <ul class="space-y-2">
              <li><a href="/directory" class="text-gray-400 hover:text-white transition">Find an Appraiser</a></li>
              <li><a href="/" class="text-gray-400 hover:text-white transition">Home</a></li>
              <li><a href="/about" class="text-gray-400 hover:text-white transition">About Us</a></li>
              <li><a href="/contact" class="text-gray-400 hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-4">Services</h3>
            <ul class="space-y-2">
              <li><a href="/art-appraisal" class="text-gray-400 hover:text-white transition">Art Appraisal</a></li>
              <li><a href="/painting-valuation" class="text-gray-400 hover:text-white transition">Painting Valuation</a></li>
              <li><a href="/art-authentication" class="text-gray-400 hover:text-white transition">Art Authentication</a></li>
              <li><a href="/estate-appraisal" class="text-gray-400 hover:text-white transition">Estate Appraisal</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-xl font-bold mb-4">Contact Us</h3>
            <p class="text-gray-400">Have questions? Need assistance?</p>
            <p class="text-gray-400 mt-2">Email: <a href="mailto:info@appraisily.com" class="text-primary hover:text-white transition">info@appraisily.com</a></p>
          </div>
        </div>
        <div class="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p class="text-gray-400">&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
          <div class="flex space-x-4 mt-4 md:mt-0">
            <a href="#" class="text-gray-400 hover:text-white transition">Privacy Policy</a>
            <a href="#" class="text-gray-400 hover:text-white transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
    <script type="module" src="${jsPath}"></script>
  </body>
</html>`;
}

function generateLocationHTML(locationData, cityName, citySlug, cssPath, jsPath) {
  const appraisersHTML = locationData.appraisers?.map(appraiser => `
    <a href="/appraiser/${appraiser.id || ''}" class="rounded-lg border bg-white text-foreground shadow-sm group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div class="relative">
        <div style="position: relative; width: 100%; padding-bottom: 75%">
          <div style="position: absolute; inset: 0">
            <img src="${generateImageUrl(appraiser)}" alt="${appraiser.name}" class="object-cover w-full h-full" loading="lazy" />
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <div class="flex items-center gap-1">
            <svg class="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span class="text-white font-semibold">${appraiser.rating}/5</span>
            <span class="text-white/80 text-sm">(${appraiser.reviewCount} reviews)</span>
          </div>
        </div>
      </div>
      <div class="p-4">
        <h2 class="font-bold text-xl mb-2 group-hover:text-primary transition-colors">${appraiser.name}</h2>
        <div class="flex items-center gap-2 text-muted-foreground mb-2">
          <svg class="h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span class="text-sm truncate">${appraiser.address}</span>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          ${(() => {
            // Handle case where specialties could be a string instead of an array
            if (typeof appraiser.specialties === 'string') {
              return `<span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                ${appraiser.specialties}
              </span>`;
            }
            
            // Handle normal array case
            return appraiser.specialties?.map(specialty => `
              <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                ${specialty}
              </span>
            `).join('') || '';
          })()}
        </div>
      </div>
    </a>
  `).join('') || '';

  const title = `Art Appraisers in ${cityName} | Expert Art Valuation Services`;
  const description = `Find certified art appraisers in ${cityName}. Get expert art valuations, authentication services, and professional advice for your art collection.`;

  return `${getHeaderHTML(title, description, cssPath)}
    <div class="min-h-screen bg-background flex flex-col">
      <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container flex h-14 items-center">
          <a href="/directory" class="flex items-center pl-4">
            <div class="flex items-center gap-3">
              <img src="https://cdn.mcauto-images-production.sendgrid.net/304ac75ef1d5c007/8aeb2689-2b5b-402d-a6f3-6521621e123a/300x300.png" alt="Appraisily Logo" class="w-10 h-10" />
              <span class="font-bold text-2xl tracking-tight">Appraisily</span>
            </div>
          </a>
          <nav class="flex items-center ml-auto space-x-4 lg:space-x-6 mr-4">
            <a href="/directory" class="text-sm font-medium transition-colors hover:text-primary">Directory</a>
            <a href="/art-appraisal" class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Art Appraisal</a>
            <a href="/contact" class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Contact</a>
          </nav>
        </div>
      </header>

      <div class="flex-1">
        <div class="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
          <div class="container mx-auto px-6">
            <h1 class="text-4xl font-bold text-foreground mb-4">Art Appraisers in ${cityName}</h1>
            <p class="text-lg text-muted-foreground max-w-2xl">
              Connect with certified art appraisers in ${cityName}. Get expert valuations,
              authentication services, and professional advice for your art collection.
            </p>
          </div>
        </div>

        <main class="container mx-auto px-6 py-12">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${appraisersHTML}
          </div>
        </main>
      </div>
    </div>
${getFooterHTML(jsPath)}`;
}

function generateAppraiserHTML(appraiser, cityName, cssPath, jsPath) {
  const title = `${appraiser.name} - Art Appraiser | Expert Art Valuation Services`;
  const description = `Get professional art appraisal services from ${appraiser.name}. Specializing in ${typeof appraiser.specialties === 'string' ? appraiser.specialties : appraiser.specialties?.join(', ')}. Certified expert with ${appraiser.reviewCount} verified reviews.`;

  return `${getHeaderHTML(title, description, cssPath)}
    <div class="min-h-screen bg-background flex flex-col">
      <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="container flex h-14 items-center">
          <a href="/directory" class="flex items-center pl-4">
            <div class="flex items-center gap-3">
              <img src="https://cdn.mcauto-images-production.sendgrid.net/304ac75ef1d5c007/8aeb2689-2b5b-402d-a6f3-6521621e123a/300x300.png" alt="Appraisily Logo" class="w-10 h-10" />
              <span class="font-bold text-2xl tracking-tight">Appraisily</span>
            </div>
          </a>
          <nav class="flex items-center ml-auto space-x-4 lg:space-x-6 mr-4">
            <a href="/directory" class="text-sm font-medium transition-colors hover:text-primary">Directory</a>
            <a href="/art-appraisal" class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Art Appraisal</a>
            <a href="/contact" class="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Contact</a>
          </nav>
        </div>
      </header>

      <div class="flex-1">
        <div class="relative h-[300px] md:h-[400px]">
          <img src="${generateImageUrl(appraiser)}" alt="${appraiser.name}" class="w-full h-full object-cover" loading="lazy" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        <div class="container mx-auto px-6 -mt-16 relative z-10">
          <div class="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 class="text-3xl font-bold text-foreground">${appraiser.name}</h1>
                <div class="flex items-center gap-4 mt-2">
                  <div class="flex items-center gap-1">
                    <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span class="font-semibold">${appraiser.rating}/5</span>
                    <span class="text-muted-foreground">(${appraiser.reviewCount} reviews)</span>
                  </div>
                  <div class="flex items-center gap-2 text-muted-foreground">
                    <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>${appraiser.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-8">
              <h2 class="text-2xl font-semibold mb-4">Specialties</h2>
              <div class="flex flex-wrap gap-2">
                ${(() => {
                  // Handle case where specialties could be a string instead of an array
                  if (typeof appraiser.specialties === 'string') {
                    return `<span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      ${appraiser.specialties}
                    </span>`;
                  }
                  
                  // Handle normal array case
                  return appraiser.specialties?.map(specialty => `
                    <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      ${specialty}
                    </span>
                  `).join('') || '';
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
${getFooterHTML(jsPath)}`;
}