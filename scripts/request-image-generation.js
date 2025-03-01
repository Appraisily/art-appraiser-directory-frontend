import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCATIONS_DIR = path.join(__dirname, '../src/data/locations');

// Replace with your actual image generation API endpoint
const IMAGE_GENERATION_API = 'http://your-image-generation-api/generate-image';

// Function to generate a standardized image filename for the image generator
function generateImageFilename(appraiser, citySlug) {
  // Create a base filename using the appraiser ID
  const baseFilename = `appraiser_${appraiser.id}`;
  
  // Add timestamp and random ID to match the pattern
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  
  // Final filename in the format: appraiser_[id]_[timestamp]_V[randomId].jpg
  return `${baseFilename}_${timestamp}_V${randomId}.jpg`;
}

// Function to request image generation with a specific filename
async function requestImageGeneration(prompt, style, filename) {
  try {
    console.log(`Requesting image generation for: ${filename}`);
    console.log(`Prompt: ${prompt}`);
    console.log(`Style: ${style}`);
    
    // In a real implementation, you would make an actual API call:
    /*
    const response = await fetch(IMAGE_GENERATION_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style,
        filename
      }),
    });
    
    const data = await response.json();
    return data;
    */
    
    // For demonstration, we'll just return a mock response
    return {
      success: true,
      imageUrl: `https://ik.imagekit.io/appraisily/appraiser-images/${filename}`,
      filename: filename
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return { success: false, error: error.message };
  }
}

// Example usage
async function main() {
  console.log("Image Generation Request Example");
  console.log("===============================");
  console.log("This script demonstrates how to request image generation with a specific filename.");
  console.log("");
  
  // Read a sample location file
  const locationFiles = fs.readdirSync(LOCATIONS_DIR)
    .filter(file => file.endsWith('.json') && !file.includes('copy'));
  
  if (locationFiles.length > 0) {
    const sampleFile = locationFiles[0];
    const citySlug = sampleFile.replace('.json', '');
    const locationData = JSON.parse(fs.readFileSync(path.join(LOCATIONS_DIR, sampleFile)));
    
    if (locationData.appraisers && locationData.appraisers.length > 0) {
      const sampleAppraiser = locationData.appraisers[0];
      
      console.log(`Sample appraiser: ${sampleAppraiser.name} (ID: ${sampleAppraiser.id})`);
      console.log(`City: ${citySlug}`);
      console.log("");
      
      // Generate a filename for this appraiser
      const filename = generateImageFilename(sampleAppraiser, citySlug);
      
      // Create a prompt based on the appraiser's specialties
      const specialties = Array.isArray(sampleAppraiser.specialties) 
        ? sampleAppraiser.specialties.join(', ') 
        : sampleAppraiser.specialties || 'fine art';
      
      const prompt = `Professional art appraiser specializing in ${specialties}`;
      const style = 'realistic';
      
      // Request image generation
      const result = await requestImageGeneration(prompt, style, filename);
      
      console.log("");
      console.log("Image Generation Result:");
      console.log(result);
      
      console.log("");
      console.log("Integration Steps:");
      console.log("1. Modify your image-generation submodule to accept the 'filename' parameter");
      console.log("2. Update your image generation requests to include the desired filename");
      console.log("3. Use the returned imageUrl in your appraiser data");
    }
  }
}

main().catch(console.error); 