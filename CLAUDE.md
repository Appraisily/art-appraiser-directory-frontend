# Art Appraiser Directory Frontend Guide

## Subdomain vs. Main Domain URLs
- When building for the subdomain (art-appraisers-directory.appraisily.com), URLs for appraiser pages should use the full subdomain URL
- The source code in LocationPage.tsx and StandardizedLocationPage.tsx has been updated to point to the subdomain
- Run `npm run fix:js-urls` to update any JS files that may contain main domain URLs

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Standard build with TypeScript check
- `npm run build:simple` - Legacy build
- `npm run build:standardized` - Build with standardized data
- `npm run build:netlify-ready` - Build and prepare for Netlify deployment
- `npm run lint` - Run ESLint checks
- `npm run test:html` - Test HTML output
- `npm run serve:static` - Serve built static files locally
- `npm run standardize:data` - Standardize all appraiser data
- `npm run standardize:one` - Standardize single appraiser entry
- `npm run count:appraisers` - Count appraisers in dataset
- `npm run fix:domain-links` - Fix domain links in HTML
- `npm run fix:html-paths` - Fix HTML file paths
- `npm run fix:hydration` - Fix React hydration issues
- `npm run fix:preload` - Fix preloaded asset references
- `npm run fix:links` - Fix location links to be relative
- `npm run fix:all-assets` - Fix all asset and hydration issues
- `npm run fix:all-pages` - Fix issues on all pages
- `npm run inject:gtm` - Ensure Google Tag Manager is on all HTML pages
- `npm run clean` - Clean dist directory

## Google Tag Manager
- Google Tag Manager ID: `GTM-PSLHDGM`
- GTM code is automatically added to all HTML files during the build process
- The script `scripts/inject-gtm-code.js` ensures all pages have GTM code
- GTM is added in two parts:
  1. Head code (before any other scripts in the `<head>` section)
  2. Body code (immediately after the opening `<body>` tag)
- To manually inject GTM on existing HTML files, run `npm run inject:gtm`

## Code Style Guidelines
- **TypeScript**: Strict mode with no unused locals/parameters (ES2020 target)
- **Components**: React functional components with explicit return types
- **Styling**: Tailwind CSS with utility-first approach
- **Naming**: PascalCase for components/types, camelCase for variables/functions
- **Imports**: Group React imports first, then external libs, then local modules
- **Error Handling**: Use FallbackImage component for images, fallback UI for errors
- **Images**: Always include alt tags and handle loading failures
- **Format**: No trailing whitespace, consistent indentation (2 spaces)
- **ESLint**: Recommended rules for JS/TS with React hooks plugins

## Project Structure
- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts
- `/data` - JSON data files for appraisers and locations
- `/dist` - Generated static output files