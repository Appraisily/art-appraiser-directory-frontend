/**
 * Script to inject Google Tag Manager code into all HTML files in the dist directory
 * This ensures that GTM tracking is present on all pages of the site
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { injectGTMToDirectory } from './utils/inject-gtm.js';

// Get the current script's directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the dist directory path
const DIST_DIR = path.resolve(__dirname, '../dist');

async function main() {
  console.log('Starting Google Tag Manager code injection');
  
  try {
    // Inject GTM code to all HTML files in the dist directory
    const result = await injectGTMToDirectory(DIST_DIR);
    
    console.log('Google Tag Manager code injection completed successfully');
    console.log(`Total files processed: ${result.total}`);
    console.log(`Files modified: ${result.modified}`);
    
    if (result.modified === 0) {
      console.log('All HTML files already have Google Tag Manager code');
    }
  } catch (error) {
    console.error('Error in Google Tag Manager code injection:', error);
    process.exit(1);
  }
}

// Run the main function
main();