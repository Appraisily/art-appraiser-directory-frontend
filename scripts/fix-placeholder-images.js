import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');
// Use a reliable public placeholder image
const DEFAULT_PLACEHOLDER_URL = 'https://placehold.co/300x300/e0e0e0/333333?text=Image+Unavailable';

// Check if an image URL is using via.placeholder.com or has HTTP 400/404 errors
function isInvalidPlaceholder(url) {
  return url && (
    url.includes('via.placeholder.com') || 
    url.includes('placeholder.com') ||
    url.includes('ik.imagekit.io/appraisily/placeholder-art-image.jpg')
  );
}

// Process all locations and fix appraiser images
async function fixPlaceholderImages() {
  console.log('🔍 Starting placeholder image fix...');
  let totalAppraisers = 0;
  let totalImages = 0;
  let totalFixed = 0;
  
  // Read all location files
  const locationFiles = fs.readdirSync(LOCATIONS_DIR)
    .filter(file => file.endsWith('.json'));
  
  for (const file of locationFiles) {
    const locationPath = path.join(LOCATIONS_DIR, file);
    const locationData = await fs.readJson(locationPath);
    const cityName = file.replace('.json', '');
    let updated = false;
    
    console.log(`\n📍 Processing ${cityName}...`);
    
    if (!locationData.appraisers || locationData.appraisers.length === 0) {
      console.log(`ℹ️ No appraisers found in ${file}`);
      continue;
    }
    
    totalAppraisers += locationData.appraisers.length;
    
    // Check each appraiser
    for (const appraiser of locationData.appraisers) {
      if (!appraiser.name) continue;
      
      totalImages++;
      
      const imageUrl = appraiser.imageUrl || appraiser.image;
      
      // Check if the current image URL is invalid
      if (isInvalidPlaceholder(imageUrl)) {
        // Use the default placeholder
        appraiser.imageUrl = DEFAULT_PLACEHOLDER_URL;
        appraiser.image = DEFAULT_PLACEHOLDER_URL;
        
        console.log(`✅ Fixed placeholder for: ${appraiser.name} (${cityName})`);
        totalFixed++;
        updated = true;
      }
    }
    
    // Save changes if any
    if (updated) {
      await fs.writeJson(locationPath, locationData, { spaces: 2 });
      console.log(`💾 Saved updates for ${cityName}`);
    }
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`📋 Total appraisers: ${totalAppraisers}`);
  console.log(`🖼️ Total images checked: ${totalImages}`);
  console.log(`✨ Total placeholders fixed: ${totalFixed}`);
  console.log(`✅ Process completed successfully!`);
}

// Run the script
fixPlaceholderImages(); 