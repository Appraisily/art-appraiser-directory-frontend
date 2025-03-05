import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const IMAGE_GENERATION_API = 'https://image-generation-service-856401495068.us-central1.run.app/api/generate';
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');
const IMAGEKIT_BASE_URL = 'https://ik.imagekit.io/appraisily/appraiser-images/';
const TARGET_LOCATION = 'nashville';

// Helper function to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to generate an image for an appraiser
async function generateImage(appraiser, locationName) {
  try {
    // Extract appraiser details
    const { id, name, specialties = [], city, state } = appraiser;
    
    // Create a timestamp
    const timestamp = Date.now();
    
    // Create a unique filename
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const customFilename = `appraiser_${id}_${timestamp}_V${uniqueSuffix}.jpg`;
    
    // Create a prompt for the image generation
    const specialtiesText = specialties.join(', ');
    const prompt = `Professional headshot of an art appraiser named ${name} who specializes in ${specialtiesText || 'art appraisal'}. Business professional attire, neutral background, high quality portrait.`;
    
    console.log(`Generating image for ${name} (${id}) in ${locationName}...`);
    console.log(`Prompt: ${prompt}`);
    
    // Call the image generation API
    const response = await fetch(IMAGE_GENERATION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        filename: customFilename,
        appraiser_id: id,
        location: locationName
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Image generated successfully: ${data.imageUrl || 'URL not returned'}`);
    
    // Return the new image URL
    return {
      success: true,
      imageUrl: data.imageUrl || `${IMAGEKIT_BASE_URL}${customFilename}`,
      appraiser
    };
  } catch (error) {
    console.error(`Error generating image for ${appraiser.name} (${appraiser.id}):`, error.message);
    return {
      success: false,
      error: error.message,
      appraiser
    };
  }
}

// Function to update the image URL in the location file
async function updateImageUrl(locationFile, appraiserId, newImageUrl) {
  try {
    const locationPath = path.join(LOCATIONS_DIR, locationFile);
    const locationData = await fs.readJson(locationPath);
    
    // Find the appraiser and update the imageUrl
    let updated = false;
    for (const appraiser of locationData.appraisers) {
      if (appraiser.id === appraiserId) {
        // Store the old image URL if it exists
        if (appraiser.imageUrl) {
          appraiser.oldImageUrl = appraiser.imageUrl;
        }
        appraiser.imageUrl = newImageUrl;
        updated = true;
        break;
      }
    }
    
    if (updated) {
      // Write the updated data back to the file
      await fs.writeJson(locationPath, locationData, { spaces: 2 });
      console.log(`Updated image URL for ${appraiserId} in ${locationFile}`);
      return true;
    } else {
      console.warn(`Appraiser ${appraiserId} not found in ${locationFile}`);
      return false;
    }
  } catch (error) {
    console.error(`Error updating image URL in ${locationFile}:`, error.message);
    return false;
  }
}

// Main function to process Nashville location
async function processNashvilleLocation() {
  try {
    console.log('Starting image regeneration process for Nashville...');
    
    const locationFile = `${TARGET_LOCATION}.json`;
    const locationPath = path.join(LOCATIONS_DIR, locationFile);
    
    // Check if the location file exists
    if (!await fs.pathExists(locationPath)) {
      console.error(`Location file ${locationFile} not found!`);
      return;
    }
    
    const locationData = await fs.readJson(locationPath);
    
    if (!locationData.appraisers || !Array.isArray(locationData.appraisers)) {
      console.error(`No appraisers found in ${locationFile}`);
      return;
    }
    
    console.log(`Found ${locationData.appraisers.length} appraisers in Nashville to process.`);
    
    let totalGenerated = 0;
    let totalErrors = 0;
    let totalUpdated = 0;
    
    // Process each appraiser in Nashville
    for (const appraiser of locationData.appraisers) {
      // Add a delay to avoid overwhelming the API
      await sleep(1000);
      
      // Generate the image
      const result = await generateImage(appraiser, TARGET_LOCATION);
      
      if (result.success) {
        totalGenerated++;
        
        // Update the image URL in the location file
        const updated = await updateImageUrl(locationFile, appraiser.id, result.imageUrl);
        if (updated) {
          totalUpdated++;
        }
      } else {
        totalErrors++;
      }
    }
    
    console.log('\nNashville image regeneration process complete:');
    console.log(`- Total appraisers processed: ${locationData.appraisers.length}`);
    console.log(`- Total images generated: ${totalGenerated}`);
    console.log(`- Total errors: ${totalErrors}`);
    console.log(`- Total location files updated: ${totalUpdated}`);
    
    console.log('\nNext steps:');
    console.log('1. Run `npm run rebuild-static` to rebuild the static files with the updated image URLs');
    console.log('2. Commit and push the changes');
    console.log('3. Rebuild and deploy the site');
    
  } catch (error) {
    console.error('Error in processNashvilleLocation:', error.message);
  }
}

// Run the main function
processNashvilleLocation().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 