import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Default placeholder image URL
const DEFAULT_PLACEHOLDER_IMAGE = 'https://ik.imagekit.io/appraisily/placeholder-art-image.jpg';

console.log(`Updating location files in: ${LOCATIONS_DIR}`);

// Read all location JSON files
const locationFiles = fs.readdirSync(LOCATIONS_DIR)
  .filter(file => file.endsWith('.json') && !file.includes('copy') && !file.includes('lifecycle') && !file.includes('cors') && !file.includes('hugo'));

console.log(`Found ${locationFiles.length} location files to process`);

let totalAppraisers = 0;
let fixedImageCount = 0;

// Process each location file
locationFiles.forEach(file => {
  const locationFilePath = path.join(LOCATIONS_DIR, file);
  const cityName = file.replace('.json', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  console.log(`Processing ${cityName} (${file})...`);
  
  // Read the location data
  let locationData = JSON.parse(fs.readFileSync(locationFilePath, 'utf8'));
  
  if (!locationData.appraisers || !Array.isArray(locationData.appraisers)) {
    console.log(`  No appraisers found or invalid format in ${file}`);
    return;
  }
  
  // Track if we need to update this file
  let fileModified = false;
  
  // Update each appraiser to ensure they have a valid image URL
  locationData.appraisers.forEach((appraiser, index) => {
    totalAppraisers++;
    
    // Generate a consistent appraiser ID based on name and city if not present
    if (!appraiser.id) {
      const nameSlug = appraiser.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      appraiser.id = `${cityName.toLowerCase().replace(/\s+/g, '-')}-${nameSlug}`;
      fileModified = true;
    }
    
    // Fix missing image URL
    if (!appraiser.image && !appraiser.imageUrl) {
      // Generate a consistent image URL based on the appraiser's ID
      appraiser.imageUrl = `https://ik.imagekit.io/appraisily/appraiser-images/appraiser_${appraiser.id.replace(/[^a-z0-9]+/g, '_')}_placeholder.jpg`;
      fileModified = true;
      fixedImageCount++;
      console.log(`  Added image URL for ${appraiser.name}`);
    } else if (appraiser.image && !appraiser.imageUrl) {
      // Standardize on imageUrl field
      appraiser.imageUrl = appraiser.image;
      delete appraiser.image;
      fileModified = true;
    }
  });
  
  // Save the updated file if changes were made
  if (fileModified) {
    fs.writeFileSync(locationFilePath, JSON.stringify(locationData, null, 2));
    console.log(`  Updated ${file}`);
  } else {
    console.log(`  No changes needed for ${file}`);
  }
});

console.log(`\nProcessing complete:`);
console.log(`- Total appraisers processed: ${totalAppraisers}`);
console.log(`- Fixed missing image URLs: ${fixedImageCount}`);
console.log('Done!'); 