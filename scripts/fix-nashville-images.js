import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');
const TARGET_LOCATION = 'nashville';

// Known working placeholder images from ImageKit
const WORKING_PLACEHOLDER_IMAGES = [
  'https://ik.imagekit.io/appraisily/placeholder-art-image.jpg',
  'https://ik.imagekit.io/appraisily/placeholders/painting-appraiser.jpg',
  'https://ik.imagekit.io/appraisily/placeholders/sculpture-appraiser.jpg',
  'https://ik.imagekit.io/appraisily/placeholders/photography-appraiser.jpg',
  'https://ik.imagekit.io/appraisily/placeholders/antiques-appraiser.jpg',
  'https://ik.imagekit.io/appraisily/placeholders/jewelry-appraiser.jpg',
  'https://ik.imagekit.io/appraisily/placeholders/general-appraiser.jpg'
];

// Function to get a placeholder image based on specialties
function getPlaceholderBySpecialty(specialties = []) {
  if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
    return WORKING_PLACEHOLDER_IMAGES[6]; // Default to general appraiser
  }
  
  const specialtiesLower = specialties.map(s => s.toLowerCase());
  
  if (specialtiesLower.some(s => s.includes('painting') || s.includes('art') || s.includes('fine art'))) {
    return WORKING_PLACEHOLDER_IMAGES[1]; // Painting appraiser
  }
  
  if (specialtiesLower.some(s => s.includes('sculpture') || s.includes('3d'))) {
    return WORKING_PLACEHOLDER_IMAGES[2]; // Sculpture appraiser
  }
  
  if (specialtiesLower.some(s => s.includes('photo') || s.includes('camera'))) {
    return WORKING_PLACEHOLDER_IMAGES[3]; // Photography appraiser
  }
  
  if (specialtiesLower.some(s => s.includes('antique') || s.includes('furniture') || s.includes('decorative'))) {
    return WORKING_PLACEHOLDER_IMAGES[4]; // Antiques appraiser
  }
  
  if (specialtiesLower.some(s => s.includes('jewelry') || s.includes('gem') || s.includes('gold'))) {
    return WORKING_PLACEHOLDER_IMAGES[5]; // Jewelry appraiser
  }
  
  return WORKING_PLACEHOLDER_IMAGES[6]; // Default to general appraiser
}

// Function to update the Nashville location file
async function fixNashvilleImages() {
  try {
    console.log('Starting to fix Nashville appraiser images...');
    
    const locationFile = `${TARGET_LOCATION}.json`;
    const locationPath = path.join(LOCATIONS_DIR, locationFile);
    
    // Check if the location file exists
    if (!await fs.pathExists(locationPath)) {
      console.error(`Location file ${locationFile} not found!`);
      return;
    }
    
    // Read the location data
    const locationData = await fs.readJson(locationPath);
    
    if (!locationData.appraisers || !Array.isArray(locationData.appraisers)) {
      console.error(`No appraisers found in ${locationFile}`);
      return;
    }
    
    console.log(`Found ${locationData.appraisers.length} appraisers in Nashville to process.`);
    
    let updatedCount = 0;
    
    // Update each appraiser's image
    for (const appraiser of locationData.appraisers) {
      // Store the old image URL if it exists and we haven't stored it already
      if (appraiser.imageUrl && !appraiser.oldImageUrl) {
        appraiser.oldImageUrl = appraiser.imageUrl;
      }
      
      // Get a placeholder image based on the appraiser's specialties
      const placeholderImage = getPlaceholderBySpecialty(appraiser.specialties);
      
      // Update the image URL
      appraiser.imageUrl = placeholderImage;
      
      console.log(`Updated image for ${appraiser.name} to ${placeholderImage}`);
      updatedCount++;
    }
    
    // Save the updated location data
    await fs.writeJson(locationPath, locationData, { spaces: 2 });
    
    console.log(`\nSuccessfully updated ${updatedCount} appraiser images in Nashville.`);
    console.log('\nNext steps:');
    console.log('1. Run `npm run build` to rebuild the static files with the updated image URLs');
    console.log('2. Commit and push the changes');
    console.log('3. Rebuild and deploy the site');
    
  } catch (error) {
    console.error('Error fixing Nashville images:', error.message);
  }
}

// Run the main function
fixNashvilleImages().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 