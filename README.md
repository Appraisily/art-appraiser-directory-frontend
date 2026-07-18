# Art Appraiser Directory Frontend

This repository now operates as a static publishing system for the Art Appraiser Directory website.

The production surface is plain HTML served directly from `public_site/` through the VPS release directory. Source data still lives in the repo, but the canonical published artifact is the final static HTML, not a rebuilt SPA bundle.

Operational guardrails: [docs/operational-guardrails.md](docs/operational-guardrails.md).

## Features

- Standardized data model for consistent UI and maintenance
- Static HTML publishing for all appraiser and location pages
- Provider-neutral first-party image assets with an explicit placeholder contract
- SEO optimization with structured schema.org data
- Automatic sitemap generation
- Atomic static-release promotion through the standard VPS deploy helper

## Standardized Data Model

The project now uses a standardized data format for all appraiser data:

- Consistent field names and data structures
- Comprehensive appraiser profiles with detailed information
- Rich schema.org markup for improved SEO
- See [DATA_STANDARDIZATION.md](./DATA_STANDARDIZATION.md) for details

## Static-First Workflow

The normal workflow is now `public_site`-first.

### Recommended commands

```bash
npm run build
npm run serve:static
```

`npm run build` no longer means “compile the app” or “refresh generated HTML.”
It is validation-only. Profile and city HTML should not be mass-edited by npm
scripts.

Production publishing is intentionally unavailable through npm. After review,
promote the complete validated `public_site/` artifact with the standard VPS
deploy helper.

### Canonical surfaces

- `data/`: structured source facts for appraisers and locations
- `public_site/`: canonical published HTML artifact
- Standard deployment: `/home/deploy/.codex/skills/public/appraisily-vps-deploy/scripts/deploy.mjs`

## Development Commands

```bash
# Start development server
npm run dev

# Validate the canonical static site in public_site/
npm run build

# Validate public_site/ structure
npm run check:static

# Serve the canonical static site locally
npm run serve:static

# Run lint checks
npm run lint

```

## VPS Static Publish

The VPS deployment serves plain HTML from an nginx container, with content bind-mounted from a release directory (articles-style). The reviewed provider manifest controls which provider-specific HTML nginx may return; all other provider-shaped URLs receive a generic noindex response.

- Canonical editable surface: `public_site/`
- Validate the static artifact:
  - `npm run build`
- Validate the static artifact:
  - `npm run check:static`
All HTML, SEO, envelope, and asset changes use one production path:

```bash
node /home/deploy/.codex/skills/public/appraisily-vps-deploy/scripts/deploy.mjs \
  --service art-appraisers-directory
```

The helper validates and content-hashes `public_site/`, promotes changed content
atomically, verifies the public route and assets, and rolls back on failure.
`npm run publish`, `npm run publish:patch`, and `npm run deploy` are blockers.

## Project Structure

- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts
- `/data` - JSON data files for appraisers and locations
- `/public_site` - Canonical static HTML served in production

## Image Handling

Reviewed provider images must be owned, verified assets or explicitly labeled
checked-in non-likeness artwork. Empty, placeholder, invalid, and failed image
URLs render the deterministic initials fallback; the directory never borrows
another provider's image. Validation and deployment do not generate or rewrite
images automatically; see [IMAGE_GENERATION.md](IMAGE_GENERATION.md).

## Editing Rule

- For normal content, SEO, schema, and internal-link changes, edit `public_site/.../index.html` directly.
- Do not use scripts to mass-edit `public_site/appraiser/**` or `public_site/location/**`.
- Do not rebuild a frontend app as part of the normal workflow.

## SEO Optimization Features

This directory frontend implements comprehensive SEO features to maximize Google ranking potential:

### Technical SEO Implementation

- **Pre-rendered HTML**: All pages are pre-rendered for optimal indexing by search engines
- **Schema.org Structured Data**: Rich structured data for appraisers, locations, and FAQs
- **Optimized Meta Tags**: Complete set of meta tags including title, description, canonical URLs
- **Social Sharing**: OpenGraph and Twitter Card tags for better sharing on social media
- **Semantic HTML**: Proper HTML5 semantic elements for better content parsing
- **Performance Optimization**: Minified HTML/CSS/JS with deferred script loading
- **Sitemap Generation**: Dynamic XML sitemap with priority and frequency attributes
- **Robots.txt**: Custom robots.txt with sitemap reference

### Content Optimization

- **Keyword-rich Content**: Pages are structured for relevant art appraisal keywords
- **Structured Content**: Clear content hierarchy with proper heading structure
- **Local SEO**: Location-specific pages optimized for local search queries
- **FAQ Schema**: Structured FAQ content for potential featured snippets
- **Breadcrumbs**: Clear navigation paths with breadcrumb structured data
