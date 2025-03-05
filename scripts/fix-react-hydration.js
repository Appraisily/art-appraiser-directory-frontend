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
    
    // 1. Check if the root element exists, create it if it doesn't
    let rootElement = document.getElementById('root');
    if (!rootElement) {
      log(`Creating missing root element in ${filePath.replace(DIST_DIR, '')}`, 'warning');
      rootElement = document.createElement('div');
      rootElement.id = 'root';
      
      // Insert it at the beginning of the body
      const body = document.querySelector('body');
      if (body && body.firstChild) {
        body.insertBefore(rootElement, body.firstChild);
        modified = true;
      } else if (body) {
        body.appendChild(rootElement);
        modified = true;
      }
    }
    
    // 2. Move content containers inside root if they're not already
    const locationContent = document.getElementById('location-content');
    const appraiserContent = document.getElementById('appraiser-content');
    
    const contentElement = locationContent || appraiserContent;
    if (contentElement && rootElement) {
      // Check if the content element is already inside the root
      if (!rootElement.contains(contentElement)) {
        log(`Moving content into root element in ${filePath.replace(DIST_DIR, '')}`, 'warning');
        
        // Copy all child nodes from contentElement to rootElement
        while (contentElement.childNodes.length > 0) {
          rootElement.appendChild(contentElement.childNodes[0]);
        }
        
        // Remove the now-empty content element
        if (contentElement.parentNode) {
          contentElement.parentNode.removeChild(contentElement);
        }
        
        modified = true;
      }
    } else if (!contentElement && rootElement) {
      // If we don't find the specific content containers, move all top-level content inside root
      // But skip script tags, noscript tags, and the root element itself
      const body = document.querySelector('body');
      if (body) {
        const children = Array.from(body.children).filter(child => 
          child !== rootElement && 
          child.tagName.toLowerCase() !== 'script' && 
          child.tagName.toLowerCase() !== 'noscript'
        );
        
        if (children.length > 0) {
          log(`Moving top-level content into root element in ${filePath.replace(DIST_DIR, '')}`, 'warning');
          
          for (const child of children) {
            rootElement.appendChild(child);
          }
          
          modified = true;
        }
      }
    }
    
    // 3. Remove any scripts that match our blocklist (like the ones from unpkg.com)
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
    
    // 4. Remove any injected styles from external domains
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    for (const style of styles) {
      const href = style.getAttribute('href') || '';
      if (blockedDomains.some(domain => href.includes(domain))) {
        style.parentNode.removeChild(style);
        log(`Removed blocked stylesheet: ${href}`, 'warning');
        modified = true;
      }
    }
    
    // 5. Remove browser extension injected elements
    const extensionElements = Array.from(document.querySelectorAll('div[id^="veepn-"], div[id^="extension-"]'));
    for (const el of extensionElements) {
      el.parentNode.removeChild(el);
      log(`Removed browser extension element: ${el.id}`, 'warning');
      modified = true;
    }
    
    // 6. Ensure our script loading is correct
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
    
    // 7. Fix asset paths if needed
    const assetPaths = Array.from(document.querySelectorAll('link[href^="/assets/"], script[src^="/assets/"], img[src^="/assets/"]'));
    for (const element of assetPaths) {
      const attrName = element.hasAttribute('href') ? 'href' : 'src';
      const oldPath = element.getAttribute(attrName);
      if (oldPath && oldPath.startsWith('/assets/')) {
        const newPath = oldPath.replace('/assets/', '/directory/assets/');
        element.setAttribute(attrName, newPath);
        log(`Fixed asset path: ${oldPath} -> ${newPath}`, 'warning');
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
    
    let fixedCount = 0;
    
    // Always scan all appraiser pages, not just Cleveland
    const specificFile = process.argv[2];
    
    if (specificFile) {
      // Fix a specific file if provided
      const filePath = path.resolve(specificFile);
      log(`Processing ${specificFile}`, 'info');
      const fixed = await fixReactHydration(filePath);
      if (fixed) fixedCount++;
    } else {
      // Fix all HTML files in the dist directory
      fixedCount = await fixAllHtmlFiles(DIST_DIR);
      
      // Also process the Cleveland page specifically, since it's specifically referenced
      const clevelandPage = path.join(DIST_DIR, 'location', 'cleveland', 'index.html');
      if (await fs.pathExists(clevelandPage)) {
        log('Processing Cleveland location page...', 'info');
        const fixed = await fixReactHydration(clevelandPage);
        if (fixed) fixedCount++;
      }
    }
    
    log(`Completed! Fixed hydration issues in ${fixedCount} files.`, 'success');
  } catch (error) {
    log(`Error fixing hydration issues: ${error.message}`, 'error');
  }
}

// Run the main function
main(); 