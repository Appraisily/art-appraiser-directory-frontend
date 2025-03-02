import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Configuration 
const BASE_URL = process.env.SITE_URL || 'https://art-appraiser.appraisily.com';
const SITEMAP_PATH = path.join(DIST_DIR, 'sitemap.xml');

// Recursive function to find all HTML files
function findAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fileList = findAllHtmlFiles(filePath, fileList);
    } else if (file === 'index.html') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

async function generateSitemap() {
  console.log('Generating comprehensive sitemap...');

  try {
    // Ensure dist directory exists
    fs.ensureDirSync(DIST_DIR);

    // Track routes with their metadata
    const routesWithMetadata = [];
    
    // 1. Add main routes with high priority
    const mainRoutes = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'weekly' },
      { url: '/services', priority: '0.8', changefreq: 'weekly' },
      { url: '/expertise', priority: '0.8', changefreq: 'weekly' },
      { url: '/team', priority: '0.7', changefreq: 'monthly' },
      { url: '/start', priority: '0.9', changefreq: 'weekly' }
    ];
    
    routesWithMetadata.push(...mainRoutes);

    // 2. Add location pages with metadata
    const locationFiles = fs.readdirSync(LOCATIONS_DIR)
      .filter(file => file.endsWith('.json') && !file.includes('copy') && !file.includes('lifecycle') && !file.includes('cors') && !file.includes('hugo'));

    locationFiles.forEach(file => {
      const citySlug = file.replace('.json', '');
      const locationRoute = `/location/${citySlug}`;
      
      // Get file stats to use last modified date
      const fileStat = fs.statSync(path.join(LOCATIONS_DIR, file));
      const lastModifiedDate = new Date(fileStat.mtime).toISOString().split('T')[0];
      
      routesWithMetadata.push({
        url: locationRoute,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: lastModifiedDate
      });

      // 3. Add all appraiser pages from this location
      try {
        const locationData = JSON.parse(fs.readFileSync(path.join(LOCATIONS_DIR, file)));
        locationData.appraisers?.forEach(appraiser => {
          if (appraiser.id) {
            routesWithMetadata.push({
              url: `/appraiser/${appraiser.id}`,
              priority: '0.7',
              changefreq: 'weekly',
              lastmod: lastModifiedDate
            });
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
      
      // Get file stats for last modified date
      const fileStat = fs.statSync(htmlPath);
      const lastModifiedDate = new Date(fileStat.mtime).toISOString().split('T')[0];
      
      // Add if not already included
      if (!routesWithMetadata.some(r => r.url === route)) {
        routesWithMetadata.push({
          url: route,
          priority: '0.5',
          changefreq: 'monthly',
          lastmod: lastModifiedDate
        });
      }
    });

    // Remove duplicates, sort by priority (descending), and format the routes
    const uniqueRoutes = [...new Set(routesWithMetadata.map(r => r.url))].map(url => {
      const routeData = routesWithMetadata.find(r => r.url === url);
      return {
        url,
        priority: routeData.priority,
        changefreq: routeData.changefreq,
        lastmod: routeData.lastmod || new Date().toISOString().split('T')[0]
      };
    }).sort((a, b) => b.priority - a.priority);

    // Generate the sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    uniqueRoutes.forEach(route => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${BASE_URL}${route.url}</loc>\n`;
      sitemap += `    <lastmod>${route.lastmod}</lastmod>\n`;
      sitemap += `    <changefreq>${route.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${route.priority}</priority>\n`;
      sitemap += '  </url>\n';
    });
    
    sitemap += '</urlset>';
    
    // Write sitemap to file
    fs.writeFileSync(SITEMAP_PATH, sitemap);
    
    console.log(`✅ Sitemap generated with ${uniqueRoutes.length} URLs at: ${SITEMAP_PATH}`);
    
    // Create a robots.txt file with sitemap reference
    const robotsTxtPath = path.join(DIST_DIR, 'robots.txt');
    const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml

# Block access to admin and system files
User-agent: *
Disallow: /admin/
Disallow: /*.json$
Disallow: /*.js$
Disallow: /*.css$
`;
    
    fs.writeFileSync(robotsTxtPath, robotsTxt);
    console.log(`✅ robots.txt created at: ${robotsTxtPath}`);
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }
}

generateSitemap(); 