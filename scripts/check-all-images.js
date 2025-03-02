import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Function to check if an image URL exists
async function checkImage(url) {
  try {
    console.log('Checking image URL:', url);
    const response = await fetch(url, { method: 'HEAD' });
    console.log('Response status:', response.status);
    return response.ok;
  } catch (error) {
    console.error('Error checking image:', error.message);
    return false;
  }
}

// Main function to process all location files
async function processLocationFiles() {
  console.log('Starting to process location files for missing images...');
  
  // Read all location JSON files
  const locationFiles = fs.readdirSync(LOCATIONS_DIR)
    .filter(file => file.endsWith('.json') && !file.includes('copy'));

  console.log(`Found ${locationFiles.length} location files to process`);

  let totalAppraisers = 0;
  let checkedImages = 0;
  let missingImages = 0;
  let missingImagesList = [];

  // Process each location file
  for (const file of locationFiles) {
    const locationFilePath = path.join(LOCATIONS_DIR, file);
    const locationData = JSON.parse(fs.readFileSync(locationFilePath, 'utf8'));
    const cityName = locationData.city || '';
    const stateName = locationData.state || '';
    
    // Skip if no appraisers
    if (!locationData.appraisers || !Array.isArray(locationData.appraisers)) {
      console.log(`No appraisers found in ${file}`);
      continue;
    }

    console.log(`Processing ${file} with ${locationData.appraisers.length} appraisers`);

    // Process each appraiser
    for (const appraiser of locationData.appraisers) {
      totalAppraisers++;
      
      // Check if appraiser has an imageUrl
      if (appraiser.imageUrl) {
        checkedImages++;
        
        // Check if the image actually exists
        const imageExists = await checkImage(appraiser.imageUrl);
        
        if (!imageExists) {
          console.log(`Missing image for ${appraiser.name} in ${cityName}, ${stateName}`);
          missingImages++;
          missingImagesList.push({
            id: appraiser.id,
            name: appraiser.name,
            city: cityName,
            state: stateName,
            imageUrl: appraiser.imageUrl
          });
        }
      } else {
        console.log(`No image URL for ${appraiser.name}`);
      }
    }
  }

  console.log(`
Processing complete:
- Total appraisers processed: ${totalAppraisers}
- Total images checked: ${checkedImages}
- Total missing images found: ${missingImages}
`);

  if (missingImages > 0) {
    console.log('Missing images:');
    missingImagesList.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.city}, ${item.state}): ${item.imageUrl}`);
    });
  }

  console.log(`
Next steps:
1. Run the image generation service to create the missing images
2. Update the image URLs in the location files
3. Rebuild the static files
4. Commit and push the changes
`);
}

// Run the process
processLocationFiles().catch(error => {
  console.error('Error processing location files:', error);
}); 