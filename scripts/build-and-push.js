import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const TEMP_DIR = path.join(ROOT_DIR, 'temp_deploy');

// Configuration - update these values
const GITHUB_REPO = 'https://github.com/yourusername/art-appraiser-dist.git'; // Replace with your repo
const BRANCH_NAME = 'main';
const BASE_URL = 'https://art-appraiser.yourdomain.com'; // Replace with your domain

async function buildAndPush() {
  try {
    console.log('🚀 Starting build and push process...');

    // Step 1: Clean previous builds
    console.log('🧹 Cleaning previous builds...');
    fs.removeSync(DIST_DIR);
    fs.removeSync(TEMP_DIR);
    
    // Step 2: Build the application
    console.log('🏗️ Building application...');
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    
    // Step 3: Generate sitemap
    console.log('🗺️ Generating sitemap...');
    generateSitemap();
    
    // Step 4: Set up temp directory for the dist branch
    console.log('📁 Setting up temp directory...');
    fs.ensureDirSync(TEMP_DIR);
    
    // Step 5: Clone the repository (only the specified branch, with depth 1 for performance)
    try {
      console.log(`🔄 Cloning ${BRANCH_NAME} branch...`);
      execSync(`git clone ${GITHUB_REPO} ${TEMP_DIR} --branch ${BRANCH_NAME} --single-branch --depth 1`, { stdio: 'inherit' });
    } catch (error) {
      // If the branch doesn't exist yet, clone without branch specification and create it
      console.log(`🌱 Branch ${BRANCH_NAME} doesn't exist yet, creating it...`);
      execSync(`git clone ${GITHUB_REPO} ${TEMP_DIR} --depth 1`, { stdio: 'inherit' });
      execSync(`cd ${TEMP_DIR} && git checkout -b ${BRANCH_NAME}`, { stdio: 'inherit' });
    }
    
    // Step 6: Remove all files in the temp directory except .git
    console.log('🗑️ Cleaning temp directory...');
    const filesToRemove = fs.readdirSync(TEMP_DIR)
      .filter(file => file !== '.git')
      .map(file => path.join(TEMP_DIR, file));
      
    filesToRemove.forEach(file => {
      fs.removeSync(file);
    });
    
    // Step 7: Copy dist to temp directory
    console.log('📋 Copying built files to temp directory...');
    fs.copySync(DIST_DIR, TEMP_DIR);

    // Copy and rename netlify-dist.toml to netlify.toml in the temp directory
    console.log('📝 Setting up Netlify configuration...');
    fs.copyFileSync(
      path.join(__dirname, 'netlify-dist.toml'),
      path.join(TEMP_DIR, 'netlify.toml')
    );
    
    // Step 8: Commit and push changes
    console.log('📤 Committing and pushing changes...');
    const timestamp = new Date().toISOString();
    execSync(`cd ${TEMP_DIR} && git add . && git commit -m "Deploy: ${timestamp}" && git push -u origin ${BRANCH_NAME}`, { stdio: 'inherit' });
    
    console.log('✅ Build and push completed successfully!');
    
    // Step 9: Clean up temp directory
    fs.removeSync(TEMP_DIR);
    
  } catch (error) {
    console.error('❌ Error during build and push:', error);
    process.exit(1);
  }
}

// Function to generate sitemap.xml
function generateSitemap() {
  // Find all HTML files
  const pages = findHtmlFiles(DIST_DIR);
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  pages.forEach(page => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${BASE_URL}${page}</loc>\n`;
    sitemap += '    <changefreq>weekly</changefreq>\n';
    sitemap += '    <priority>0.8</priority>\n';
    sitemap += '  </url>\n';
  });
  
  sitemap += '</urlset>';
  
  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
}

// Function to recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file === 'index.html') {
      // Get relative path from dist directory
      const relativePath = path.relative(DIST_DIR, dir);
      fileList.push(relativePath === '' ? '/' : `/${relativePath}/`);
    }
  });
  
  return fileList;
}

// Run the build and push process
buildAndPush(); 