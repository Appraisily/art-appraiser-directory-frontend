# Art Appraiser Directory Frontend

This repository now operates as a static publishing system for the Art Appraiser Directory website.

The production surface is plain HTML served directly from `public_site/` through the VPS release directory. Source data still lives in the repo, but the canonical published artifact is the final static HTML, not a rebuilt SPA bundle.

## Features

- Standardized data model for consistent UI and maintenance
- Static HTML publishing for all appraiser and location pages
- Integration with ImageKit for appraiser profile images
- SEO optimization with structured schema.org data
- Automatic sitemap generation
- Release-directory publish flow for VPS deployment

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
npm run publish:patch
```

`npm run build` no longer means “compile the app” or “refresh generated HTML.”
It is validation-only. Profile and city HTML should not be mass-edited by npm
scripts.

Use `npm run publish:patch` for homepage, nav/footer, CSS, managed CTA block, or
asset-only releases. It starts from the active live release, overlays only
allow-listed static paths from `public_site/`, and updates shared envelope blocks
on existing appraiser/location pages while checking that protected profile/city
content stays unchanged.

### Canonical surfaces

- `data/`: structured source facts for appraisers and locations
- `public_site/`: canonical published HTML artifact
- `scripts/publish-patch.mjs`: patch publisher to `/mnt/srv-storage/art-appraisers-directory/releases`

## Development Commands

```bash
# Start development server
npm run dev

# Validate the canonical static site in public_site/
npm run build

# Validate public_site/ structure
npm run check:static

# Fetch images from ImageKit
npm run fetch:imagekit

# Serve the canonical static site locally
npm run serve:static

# Patch homepage/assets/envelope over the active release without replacing directory content
npm run publish:patch

# Run lint checks
npm run lint

```

## VPS Static Publish (recommended)

The VPS deployment serves plain HTML from an nginx container, with content bind-mounted from a release directory (articles-style).

- Canonical editable surface: `public_site/`
- Validate the static artifact:
  - `npm run build`
- Validate the static artifact:
  - `npm run check:static`
- Patch publish for footer/nav/static-only changes:
  - `npm run publish:patch`

Full generated publish is disabled from npm. Use direct reviewed HTML edits for
individual profile or city content. For visual cleanup, homepage changes,
nav/footer changes, managed CTA-block changes, or static asset updates, use
`npm run publish:patch`.

## Project Structure

- `/src` - React TypeScript source code
- `/scripts` - Build and utility scripts
- `/data` - JSON data files for appraisers and locations
- `/public_site` - Canonical static HTML served in production

## Image Handling

Appraiser profile images are sourced from the ImageKit service, using the `/appraiser-images` folder. The remaining ImageKit scripts are diagnostics only; profile HTML should not be rewritten by image automation.

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
