#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

/**
 * Netlify build script to generate a fully static site
 * with SEO optimizations and fallback strategies
 */
async function netlifyBuild() {
  console.log('🚀 Starting Netlify build process...');
  
  // Step 1: Clean up any existing artifacts
  console.log('🧹 Cleaning up...');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  
  // Step 2: Run the standard build process
  console.log('🔨 Building the application...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
  
  // Step 3: Generate static HTML for all pages
  console.log('📝 Generating static HTML pages...');
  execSync('node scripts/generate-static.js', { stdio: 'inherit', cwd: rootDir });
  
  // Step 4: Optimize images and add fallback handlers
  console.log('🖼️ Adding image fallback handlers...');
  execSync('node scripts/inject-fallback-handler.js', { stdio: 'inherit', cwd: rootDir });
  
  // Step 5: Generate and validate sitemap
  console.log('🗺️ Generating sitemap...');
  execSync('node scripts/generate-sitemap.js', { stdio: 'inherit', cwd: rootDir });
  
  // Step 6: Copy any additional static assets
  console.log('📦 Copying additional assets...');
  const assetsDir = path.join(rootDir, 'public');
  if (fs.existsSync(assetsDir)) {
    // Copy all files from public to dist
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      const sourcePath = path.join(assetsDir, file);
      const destPath = path.join(distDir, file);
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
      } else {
        // For directories, copy recursively
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        execSync(`cp -r ${sourcePath}/* ${destPath}`, { stdio: 'inherit' });
      }
    }
  }
  
  // Step 7: Validate the build
  console.log('✅ Validating build...');
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('❌ Build validation failed: index.html not found');
    process.exit(1);
  }
  
  // Output build information
  const fileCount = countFiles(distDir);
  console.log(`🎉 Build complete! Generated ${fileCount} files.`);
  console.log('📂 Build output is in the "dist" directory');
}

/**
 * Count files in a directory recursively
 */
function countFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      count += countFiles(itemPath);
    } else {
      count++;
    }
  }
  
  return count;
}

// Run the build
netlifyBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
}); 