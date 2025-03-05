import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');
const DIST_DIR = path.join(__dirname, '../dist');
const APPRAISERS_DIR = path.join(DIST_DIR, 'appraiser');

// Default placeholder image for missing images
const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';

// Make sure we have all necessary directories
fs.ensureDirSync(DIST_DIR);
fs.ensureDirSync(APPRAISERS_DIR);

/**
 * Safely gets a property from an object, returning a default if not found
 */
function safeGet(obj, path, defaultValue = '') {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined && result !== null ? result : defaultValue;
}

/**
 * Generates a static HTML page for a single appraiser
 */
async function generateAppraiserStaticPage(appraiser, locationData, cityName) {
  if (!appraiser || !appraiser.id) {
    console.log('⚠️ Skipping appraiser with no ID');
    return;
  }

  const displayName = safeGet(appraiser, 'businessName') 
    ? `${safeGet(appraiser, 'name')} (${safeGet(appraiser, 'businessName')})` 
    : safeGet(appraiser, 'name', 'Art Appraiser');
  
  const specialtiesText = Array.isArray(safeGet(appraiser, 'specialties'))
    ? safeGet(appraiser, 'specialties', ['Fine Art Appraisal']).join(', ')
    : safeGet(appraiser, 'specialties', 'Fine Art Appraisal');
    
  const description = `Get professional art appraisal services from ${displayName}. Specializing in ${specialtiesText}. Located in ${safeGet(appraiser, 'city', cityName)}, ${safeGet(appraiser, 'state', '')}.`;
  
  // Pick the first available image URL or use a placeholder
  const imageUrl = safeGet(appraiser, 'image') || 
                  safeGet(appraiser, 'imageUrl') || 
                  DEFAULT_PLACEHOLDER_IMAGE;
  
  // Ensure directories exist
  const appraiserDir = path.join(APPRAISERS_DIR, appraiser.id);
  fs.ensureDirSync(appraiserDir);
  
  // Get styles and scripts
  const cssFiles = await glob('assets/*.css', { cwd: DIST_DIR });
  const jsFiles = await glob('assets/*.js', { cwd: DIST_DIR });
  
  const cssPath = cssFiles.length > 0 ? `/${cssFiles[0]}` : '';
  const jsPath = jsFiles.length > 0 ? `/${jsFiles[0]}` : '';
  
  // Load any existing meta tags from the original page if it exists
  let metaTags = '';
  const existingHtmlPath = path.join(appraiserDir, 'index.html');
  if (fs.existsSync(existingHtmlPath)) {
    const existingHtml = fs.readFileSync(existingHtmlPath, 'utf8');
    const metaMatch = existingHtml.match(/<meta[^>]*>/g);
    if (metaMatch) {
      metaTags = metaMatch.join('\\n');
    }
  }
  
  // Create the schema data for the appraiser
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": displayName,
    "image": imageUrl,
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": safeGet(appraiser, 'city', cityName),
      "addressRegion": safeGet(appraiser, 'state', '')
    },
    "telephone": safeGet(appraiser, 'phone', ''),
    "url": safeGet(appraiser, 'website', ''),
    "priceRange": safeGet(appraiser, 'pricing', '$$'),
    "sameAs": safeGet(appraiser, 'website') ? [safeGet(appraiser, 'website')] : [],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ],
      "opens": "09:00",
      "closes": "17:00"
    }
  };
  
  // Build a full HTML page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <meta property="og:title" content="${displayName} | Art Appraiser | Appraisily">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="Appraisily">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${displayName} | Art Appraiser | Appraisily">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  <title>${displayName} | Art Appraiser | Appraisily</title>
  <link rel="stylesheet" href="${cssPath}">
  <script type="application/ld+json">
    ${JSON.stringify(schemaData, null, 2)}
  </script>
  <!-- Critical inline CSS for the appraiser page -->
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .appraiser-page { padding: 40px 0; }
    .appraiser-info { display: flex; flex-wrap: wrap; gap: 30px; margin: 30px 0; }
    .appraiser-image { flex: 0 0 300px; height: 300px; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .appraiser-details { flex: 1; min-width: 300px; }
    .appraiser-image img { width: 100%; height: 100%; object-fit: cover; }
    h1 { margin-top: 0; color: #1a365d; font-size: 2.2rem; }
    h2 { color: #2a4365; font-size: 1.6rem; margin-top: 30px; }
    ul { padding-left: 20px; }
    .contact-info { margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
    .nav { background: #1a365d; color: white; padding: 15px 0; }
    .nav .container { display: flex; justify-content: space-between; align-items: center; }
    .nav a { color: white; text-decoration: none; }
    .logo { font-weight: bold; font-size: 1.5rem; }
    .nav-links { display: flex; gap: 20px; }
    .breadcrumbs { margin: 20px 0; color: #64748b; }
    .breadcrumbs a { color: #2563eb; text-decoration: none; }
    .fallback-image { filter: grayscale(0.5); opacity: 0.9; }
    footer { background: #f1f5f9; padding: 40px 0; margin-top: 60px; text-align: center; color: #64748b; }
    .cta-button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; margin-top: 20px; }
    @media (max-width: 768px) {
      .appraiser-info { flex-direction: column; }
      .appraiser-image { width: 100%; }
    }
  </style>
</head>
<body>
  <nav class="nav">
    <div class="container">
      <a href="/" class="logo">Appraisily</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/location/${cityName.toLowerCase()}">All ${cityName} Appraisers</a>
      </div>
    </div>
  </nav>
  
  <div class="container">
    <div class="breadcrumbs">
      <a href="/">Home</a> &gt; 
      <a href="/location/${cityName.toLowerCase()}">Art Appraisers in ${cityName}</a> &gt; 
      <span>${displayName}</span>
    </div>
    
    <div class="appraiser-page">
      <article itemscope itemtype="https://schema.org/ProfessionalService">
        <h1 itemprop="name">${displayName}</h1>
        
        <div class="appraiser-info">
          <div class="appraiser-image">
            <img 
              src="${imageUrl}" 
              alt="${displayName}" 
              itemprop="image" 
              width="300" 
              height="300" 
              loading="lazy"
              onerror="this.onerror=null; this.src='https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable'; this.classList.add('fallback-image');"
            />
          </div>
          
          <div class="appraiser-details">
            <p itemprop="description">${safeGet(appraiser, 'about', description)}</p>
            
            <div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
              <p><strong>Location:</strong> <span itemprop="addressLocality">${safeGet(appraiser, 'address', `${safeGet(appraiser, 'city', cityName)}, ${safeGet(appraiser, 'state', '')}`)}</span></p>
            </div>
            
            ${safeGet(appraiser, 'phone') ? `<p><strong>Phone:</strong> <span itemprop="telephone">${safeGet(appraiser, 'phone')}</span></p>` : ''}
            ${safeGet(appraiser, 'email') ? `<p><strong>Email:</strong> <span itemprop="email">${safeGet(appraiser, 'email')}</span></p>` : ''}
            ${safeGet(appraiser, 'website') ? `<p><strong>Website:</strong> <a href="${safeGet(appraiser, 'website')}" itemprop="url" target="_blank" rel="noopener noreferrer">${safeGet(appraiser, 'website')}</a></p>` : ''}
            
            ${safeGet(appraiser, 'rating') ? 
              `<div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
                <p><strong>Rating:</strong> <span itemprop="ratingValue">${safeGet(appraiser, 'rating')}</span>/5
                ${safeGet(appraiser, 'reviewCount') ? `(<span itemprop="reviewCount">${safeGet(appraiser, 'reviewCount')}</span> reviews)` : ''}
                </p>
              </div>` : ''
            }
            
            ${safeGet(appraiser, 'pricing') ? `<p><strong>Pricing:</strong> ${safeGet(appraiser, 'pricing')}</p>` : ''}
            
            <div class="contact-info">
              <h3>Need An Appraisal?</h3>
              <p>Contact this appraiser directly for a quote or ask about their art appraisal services.</p>
              ${safeGet(appraiser, 'phone') ? 
                `<a href="tel:${safeGet(appraiser, 'phone').replace(/[^0-9]/g, '')}" class="cta-button">Call Now</a>` : 
                (safeGet(appraiser, 'website') ? 
                  `<a href="${safeGet(appraiser, 'website')}" target="_blank" rel="noopener noreferrer" class="cta-button">Visit Website</a>` : 
                  `<a href="/location/${cityName.toLowerCase()}" class="cta-button">View More Appraisers</a>`
                )
              }
            </div>
          </div>
        </div>
        
        <section>
          <h2>Specialties</h2>
          <ul>
            ${Array.isArray(safeGet(appraiser, 'specialties')) 
              ? safeGet(appraiser, 'specialties', []).map(specialty => 
                  `<li>${specialty}</li>`
                ).join('\n            ')
              : `<li>${safeGet(appraiser, 'specialties', 'Fine Art Appraisal')}</li>`
            }
          </ul>
        </section>
        
        ${safeGet(appraiser, 'services_offered') ? 
          `<section>
            <h2>Services Offered</h2>
            <ul>
              ${Array.isArray(safeGet(appraiser, 'services_offered')) 
                ? safeGet(appraiser, 'services_offered', []).map(service => 
                    `<li>${service}</li>`
                  ).join('\n              ')
                : `<li>${safeGet(appraiser, 'services_offered', 'Art Appraisal Services')}</li>`
              }
            </ul>
          </section>` : ''
        }
        
        ${safeGet(appraiser, 'certifications') ? 
          `<section>
            <h2>Certifications</h2>
            <ul>
              ${Array.isArray(safeGet(appraiser, 'certifications')) 
                ? safeGet(appraiser, 'certifications', []).map(cert => 
                    `<li>${cert}</li>`
                  ).join('\n              ')
                : `<li>${safeGet(appraiser, 'certifications', 'Professional Art Appraiser')}</li>`
              }
            </ul>
          </section>` : ''
        }
        
        ${safeGet(appraiser, 'notes') ? 
          `<section>
            <h2>Additional Information</h2>
            <p>${safeGet(appraiser, 'notes')}</p>
          </section>` : ''
        }
      </article>
    </div>
  </div>
  
  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} Appraisily. All rights reserved.</p>
    </div>
  </footer>
  
  <!-- Fallback image script -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.complete) {
          if (!img.naturalWidth) {
            img.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
            img.classList.add('fallback-image');
          }
        }
      });
    });
  </script>
</body>
</html>`;

  // Write the HTML file
  const outputPath = path.join(appraiserDir, 'index.html');
  await fs.writeFile(outputPath, html, 'utf8');
  
  return outputPath;
}

/**
 * Generate static HTML for all appraisers
 */
async function generateAllAppraiserPages() {
  console.log('🔨 Generating static HTML for all appraiser pages...');
  let totalPages = 0;
  let failedPages = 0;
  
  // Get all location files
  const locationFiles = fs.readdirSync(LOCATIONS_DIR).filter(file => file.endsWith('.json'));
  
  for (const file of locationFiles) {
    const locationPath = path.join(LOCATIONS_DIR, file);
    const locationData = await fs.readJson(locationPath);
    const cityName = file.replace('.json', '');
    
    console.log(`📍 Processing appraisers in ${cityName}...`);
    
    if (!locationData.appraisers || locationData.appraisers.length === 0) {
      console.log(`  ℹ️ No appraisers found in ${file}`);
      continue;
    }
    
    for (const appraiser of locationData.appraisers) {
      try {
        if (!appraiser.id) {
          console.log(`  ⚠️ Skipping appraiser with no ID: ${appraiser.name || 'Unknown'}`);
          failedPages++;
          continue;
        }
        
        const outputPath = await generateAppraiserStaticPage(appraiser, locationData, cityName);
        console.log(`  ✅ Generated: ${appraiser.name} (${appraiser.id})`);
        totalPages++;
      } catch (error) {
        console.error(`  ❌ Error generating page for ${appraiser.name || appraiser.id || 'Unknown'}: ${error.message}`);
        failedPages++;
      }
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`📄 Total pages generated: ${totalPages}`);
  if (failedPages > 0) {
    console.log(`❌ Failed pages: ${failedPages}`);
  }
  console.log(`✅ Static HTML generation completed`);
}

// Run the script
generateAllAppraiserPages(); 