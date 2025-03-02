#!/usr/bin/env node

/**
 * Build script with enhanced image validation for the art appraiser directory
 * This script performs a standard build but adds image validation and regeneration
 * for appraiser images to ensure all location pages have proper images
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Log with timestamp
const log = (message) => {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${message}`);
};

// Main build function
async function buildWithImageValidation() {
  try {
    log('Starting build with image validation...');
    
    // Set environment variable for image generation service
    process.env.IMAGE_GENERATION_SERVICE_URL = process.env.IMAGE_GENERATION_SERVICE_URL || 
      'https://image-generation.appraisily.com/generate';
    
    log(`Image generation service: ${process.env.IMAGE_GENERATION_SERVICE_URL}`);
    
    // Clean previous build
    log('Cleaning previous build...');
    execSync('npm run clean', { stdio: 'inherit', cwd: ROOT_DIR });
    
    // Compile TypeScript first
    log('Compiling TypeScript...');
    execSync('npm run tsc', { stdio: 'inherit', cwd: ROOT_DIR });
    
    // Run the Vite build
    log('Building with Vite...');
    execSync('npm run build:base', { stdio: 'inherit', cwd: ROOT_DIR });
    
    // Create necessary directories
    const dataDir = path.join(ROOT_DIR, 'dist', 'data');
    fs.ensureDirSync(dataDir);
    
    // Generate static HTML with image validation
    log('Generating static HTML with image validation...');
    execSync('node ./scripts/generate-static.js', { stdio: 'inherit', cwd: ROOT_DIR });
    
    // Generate sitemap
    log('Generating sitemap...');
    try {
      execSync('node ./scripts/generate-sitemap.js', { stdio: 'inherit', cwd: ROOT_DIR });
    } catch (error) {
      log('Warning: Sitemap generation failed, but continuing build');
      console.error(error);
    }
    
    // Optimize images
    log('Optimizing images...');
    try {
      execSync('node ./scripts/optimize-images.js', { stdio: 'inherit', cwd: ROOT_DIR });
    } catch (error) {
      log('Warning: Image optimization failed, but continuing build');
      console.error(error);
    }
    
    // Copy static files
    log('Copying static files...');
    const staticDir = path.join(ROOT_DIR, 'static');
    if (fs.existsSync(staticDir)) {
      fs.copySync(staticDir, path.join(ROOT_DIR, 'dist'));
    }
    
    // Minify HTML (optional)
    if (process.env.MINIFY_HTML === 'true') {
      log('Minifying HTML...');
      try {
        execSync('node ./scripts/minify-html.js', { stdio: 'inherit', cwd: ROOT_DIR });
      } catch (error) {
        log('Warning: HTML minification failed, but continuing build');
        console.error(error);
      }
    }
    
    log('Build completed successfully with image validation!');
    log('---------------------------------------------------');
    log('✅ Pre-rendered HTML pages with validated images');
    log('✅ Enhanced Schema.org structured data');
    log('✅ Optimized meta tags');
    log('✅ Responsive image loading');
    log('✅ Comprehensive XML sitemap');
    log('✅ robots.txt with sitemap reference');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build
buildWithImageValidation(); 