#!/usr/bin/env node

import { build } from 'esbuild';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://art-appraisers-directory.appraisily.com/',
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  location: dom.window.location,
  history: dom.window.history,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
  Node: dom.window.Node,
});
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  get: () => dom.window.navigator,
});

const output = await build({
  entryPoints: [path.join(repoRoot, 'scripts/fixtures/interaction-test-entry.tsx')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  packages: 'external',
  define: {
    'import.meta.env': '{}',
  },
  write: false,
});
const source = output.outputFiles[0].text.replaceAll('import.meta.env', '({})');
const bundlePath = path.join(
  repoRoot,
  'scripts',
  `.interaction-test-bundle-${process.pid}.mjs`
);
fs.writeFileSync(bundlePath, source);
try {
  const module = await import(pathToFileURL(bundlePath).href);
  await module.runInteractionTests();
} finally {
  fs.rmSync(bundlePath, { force: true });
  dom.window.close();
}
