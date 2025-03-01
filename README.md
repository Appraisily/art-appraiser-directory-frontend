# Art Appraiser Directory Frontend

This is the frontend codebase for the Art Appraiser Directory.

## Project Structure

- `/src` - Source code for the React application
- `/data` - Data files for locations and appraisers
- `/scripts` - Build and deployment scripts
- `/dist` - Built application (generated during build)

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
2. Generating static HTML pages for locations and appraisers
3. Creating a 404.html page for client-side routing
4. Generating a sitemap.xml file

To build the application:

```bash
npm run build
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