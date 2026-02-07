/**
 * Utility to inject Appraisily chat embed script into generated HTML files.
 * We run this post-build because some static generation steps rewrite head tags.
 */

import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';

const CHAT_EMBED_SRC = 'https://appraisily.com/widgets/chat-embed.js';
const CHAT_HEAD_SNIPPET = `<!-- Appraisily Chat Embed -->\n<script defer src="${CHAT_EMBED_SRC}"></script>`;

/**
 * Adds chat embed script to a single HTML file.
 * @param {string} filePath
 * @returns {Promise<boolean>} true when modified
 */
export async function addChatEmbedToFile(filePath) {
  try {
    let html = await fs.readFile(filePath, 'utf8');

    if (html.includes(CHAT_EMBED_SRC) || html.includes('/widgets/chat-embed.js')) {
      return false;
    }

    const headClose = html.search(/<\/head>/i);
    if (headClose === -1) {
      return false;
    }

    html = `${html.slice(0, headClose)}${CHAT_HEAD_SNIPPET}\n${html.slice(headClose)}`;
    await fs.writeFile(filePath, html, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Injects chat embed script into all HTML files within a directory.
 * @param {string} dir
 * @returns {Promise<{total: number, modified: number}>}
 */
export async function injectChatEmbedToDirectory(dir) {
  const files = glob.sync(path.join(dir, '**/*.html'));
  let modified = 0;

  for (const file of files) {
    const changed = await addChatEmbedToFile(file);
    if (changed) {
      modified += 1;
    }
  }

  return {
    total: files.length,
    modified,
  };
}
