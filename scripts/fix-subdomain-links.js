#!/usr/bin/env node

/**
 * Fix Subdomain Links
 * 
 * This script updates all links in the location pages to point to the subdomain (art-appraiser-directory.appraisily.com)
 * instead of the main domain (appraisily.com) for appraiser pages
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get the project root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Log with color and timestamp
function log(message, type = 'info') {
  const now = new Date();
  const timestamp = now.toISOString();
  let coloredMessage;

  switch (type) {
    case 'warning':
      coloredMessage = chalk.yellow(message);
      break;
    case 'error':
      coloredMessage = chalk.red(message);
      break;
    case 'success':
      coloredMessage = chalk.green(message);
      break;
    default:
      coloredMessage = chalk.blue(message);
  }

  console.log(`[${timestamp}] ${coloredMessage}`);
}

/**
 * Get all HTML files in the dist/location directory
 */
async function getLocationHtmlFiles() {
  const locationDir = path.join(DIST_DIR, 'location');
  
  if (!fs.existsSync(locationDir)) {
    log(`Location directory not found: ${locationDir}`, 'warning');
    return [];
  }
  
  const files = await fs.readdir(locationDir);
  let htmlFiles = [];
  
  for (const file of files) {
    const filePath = path.join(locationDir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      if (fs.existsSync(indexFile)) {
        htmlFiles.push(indexFile);
      }
    }
  }
  
  return htmlFiles;
}

/**
 * Fix appraiser links in all location HTML files to point to subdomain
 */
async function fixSubdomainLinks() {
  log('Fixing appraiser links in location HTML files...', 'info');
  
  try {
    const htmlFiles = await getLocationHtmlFiles();
    log(`Found ${htmlFiles.length} location HTML files to process.`, 'info');
    
    let processedCount = 0;
    
    for (const filePath of htmlFiles) {
      let html = await fs.readFile(filePath, 'utf8');
      
      // Update appraiser links to use subdomain
      html = html.replace(
        /https:\/\/appraisily\.com\/appraiser\//g, 
        'https://art-appraiser-directory.appraisily.com/appraiser/'
      );
      
      // Write the updated content back to the file
      await fs.writeFile(filePath, html, 'utf8');
      processedCount++;
      
      if (processedCount % 10 === 0) {
        log(`Processed ${processedCount}/${htmlFiles.length} files...`, 'info');
      }
    }
    
    log(`Successfully processed all ${processedCount} HTML files`, 'success');
    return processedCount;
  } catch (error) {
    log(`Error fixing subdomain links: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting subdomain link fix process...', 'info');
    const count = await fixSubdomainLinks();
    log(`Completed updating subdomain links in ${count} files.`, 'success');
  } catch (error) {
    log(`Failed to fix subdomain links: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Execute the main function
main();