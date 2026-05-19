# Art Appraiser Directory Frontend Guide

## Subdomain vs. Main Domain URLs
- When building for the subdomain (art-appraisers-directory.appraisily.com), URLs for appraiser pages should use the full subdomain URL
- The source code in LocationPage.tsx and StandardizedLocationPage.tsx has been updated to point to the subdomain
- Do not use rewrite scripts for generated JS or profile/location HTML. Fix the affected static file directly.

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Prepare the canonical static site in `public_site/`
- `npm run check:static` - Validate `public_site/`
- `npm run publish:patch` - Patch homepage/assets/shared envelope blocks over the active release
- `npm run serve:static` - Serve `public_site/` locally
- `npm run lint` - Run ESLint checks
- `npm run test:html` - Test HTML output
- `npm run count:appraisers` - Count appraisers in dataset

## Google Tag Manager
- Google Tag Manager ID: `GTM-PSLHDGM`
- GTM should already exist in the static HTML artifact. If a page is missing it, edit that page directly.
- GTM is added in two parts:
  1. Head code (before any other scripts in the `<head>` section)
  2. Body code (immediately after the opening `<body>` tag)

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
- `/public_site` - Canonical static HTML served in production

## Workflow Rule
- Edit `public_site/` directly for normal page changes.
- Do not reintroduce frontend rebuild steps into the normal publishing flow.
