import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Configuration 
const BASE_URL = process.env.SITE_URL || 'https://your-art-appraiser-site.com';
const SITEMAP_PATH = path.join(DIST_DIR, 'sitemap.xml');

async function generateSitemap() {
  console.log('Generating comprehensive sitemap...');

  try {
    // Ensure dist directory exists
    fs.ensureDirSync(DIST_DIR);

    // 1. Start with main routes
    const routes = [
      '/',
      '/about',
      '/services',
      '/expertise',
      '/team',
      '/start'
    ];

    // 2. Add location pages
    const locationFiles = fs.readdirSync(LOCATIONS_DIR)
      .filter(file => file.endsWith('.json') && !file.includes('copy') && !file.includes('lifecycle') && !file.includes('cors') && !file.includes('hugo'));

    locationFiles.forEach(file => {
      const citySlug = file.replace('.json', '');
      routes.push(`/location/${citySlug}`);

      // 3. Add all appraiser pages from this location
      try {
        const locationData = JSON.parse(fs.readFileSync(path.join(LOCATIONS_DIR, file)));
        locationData.appraisers?.forEach(appraiser => {
          if (appraiser.id) {
            routes.push(`/appraiser/${appraiser.id}`);
          }
        });
      } catch (error) {
        console.error(`Error processing location file ${file}:`, error);
      }
    });

    // 4. Look for any additional HTML files in the dist directory
    findAllHtmlFiles(DIST_DIR).forEach(htmlPath => {
      // Convert file path to route
      const relativePath = path.relative(DIST_DIR, path.dirname(htmlPath));
      const route = relativePath === '' ? '/' : `/${relativePath.replace(/\\/g, '/')}`;
      
      // Add if not already included
      if (!routes.includes(route)) {
        routes.push(route);
      }
    });

    // Remove duplicates and sort
    const uniqueRoutes = [...new Set(routes)].sort();

    // Generate the sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    uniqueRoutes.forEach(route => {
      // Skip any hash routes or query strings
      if (route.includes('#') || route.includes('?')) return;
      
      sitemap += '  <url>\n';
      sitemap += `    <loc>${BASE_URL}${route}</loc>\n`;
      sitemap += '    <changefreq>weekly</changefreq>\n';
      
      // Set priority based on route depth
      const depth = (route.match(/\//g) || []).length;
      const priority = Math.max(0.5, 1.0 - (depth * 0.2)).toFixed(1);
      
      sitemap += `    <priority>${priority}</priority>\n`;
      sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    // Write the sitemap file
    fs.writeFileSync(SITEMAP_PATH, sitemap);
    console.log(`Sitemap generated with ${uniqueRoutes.length} URLs at ${SITEMAP_PATH}`);
    
    // Optional: Generate a simple text file listing all routes for debugging
    fs.writeFileSync(path.join(DIST_DIR, 'routes.txt'), uniqueRoutes.join('\n'));
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

// Helper function to find all HTML files recursively
function findAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAllHtmlFiles(filePath, fileList);
    } else if (file === 'index.html') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Run the sitemap generator
generateSitemap().catch(error => {
  console.error('Failed to generate sitemap:', error);
  process.exit(1);
}); 