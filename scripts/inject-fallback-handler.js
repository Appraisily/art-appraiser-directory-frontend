#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Fix glob import with a dynamic import
const glob = await import('glob').then(module => module.default || module);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Fallback image handler script
const fallbackScript = `
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('error', function() {
        console.log('Replacing broken image with placeholder:', this.alt);
        this.onerror = null;
        this.src = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
      });
    });
  });
</script>`;

/**
 * Injects fallback image handler to all HTML files
 */
function injectFallbackHandlerToAllHtml() {
  console.log('Injecting fallback image handler to HTML files...');
  
  // Get all HTML files in the dist directory
  const htmlFiles = glob.sync(path.join(distDir, '**/*.html'));
  console.log(`Found ${htmlFiles.length} HTML files.`);
  
  let count = 0;
  
  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Only inject if it doesn't already have the fallback handler
    if (!content.includes('DOMContentLoaded') && !content.includes('img.addEventListener(\'error\'')) {
      // Insert before closing body tag
      content = content.replace('</body>', `${fallbackScript}\n</body>`);
      
      // Write back to the file
      fs.writeFileSync(htmlFile, content);
      count++;
    }
  }
  
  console.log(`Injected fallback image handler to ${count}/${htmlFiles.length} HTML files.`);
}

// Validate that the dist directory exists
if (!fs.existsSync(distDir)) {
  console.error(`Error: Directory ${distDir} does not exist. Run build first.`);
  process.exit(1);
}

// Run the injection process
injectFallbackHandlerToAllHtml(); 