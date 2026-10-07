import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'art-indexing-metadata-only-'));
const documents = {
  'index.html': '<h1>Reviewed fixture</h1>',
  'appraiser/index.html': '<h1>Keep provider browse controls</h1>',
  'location/index.html': '<h1>Keep location browse controls</h1>',
  'appraiser/mir-appraisal-services/index.html': '<meta name="robots" content="noindex, follow"><link rel="canonical" href="https://art-appraisers-directory.appraisily.com/appraiser/mir-appraisal-services/"><h1>MIR</h1>',
  'location/chicago/index.html': '<meta name="robots" content="noindex, follow"><link rel="canonical" href="https://art-appraisers-directory.appraisily.com/location/chicago/"><h1>Chicago</h1>',
};
try {
  for (const [name, html] of Object.entries(documents)) {
    const file = path.join(fixture, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
  }
  const script = new URL('./build-indexing-manifest.mjs', import.meta.url).pathname;
  assert.throws(() => execFileSync(process.execPath, [script, '--public-dir', fixture, '--write-metadata'], { stdio: 'pipe' }), /Declared resource document missing/);
  assert.throws(() => execFileSync(process.execPath, [script, '--public-dir', fixture, '--write'], { stdio: 'pipe' }), /allow-reviewed-content-write/);
  assert.throws(() => execFileSync(process.execPath, [script, '--public-dir', 'public_site', '--fixture', '--check'], { stdio: 'pipe' }), /cannot relax/);
  execFileSync(process.execPath, [script, '--public-dir', fixture, '--write-metadata', '--fixture'], { stdio: 'pipe' });
  for (const [name, html] of Object.entries(documents)) assert.equal(fs.readFileSync(path.join(fixture, name), 'utf8'), html, `${name} must not be regenerated or have robots changed`);
  assert.ok(fs.readFileSync(path.join(fixture, 'sitemap.xml'), 'utf8').includes('/appraiser/mir-appraisal-services/'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixture, 'indexing-manifest.json'))).counts.profiles, 1);
  console.log('Metadata-only generation preserves every HTML document, hub and robots directive.');
} finally {
  fs.rmSync(fixture, { recursive: true });
}
