#!/usr/bin/env node

/**
 * Fix-All-Pages.js
 * 
 * This script fixes all the static HTML pages for the site:
 * 1. Fixes React hydration issues
 * 2. Injects fallback image handler
 * 3. Rebuilds with correct paths
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
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
 * Run a script as a subprocess and return its output
 */
function runScript(command, args = []) {
  return new Promise((resolve, reject) => {
    const cmdString = `${command} ${args.join(' ')}`;
    log(`Running command: ${cmdString}`, 'info');
    
    exec(command, { cwd: ROOT_DIR }, (error, stdout, stderr) => {
      if (error) {
        log(`Error running script: ${error.message}`, 'error');
        log(stderr, 'error');
        reject(error);
        return;
      }
      
      resolve(stdout);
    });
  });
}

/**
 * Get all HTML files in the dist directory
 */
async function getAllHtmlFiles(dir = DIST_DIR) {
  const files = await fs.readdir(dir);
  let htmlFiles = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      const nestedFiles = await getAllHtmlFiles(filePath);
      htmlFiles = [...htmlFiles, ...nestedFiles];
    } else if (file.endsWith('.html')) {
      htmlFiles.push(filePath);
    }
  }
  
  return htmlFiles;
}

/**
 * Fix React hydration in all HTML files
 */
async function fixAllHydrationIssues() {
  log('Fixing React hydration issues in all HTML files...', 'info');
  
  try {
    const htmlFiles = await getAllHtmlFiles();
    log(`Found ${htmlFiles.length} HTML files to process.`, 'info');
    
    let fixedCount = 0;
    
    for (const file of htmlFiles) {
      // Get the relative path from the dist directory
      const relativePath = path.relative(DIST_DIR, file);
      
      try {
        // Run the fix-react-hydration.js script for each file
        const output = await runScript('node', [path.join(__dirname, 'fix-react-hydration.js'), relativePath]);
        
        // Check if the file was fixed
        if (output.includes('Fixed hydration issues in 1 files')) {
          fixedCount++;
        }
      } catch (error) {
        log(`Error fixing ${relativePath}: ${error.message}`, 'error');
      }
    }
    
    log(`Fixed hydration issues in ${fixedCount} files.`, 'success');
    return fixedCount;
  } catch (error) {
    log(`Error fixing hydration issues: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('Starting comprehensive page fix process...', 'info');
    
    // Step 1: Rebuild the static files if needed
    const shouldRebuild = process.argv.includes('--rebuild');
    if (shouldRebuild) {
      log('Rebuilding static files...', 'info');
      const rebuildOutput = await runScript('npm', ['run', 'rebuild-static']);
      log(rebuildOutput, 'info');
    }
    
    // Step 2: Fix React hydration issues in all HTML files
    await fixAllHydrationIssues();
    
    // Step 3: Inject fallback image handler
    const fallbackOutput = await runScript('node', [path.join(__dirname, 'inject-fallback-image-handler.js')]);
    log(fallbackOutput, 'info');
    
    log('\nAll pages fixed successfully!', 'success');
    log('Next steps:', 'info');
    log('1. Run `npm run serve:static` to test the site locally', 'info');
    log('2. Commit and push the changes', 'info');
    log('3. Deploy to Netlify', 'info');
  } catch (error) {
    log(`Error fixing pages: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();