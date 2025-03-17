/**
 * Utility for injecting Google Tag Manager code into HTML files
 * This script ensures that all HTML files in the dist directory have GTM code properly implemented
 */

import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';

const GTM_HEAD_CODE = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PSLHDGM');</script>
<!-- End Google Tag Manager -->`;

const GTM_BODY_CODE = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PSLHDGM"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

/**
 * Adds Google Tag Manager code to an HTML file
 * @param {string} filePath - Path to the HTML file
 * @returns {Promise<boolean>} True if the file was modified, false otherwise
 */
export async function addGTMToFile(filePath) {
  try {
    // Read the file content
    let html = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Check if GTM head code already exists
    if (!html.includes('<!-- Google Tag Manager -->')) {
      // Add GTM head code as high as possible in the <head>
      html = html.replace(/<head>/, `<head>\n    ${GTM_HEAD_CODE}`);
      modified = true;
    }

    // Check if GTM body code already exists
    if (!html.includes('<!-- Google Tag Manager (noscript) -->')) {
      // Add GTM body code immediately after opening <body> tag
      html = html.replace(/<body>/, `<body>\n    ${GTM_BODY_CODE}`);
      modified = true;
    }

    // Write the updated content back to the file if modified
    if (modified) {
      await fs.writeFile(filePath, html, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Injects Google Tag Manager code into all HTML files in a directory
 * @param {string} dir - Directory containing HTML files
 * @returns {Promise<{total: number, modified: number}>} Summary of processed files
 */
export async function injectGTMToDirectory(dir) {
  try {
    console.log(`Injecting Google Tag Manager code to HTML files in ${dir}...`);
    
    // Find all HTML files in the directory and its subdirectories
    const files = glob.sync(path.join(dir, '**/*.html'));
    console.log(`Found ${files.length} HTML files`);
    
    // Process each file
    let modified = 0;
    
    for (const file of files) {
      const wasModified = await addGTMToFile(file);
      if (wasModified) {
        console.log(`Added GTM code to ${file}`);
        modified++;
      }
    }
    
    console.log(`Google Tag Manager code injection complete.`);
    console.log(`${modified} files were modified out of ${files.length} total files.`);
    
    return {
      total: files.length,
      modified
    };
  } catch (error) {
    console.error('Error injecting Google Tag Manager code:', error);
    throw error;
  }
}