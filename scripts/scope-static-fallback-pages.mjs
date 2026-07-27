#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';

const repoRoot = path.resolve(import.meta.dirname, '..');
const publicDir = path.join(repoRoot, 'public_site');
const write = process.argv.includes('--write');
const scope = '[data-static-fallback]';

function splitSelectors(value) {
  const selectors = [];
  let start = 0;
  let roundDepth = 0;
  let squareDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '(') roundDepth += 1;
    else if (character === ')') roundDepth = Math.max(0, roundDepth - 1);
    else if (character === '[') squareDepth += 1;
    else if (character === ']') squareDepth = Math.max(0, squareDepth - 1);
    else if (character === ',' && roundDepth === 0 && squareDepth === 0) {
      selectors.push(value.slice(start, index));
      start = index + 1;
    }
  }
  selectors.push(value.slice(start));
  return selectors;
}

function scopeSelectorPrelude(prelude) {
  const leading = prelude.match(/^\s*/)?.[0] || '';
  const trailing = prelude.match(/\s*$/)?.[0] || '';
  const selectorText = prelude.trim();
  const selectors = splitSelectors(selectorText).map((selector) => {
    const normalized = selector.trim();
    if (
      !normalized ||
      normalized.includes(scope) ||
      ['body', 'html', ':root'].includes(normalized)
    ) {
      return normalized;
    }
    return `${scope} ${normalized}`;
  });
  return `${leading}${selectors.join(', ')}${trailing}`;
}

function matchingBrace(css, openingIndex) {
  let depth = 0;
  let quote = '';
  for (let index = openingIndex; index < css.length; index += 1) {
    const character = css[index];
    if (quote) {
      if (character === quote && css[index - 1] !== '\\') quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unbalanced inline CSS block');
}

function scopeCss(css) {
  let cursor = 0;
  let output = '';
  while (cursor < css.length) {
    const openingIndex = css.indexOf('{', cursor);
    if (openingIndex === -1) {
      output += css.slice(cursor);
      break;
    }
    const closingIndex = matchingBrace(css, openingIndex);
    const prelude = css.slice(cursor, openingIndex);
    const body = css.slice(openingIndex + 1, closingIndex);
    const normalizedPrelude = prelude.trim().toLowerCase();
    if (
      normalizedPrelude.startsWith('@media') ||
      normalizedPrelude.startsWith('@supports') ||
      normalizedPrelude.startsWith('@container') ||
      normalizedPrelude.startsWith('@layer')
    ) {
      output += `${prelude}{${scopeCss(body)}}`;
    } else if (normalizedPrelude.startsWith('@')) {
      output += `${prelude}{${body}}`;
    } else {
      output += `${scopeSelectorPrelude(prelude)}{${body}}`;
    }
    cursor = closingIndex + 1;
  }
  return output;
}

async function htmlFiles(directory) {
  const results = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await htmlFiles(child));
    else if (entry.isFile() && entry.name.endsWith('.html')) results.push(child);
  }
  return results;
}

function wrapFallbackContent(document, relativePath) {
  const root = document.querySelector('#root');
  if (!root) throw new Error(`${relativePath} has fallback CSS but no #root`);
  let fallback = root.querySelector(':scope > [data-static-fallback]');
  if (fallback) return;
  fallback = document.createElement('div');
  fallback.setAttribute('data-static-fallback', '');
  while (root.firstChild) fallback.appendChild(root.firstChild);
  root.appendChild(fallback);
}

const changes = [];
const inventory = [];
for (const filename of await htmlFiles(publicDir)) {
  const before = await fs.readFile(filename, 'utf8');
  if (!/<script\b[^>]*type=["']module["']/i.test(before) || !/<style\b/i.test(before)) {
    continue;
  }
  const dom = new JSDOM(before);
  const { document } = dom.window;
  const fallbackStyles = [...document.querySelectorAll('style')].filter(
    (style) => !style.hasAttribute('data-appraisily-chat-overlap-fix')
  );
  const relativePath = path.relative(publicDir, filename);
  inventory.push({
    path: relativePath,
    fallbackStyles: fallbackStyles.length,
    ignoredChatStyles:
      document.querySelectorAll('style[data-appraisily-chat-overlap-fix]').length,
  });
  if (!fallbackStyles.length) continue;
  wrapFallbackContent(document, relativePath);
  for (const style of fallbackStyles) {
    style.setAttribute('data-static-fallback-style', '');
    style.textContent = scopeCss(style.textContent || '');
  }
  const after = dom.serialize();
  if (after !== before) {
    changes.push(relativePath);
    if (write) await fs.writeFile(filename, after);
  }
}

console.log(JSON.stringify({
  action: write
    ? 'scoped-static-fallback-pages'
    : 'previewed-static-fallback-pages',
  inventory,
  changedFiles: changes,
}, null, 2));
