#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import { injectChatEmbedToDirectory } from './utils/inject-chat-embed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

async function main() {
  console.log('Starting Appraisily chat embed injection');
  try {
    const result = await injectChatEmbedToDirectory(DIST_DIR);
    console.log('Appraisily chat embed injection completed');
    console.log(`Total files processed: ${result.total}`);
    console.log(`Files modified: ${result.modified}`);
  } catch (error) {
    console.error('Chat embed injection failed:', error);
    process.exit(1);
  }
}

main();

