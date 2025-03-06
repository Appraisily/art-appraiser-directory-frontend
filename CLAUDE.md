# Art Appraiser Directory Frontend Guide

## Deployment Workflow
This project is designed to be built locally and then deployed to Netlify as pre-built files. This approach resolves data inconsistencies and image loading issues before deployment.

1. Build locally using one of these commands:
   - `npm run build:local` - Basic local build
   - `npm run build:local:with-images` - Build with image generation
   - `npm run build:local:optimized` - Build with React hydration fixes
   - `npm run build:production` - Production build with fixes

2. Test the build locally:
   - `npm run serve:static` - View the built site locally
   - `npm run test:html` - Test HTML output

3. Deploy to Netlify:
   - The netlify.toml is configured to use pre-built files
   - Deploy the dist directory to Netlify
   - No build will happen on Netlify - it will use the pre-built files

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Standard build with TypeScript check
- `npm run build:simple` - Simplified build without checks
- `npm run lint` - Run ESLint checks
- `npm run build:with-image-validation` - Build with image validation
- `npm run test:html` - Test HTML output
- `npm run serve:static` - Serve built static files
- `npm run check:images` - Validate image files
- `npm run generate:sitemap` - Generate site map for SEO

## Code Style Guidelines
- **TypeScript**: Strict type checking enabled, prefer explicit types over any
- **Component Structure**: React functional components with TypeScript interfaces
- **Styling**: Tailwind CSS with utility-first approach, avoid inline styles
- **Naming**: PascalCase for components, camelCase for variables and functions
- **Imports**: Group React imports first, then external libs, then local imports
- **Error Handling**: Use try/catch with fallback UI components for graceful degradation
- **Images**: Always include descriptive alt tags and use FallbackImage component
- **SEO**: Use semantic HTML elements and the SEO component for proper metadata

## Project Structure
- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts for automation
- `/data` - JSON data files for appraisers and locations
- `/images` - Image assets for appraiser profiles and locations