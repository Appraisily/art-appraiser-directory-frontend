# Art Appraiser Directory Frontend Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Standard build with TypeScript check
- `npm run build:simple` - Standard build (same as build)
- `npm run build:netlify-ready` - Build and prepare for Netlify deployment
- `npm run lint` - Run ESLint checks
- `npm run test:html` - Test HTML output
- `npm run serve:static` - Serve built static files locally
- `npm run fetch:imagekit` - Fetch images from ImageKit
- `npm run check:imagekit` - Check ImageKit connection
- `npm run randomize:images` - Randomize ImageKit images
- `npm run build:static` - Build static site with TypeScript
- `npm run fix:all-pages` - Fix all pages
- `npm run prepare:netlify` - Prepare for Netlify deployment
- `npm run clean` - Clean dist directory

## Code Style Guidelines
- **TypeScript**: Strict mode with no unused locals/parameters (ES2020 target)
- **Components**: React functional components with explicit return types
- **Styling**: Tailwind CSS with utility-first approach
- **Naming**: PascalCase for components/types, camelCase for variables/functions
- **Imports**: Group React imports first, then external libs, then local
- **Error Handling**: Use FallbackImage component for images, fallback UI for errors
- **Images**: Always include alt tags and handle loading failures
- **Format**: No trailing whitespace, consistent indentation (2 spaces)
- **ESLint**: Recommended rules for JS/TS with React hooks plugins

## Project Structure
- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts
- `/data` - JSON data files for appraisers and locations
- `/dist` - Generated static output files