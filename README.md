# Art Appraiser Directory Frontend

This is the frontend codebase for the Art Appraiser Directory.

## Project Structure

- `/src` - Source code for the React application
- `/data` - Data files for locations and appraisers
- `/scripts` - Build and deployment scripts
- `/dist` - Built application (generated during build)

## Documentation

- [Main README](README.md) - General project information and setup
- [Image Generation](IMAGE_GENERATION.md) - Detailed documentation on the automatic image generation feature

## Development

To run the application locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Build Process

The build process consists of:

1. Compiling TypeScript and bundling with Vite
2. Generating missing appraiser images automatically
3. Generating static HTML pages for locations and appraisers
4. Creating a 404.html page for client-side routing
5. Generating a sitemap.xml file

To build the application:

```bash
npm run build
```

## Automatic Image Generation

The application includes an automatic image generation feature that:

1. Identifies appraisers without proper images
2. Generates custom professional images for them using AI
3. Updates the appraiser data with the new image URLs

### How It Works

During the build process, the system automatically:
- Scans all location files for appraisers with missing or improperly formatted images
- Generates standardized filenames in the format: `appraiser_{id}_{timestamp}_V{randomId}.jpg`
- Calls the image generation service API to create professional appraiser images
- Updates the appraiser data with the new image URLs

For more detailed information, see the [Image Generation documentation](IMAGE_GENERATION.md).

### Configuration

The image generation service URL can be configured by setting the environment variable:

```bash
# Windows
$env:IMAGE_GENERATION_API="http://your-image-service-url/api/generate"

# Linux/Mac
export IMAGE_GENERATION_API="http://your-image-service-url/api/generate"
```

By default, it uses `http://localhost:3000/api/generate`.

### Manual Usage

If you want to manually fix missing images without doing a full build:

```bash
npm run fix-images
npm run rebuild-static
```

## Deployment

This project uses a pre-build approach where:

1. The application is built locally
2. The generated `dist` folder is pushed to a separate GitHub repository
3. Netlify then serves these pre-built files directly

### Important Note About the Dist Repository

The distribution repository (where built files are pushed) has a different `.gitignore` than the development repository. In particular:

- **Development repository**: Excludes the `/dist` folder (since we don't commit built files here)
- **Distribution repository**: Does NOT exclude the `/dist` folder (since that's what we want to deploy)

Our deployment script automatically handles this by setting up the correct `.gitignore` in the distribution repository.

### Deployment Steps

To deploy the application:

```bash
npm run deploy
```

This script will:
- Build the application
- Generate the sitemap
- Push the built files to the specified GitHub repository
- Netlify will automatically deploy from that repository

### Configuration

Before running the deploy script, make sure to update these values in `scripts/build-and-push.js`:

```javascript
const GITHUB_REPO = 'https://github.com/yourusername/art-appraiser-dist.git'; // Replace with your repo
const BRANCH_NAME = 'main';
const BASE_URL = 'https://art-appraiser.yourdomain.com'; // Replace with your domain
```

### Initial Setup on Netlify

1. Create a new site on Netlify
2. Connect it to the GitHub repository containing the pre-built files
3. Netlify will use the included `netlify.toml` configuration

## Sitemap Integration

The sitemap.xml generated during build can be integrated with a global sitemap by:

1. Referencing the deployed sitemap in your global sitemap index file:

```xml
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://your-main-site.com/sitemap.xml</loc>
  </sitemap>
  <sitemap>
    <loc>https://art-appraiser.yourdomain.com/sitemap.xml</loc>
  </sitemap>
</sitemapindex>
```

## License

[Your License Information]