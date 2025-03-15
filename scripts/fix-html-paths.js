/**
 * Script to fix asset paths in the HTML files
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

console.log('🔄 Fixing HTML file paths...');

try {
  // Check if dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Dist directory not found! Run a build first.');
  }

  // Fix index.html
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    console.log('📄 Processing index.html...');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
    
    // Add debugging script
    const debugScript = `
  <script>
    // Debugging for module loading
    console.log('🔍 Script loading diagnostics:');
    window.addEventListener('error', function(event) {
      console.error('🚫 Resource Error:', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      // Check if it's a module loading error
      if (event.message && event.message.includes('module') && event.filename) {
        console.error('🚨 Module loading error detected. Asset path:', event.filename);
        document.getElementById('root').innerHTML += '<div style="color: red; padding: 20px; background: #ffeeee; margin: 20px; border: 1px solid #ffaaaa;">' +
          '<h3>Module Loading Error</h3>' +
          '<p>Failed to load: ' + event.filename + '</p>' +
          '<p>This is likely due to incorrect MIME type configuration.</p>' +
          '</div>';
      }
    }, true);
    
    // Report successful loading
    window.addEventListener('load', function() {
      console.log('✅ Window loaded successfully');
      console.log('📊 Document readyState:', document.readyState);
      console.log('📑 DOM structure:', {
        head: document.head.children.length,
        body: document.body.children.length,
        scripts: document.scripts.length,
        root: document.getElementById('root')?.childNodes.length || 0
      });
    });
  </script>`;
    
    // Fix asset paths - change from /directory/assets/ to /assets/
    indexHtml = indexHtml.replace(/\/directory\/assets\//g, '/assets/');
    
    // Ensure module type is correct
    indexHtml = indexHtml.replace(
      /<script type="module" crossorigin=""/g, 
      '<script type="module" crossorigin=""'
    );
    
    // Add the debugging script before the closing head tag
    indexHtml = indexHtml.replace('</head>', `${debugScript}\n</head>`);
    
    // Write the modified file
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log('✅ Fixed index.html paths');
  }

  // Process all HTML files in the location directory
  const locationDir = path.join(DIST_DIR, 'location');
  if (fs.existsSync(locationDir)) {
    console.log('📂 Processing location directory HTML files...');
    
    const processDirectory = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          processDirectory(itemPath);
        } else if (item.endsWith('.html')) {
          console.log(`📄 Processing ${itemPath}...`);
          let html = fs.readFileSync(itemPath, 'utf-8');
          
          // Fix asset paths - change from /directory/assets/ to /assets/
          html = html.replace(/\/directory\/assets\//g, '/assets/');
          
          // Ensure module type is correct
          html = html.replace(
            /<script type="module" crossorigin=""/g, 
            '<script type="module" crossorigin=""'
          );
          
          // Write the modified file
          fs.writeFileSync(itemPath, html);
        }
      });
    };
    
    processDirectory(locationDir);
    console.log('✅ Fixed location directory HTML files');
  }

  console.log('🎉 All HTML paths fixed successfully');
} catch (error) {
  console.error('❌ Error fixing HTML paths:', error.message);
  process.exit(1);
}