#!/usr/bin/env node

/**
 * Fix JS URLs
 * 
 * This script updates links in the JavaScript bundle files to point to the subdomain (art-appraiser-directory.appraisily.com)
 * instead of the main domain (appraisily.com) for appraiser pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the project root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

// Check if assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  console.log('Assets directory not found:', ASSETS_DIR);
  process.exit(1);
}

// Get all JS files in the assets directory
const jsFiles = fs.readdirSync(ASSETS_DIR)
  .filter(file => file.endsWith('.js'));

console.log(`Found ${jsFiles.length} JavaScript files`);

// Process each JS file
let fixedCount = 0;
for (const jsFile of jsFiles) {
  const filePath = path.join(ASSETS_DIR, jsFile);
  
  console.log(`Processing ${jsFile}`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update appraiser links to use subdomain
  const originalContent = content;
  
  // Replace href="/appraiser/
  content = content.replace(
    /href="\/appraiser\//g, 
    'href="https://art-appraiser-directory.appraisily.com/appraiser/'
  );
  
  // Replace href="https://appraisily.com/appraiser/
  content = content.replace(
    /href="https:\/\/appraisily\.com\/appraiser\//g, 
    'href="https://art-appraiser-directory.appraisily.com/appraiser/'
  );

  // Write the updated content back only if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    console.log(`Fixed links in ${jsFile}`);
  } else {
    console.log(`No links to fix in ${jsFile}`);
  }
}

console.log(`\nCompleted! Fixed links in ${fixedCount} files out of ${jsFiles.length} JavaScript files.`);