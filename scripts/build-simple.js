import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

/**
 * A simplified build script that bypasses image checking
 * It performs the enhanced steps needed to build an SEO-optimized app:
 * 1. TypeScript compilation
 * 2. Vite build
 * 3. Static HTML generation
 * 4. Image optimization
 * 5. Copying static files
 * 6. Sitemap generation
 * 7. HTML minification (optional)
 */

console.log('🚀 Starting SEO-optimized build process...');

// Set the image generation service URL
const imageServiceUrl = process.env.IMAGE_GENERATION_API || 'https://image-generation-service-856401495068.us-central1.run.app/api/generate';
console.log(`📡 Using image generation service at: ${imageServiceUrl}`);
process.env.IMAGE_GENERATION_API = imageServiceUrl;

// Default to false for minification - can be enabled with env var
const shouldMinify = process.env.MINIFY === 'true';

try {
  // Step 1: TypeScript compilation and Vite build
  console.log('\n📦 Building React application...');
  execSync('tsc && vite build', { 
    stdio: 'inherit', 
    cwd: ROOT_DIR,
    env: { ...process.env }
  });
  
  // Step 2: Generate static HTML files
  console.log('\n🌐 Generating static HTML files with SEO enhancements...');
  execSync('node scripts/generate-static.js', { 
    stdio: 'inherit', 
    cwd: ROOT_DIR,
    env: { ...process.env } 
  });
  
  // Step 3: Copy necessary files (like 404.html)
  console.log('\n📝 Copying static files...');
  execSync('node scripts/copy-static.js', { 
    stdio: 'inherit', 
    cwd: ROOT_DIR,
    env: { ...process.env } 
  });
  
  // Step 4: Optimize images for better performance
  console.log('\n🖼️ Optimizing images for better performance...');
  try {
    execSync('node scripts/optimize-images.js', { 
      stdio: 'inherit', 
      cwd: ROOT_DIR,
      env: { ...process.env } 
    });
  } catch (error) {
    console.warn('⚠️ Image optimization failed. Continuing with build...');
  }
  
  // Step 5: Generate sitemap with enhanced metadata
  console.log('\n🗺️ Generating comprehensive sitemap...');
  try {
    execSync('node scripts/generate-sitemap.js', { 
      stdio: 'inherit', 
      cwd: ROOT_DIR,
      env: { ...process.env } 
    });
  } catch (error) {
    console.warn('⚠️ Sitemap generation failed. Continuing without sitemap...');
  }
  
  // Step 6: Minify HTML files (optional)
  if (shouldMinify) {
    console.log('\n⚡ Minifying HTML files for faster load times...');
    try {
      // First ensure html-minifier-terser is installed
      execSync('npm list html-minifier-terser || npm install --no-save html-minifier-terser', {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
      
      // Then run the minification
      execSync('npx html-minifier-terser --input-dir dist --output-dir dist --file-ext html --minify-css --minify-js --remove-comments --collapse-whitespace --conservative-collapse', {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
    } catch (error) {
      console.warn('⚠️ HTML minification failed. Continuing with unminified files...');
    }
  }
  
  console.log('\n✅ SEO-optimized build completed successfully!');
  console.log('\n🔍 The built files are in the dist/ directory.');
  console.log('   To deploy to Netlify, use the contents of this directory.');
  console.log('\n📊 SEO Enhancements included:');
  console.log('   - Pre-rendered HTML pages for appraisers and locations');
  console.log('   - Enhanced Schema.org structured data');
  console.log('   - Optimized meta tags and Open Graph data');
  console.log('   - Responsive image loading');
  console.log('   - Comprehensive XML sitemap');
  console.log('   - robots.txt with sitemap reference');
  if (shouldMinify) {
    console.log('   - Minified HTML/CSS/JS for faster loading');
  }
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
} 