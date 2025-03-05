# Art Appraiser Directory Frontend Guide

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Standard build with TypeScript check
- `npm run build:simple` - Simplified build
- `npm run lint` - Run ESLint checks
- `npm run build:with-image-validation` - Build with image validation
- `npm run test:html` - Test HTML output
- `npm run serve:static` - Serve built static files

## Code Style Guidelines
- **TypeScript**: Strict type checking is enabled
- **Component Structure**: React functional components with TypeScript
- **Styling**: Tailwind CSS with utility-first approach
- **Naming**: PascalCase for components, camelCase for variables
- **Imports**: Group React imports first, then external libs, then local
- **Error Handling**: Proper handling with fallback UI components
- **Images**: Always include alt tags and use FallbackImage component
- **SEO**: Use proper semantic HTML and SEO component

## Project Structure
- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts
- `/data` - JSON data files for appraisers and locations
- `/public` - Static assets