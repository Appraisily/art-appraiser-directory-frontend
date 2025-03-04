import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '../dist');

/**
 * Injects a fallback image handler script into all HTML files in the dist directory
 */
async function injectFallbackImageHandler() {
  console.log('🔧 Injecting fallback image handler into HTML files...');
  
  // Script to inject before </body> tag
  const fallbackScript = `
  <script>
    // Fallback image handler
    (function() {
      // Default fallback image URL
      const DEFAULT_FALLBACK = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';
      
      // Function to handle image errors
      function setupImageErrorHandling() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          // Skip if already handled
          if (img.hasAttribute('data-fallback-applied')) return;
          
          // Mark as handled
          img.setAttribute('data-fallback-applied', 'true');
          
          // Set up error handler
          img.onerror = function() {
            console.log('Image load error, applying fallback:', this.src);
            this.onerror = null; // Prevent infinite loops
            this.src = DEFAULT_FALLBACK;
            this.classList.add('fallback-image');
          };
          
          // Force check for already broken images
          if (img.complete) {
            if (!img.naturalWidth) {
              img.onerror();
            }
          }
        });
      }
      
      // Set up mutation observer to handle dynamically added images
      function setupMutationObserver() {
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
              setupImageErrorHandling();
            }
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
      
      // Initial setup
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          setupImageErrorHandling();
          setupMutationObserver();
        });
      } else {
        setupImageErrorHandling();
        setupMutationObserver();
      }
    })();
  </script>
  `;
  
  try {
    // Find all HTML files
    const htmlFiles = await glob('**/*.html', { cwd: DIST_DIR });
    let updatedCount = 0;
    
    for (const htmlFile of htmlFiles) {
      const filePath = path.join(DIST_DIR, htmlFile);
      let html = await fs.readFile(filePath, 'utf8');
      
      // Only inject if not already present
      if (!html.includes('data-fallback-applied')) {
        // Insert before </body>
        html = html.replace('</body>', `${fallbackScript}</body>`);
        await fs.writeFile(filePath, html, 'utf8');
        updatedCount++;
      }
    }
    
    console.log(`✅ Injected fallback image handler into ${updatedCount} HTML files`);
  } catch (error) {
    console.error('❌ Error injecting fallback image handler:', error);
  }
}

// Run the script
injectFallbackImageHandler(); 