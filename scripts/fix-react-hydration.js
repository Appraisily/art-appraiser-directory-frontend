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
    
    if (locationContent) {
      // The content should be in a div that React can hydrate
      // Replace the content with a simple skeleton that React can safely hydrate
      locationContent.innerHTML = `
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/services">Services</a>
          </nav>
        </header>
        <main>
          <h1>Loading Location...</h1>
          <p>Please wait while we load the location information.</p>
        </main>
        <footer>
          <p>&copy; 2025 Appraisily. All rights reserved.</p>
        </footer>
      `;
      modified = true;
      log(`Updated location content structure in ${filePath.replace(DIST_DIR, '')}`, 'success');
    }
    
    if (appraiserContent) {
      // Similar fix for appraiser pages
      appraiserContent.innerHTML = `
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/services">Services</a>
          </nav>
        </header>
        <main>
          <h1>Loading Appraiser...</h1>
          <p>Please wait while we load the appraiser information.</p>
        </main>
        <footer>
          <p>&copy; 2025 Appraisily. All rights reserved.</p>
        </footer>
      `;
      modified = true;
      log(`Updated appraiser content structure in ${filePath.replace(DIST_DIR, '')}`, 'success');
    }
    
    // 2. Check and fix asset paths
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src && src.startsWith('/')) {
        // Convert absolute paths to relative paths
        const newSrc = src.replace(/^\//, './');
        script.setAttribute('src', newSrc);
        modified = true;
        log(`Fixed script path: ${src} -> ${newSrc}`, 'success');
      }
    });
    
    const links = document.querySelectorAll('link[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/')) {
        // Convert absolute paths to relative paths
        const newHref = href.replace(/^\//, './');
        link.setAttribute('href', newHref);
        modified = true;
        log(`Fixed link href: ${href} -> ${newHref}`, 'success');
      }
    });
    
    // 3. Move script tags to the end of body
    const bodyScripts = document.querySelectorAll('body script');
    const body = document.querySelector('body');
    
    if (body && bodyScripts.length > 0) {
      bodyScripts.forEach(script => {
        // Remove each script and append it to the end of body
        const clone = script.cloneNode(true);
        script.remove();
        body.appendChild(clone);
        modified = true;
      });
      log(`Moved ${bodyScripts.length} script tags to the end of body`, 'success');
    }
    
    // 4. Add data-hydrate="false" attribute to main content divs
    const contentDivs = document.querySelectorAll('#location-content, #appraiser-content');
    contentDivs.forEach(div => {
      div.setAttribute('data-hydrate', 'false');
      modified = true;
      log(`Added data-hydrate attribute to ${div.id}`, 'success');
    });
    
    // 5. Add a helper script that will ensure proper hydration
    const hydrationScript = document.createElement('script');
    hydrationScript.textContent = `
      document.addEventListener('DOMContentLoaded', function() {
        // Ensure assets are loaded before React hydration
        var mainScript = document.querySelector('script[src*="index-"]');
        if (mainScript) {
          var originalSrc = mainScript.src;
          mainScript.src = '';
          setTimeout(function() {
            mainScript.src = originalSrc;
          }, 100);
        }
      });
    `;
    document.head.appendChild(hydrationScript);
    modified = true;
    log(`Added hydration helper script to ${filePath.replace(DIST_DIR, '')}`, 'success');
    
    if (modified) {
      // Save the modified content back to the file
      const modifiedHTML = dom.serialize();
      await fs.writeFile(filePath, modifiedHTML, 'utf8');
      log(`Saved changes to ${filePath.replace(DIST_DIR, '')}`, 'success');
      return true;
    } else {
      log(`No changes needed for ${filePath.replace(DIST_DIR, '')}`, 'info');
      return false;
    }
  } catch (error) {
    log(`Error fixing hydration issues in ${filePath}: ${error.message}`, 'error');
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