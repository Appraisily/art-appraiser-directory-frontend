#!/usr/bin/env node

/**
 * Fix React hydration issues in HTML files
 * Addresses the "Minified React error #299" by updating
 * the static HTML files to avoid hydration mismatches
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
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
 * Fix React hydration issues in a single HTML file
 * @param {string} filePath - Path to the HTML file
 * @returns {Promise<boolean>} - True if fixes were applied
 */
async function fixReactHydration(filePath) {
  try {
    log(`Processing ${filePath.replace(DIST_DIR, '')}`, 'info');
    
    // Read the file content
    const content = await fs.readFile(filePath, 'utf8');
    
    // Parse the HTML
    const dom = new JSDOM(content);
    const { document } = dom.window;
    
    let modified = false;
    
    // 1. Check if the content container is properly set up for React
    const locationContent = document.getElementById('location-content');
    const appraiserContent = document.getElementById('appraiser-content');
    
    // Instead of replacing content, move it inside the root element for proper hydration
    if (locationContent || appraiserContent) {
      const contentElement = locationContent || appraiserContent;
      const rootElement = document.getElementById('root');
      
      if (!rootElement) {
        // Create root element if it doesn't exist
        const rootDiv = document.createElement('div');
        rootDiv.id = 'root';
        contentElement.parentNode.insertBefore(rootDiv, contentElement);
        rootDiv.appendChild(contentElement);
      } else {
        // Move content inside root element
        if (contentElement.parentNode !== rootElement) {
          rootElement.appendChild(contentElement);
        }
      }
      
      modified = true;
      log(`Fixed content structure for ${filePath.replace(DIST_DIR, '')}`, 'success');
    }
    
    // 2. Remove any scripts that match our blocklist (like the ones from unpkg.com)
    const scripts = Array.from(document.querySelectorAll('script'));
    const blockedDomains = [
      'unpkg.com',
      'tangerine-churros-e587f4.netlify.app',
      'widget.js'
    ];
    
    for (const script of scripts) {
      const src = script.getAttribute('src') || '';
      if (blockedDomains.some(domain => src.includes(domain))) {
        script.parentNode.removeChild(script);
        log(`Removed blocked script: ${src}`, 'warning');
        modified = true;
      }
    }
    
    // 3. Remove any injected styles from external domains
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    for (const style of styles) {
      const href = style.getAttribute('href') || '';
      if (blockedDomains.some(domain => href.includes(domain))) {
        style.parentNode.removeChild(style);
        log(`Removed blocked stylesheet: ${href}`, 'warning');
        modified = true;
      }
    }
    
    // 4. Remove browser extension injected elements
    const extensionElements = Array.from(document.querySelectorAll('div[id^="veepn-"], div[id^="extension-"]'));
    for (const el of extensionElements) {
      el.parentNode.removeChild(el);
      log(`Removed browser extension element: ${el.id}`, 'warning');
      modified = true;
    }
    
    // 5. Ensure our script loading is correct
    const mainScript = document.querySelector('script[src*="index-"]');
    if (mainScript) {
      // Make sure script is loaded properly
      mainScript.setAttribute('defer', '');
      // Remove any duplicate loaders for the same script
      const duplicateScripts = Array.from(document.querySelectorAll(`script[src="${mainScript.getAttribute('src')}"]`))
        .filter(s => s !== mainScript);
      
      for (const dup of duplicateScripts) {
        dup.parentNode.removeChild(dup);
        log('Removed duplicate script', 'warning');
        modified = true;
      }
    }
    
    if (modified) {
      // Write the modified HTML back to the file
      await fs.writeFile(filePath, dom.serialize(), 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`Error fixing ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Fix React hydration issues in all HTML files in a directory
 * @param {string} dir - Directory to process
 * @returns {Promise<number>} - Number of files fixed
 */
async function fixAllHtmlFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    let fixedCount = 0;
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively process subdirectories
        fixedCount += await fixAllHtmlFiles(fullPath);
      } else if (file.endsWith('.html')) {
        // Process HTML files
        const fixed = await fixReactHydration(fullPath);
        if (fixed) {
          fixedCount++;
        }
      }
    }
    
    return fixedCount;
  } catch (error) {
    log(`Error processing directory ${dir}: ${error.message}`, 'error');
    return 0;
  }
}

/**
 * Main function to fix React hydration issues
 */
async function main() {
  try {
    log('Starting to fix React hydration issues...', 'info');
    
    // Check if a specific file was provided
    const specificFile = process.argv[2];
    let fixedCount = 0;
    
    if (specificFile) {
      let filePath;
      if (path.isAbsolute(specificFile)) {
        filePath = specificFile;
      } else {
        filePath = path.join(DIST_DIR, specificFile);
      }
      
      if (fs.existsSync(filePath)) {
        log(`Processing specific file: ${specificFile}`, 'info');
        const fixed = await fixReactHydration(filePath);
        fixedCount = fixed ? 1 : 0;
      } else {
        log(`File not found: ${specificFile}`, 'error');
      }
    } else {
      // Process the Cleveland location page specifically
      const clevelandPage = path.join(DIST_DIR, 'location', 'cleveland', 'index.html');
      if (fs.existsSync(clevelandPage)) {
        log('Processing Cleveland location page...', 'info');
        const fixed = await fixReactHydration(clevelandPage);
        if (fixed) {
          fixedCount++;
        }
      } else {
        log('Cleveland location page not found, processing all HTML files...', 'warning');
        fixedCount = await fixAllHtmlFiles(DIST_DIR);
      }
    }
    
    log(`Completed! Fixed hydration issues in ${fixedCount} files.`, 'success');
  } catch (error) {
    log(`Error fixing hydration issues: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main(); 