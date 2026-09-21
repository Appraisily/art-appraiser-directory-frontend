import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { injectNearMeHubBridge } from '../scripts/inject-near-me-hub-bridge.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const injector = path.join(repoRoot, 'scripts/inject-near-me-hub-bridge.mjs');

const CITY_FIXTURE = `<!doctype html><title>Art Appraisers in Los Angeles</title>
<main>
      <section>
        <h2>Local inspection versus a signed online report</h2>
        <p>Photos can be enough.</p>
      </section>
      <section>
        <h2>Frequently asked questions</h2>
        <h3>What does a fine-art appraisal cover?</h3>
      </section>
</main>`;

test('city pages receive art, antique, and online near-me hub links and stay idempotent', () => {
  const first = injectNearMeHubBridge(CITY_FIXTURE, 'los-angeles');
  assert.equal(first.missingAnchor, false);
  assert.match(first.html, /data-appraisily-near-me-hub-bridge="1"/);
  assert.match(first.html, /https:\/\/appraisily\.com\/art-appraiser-near-me\?utm_source=art_directory/);
  assert.match(first.html, /https:\/\/appraisily\.com\/antique-appraiser-near-me\?/);
  assert.match(first.html, /https:\/\/appraisily\.com\/online-appraiser-near-me\?/);
  assert.match(first.html, /utm_campaign=los-angeles/);
  const second = injectNearMeHubBridge(first.html, 'los-angeles');
  assert.equal(second.html, first.html);
  assert.equal((second.html.match(/data-appraisily-near-me-hub-bridge="1"/g) || []).length, 1);
});

test('write then check is a no-op on a temp public_site', () => {
  const publicDir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-near-me-hub-bridge-'));
  try {
    fs.mkdirSync(path.join(publicDir, 'location', 'los-angeles'), { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'location', 'los-angeles', 'index.html'), CITY_FIXTURE);
    const write = spawnSync(process.execPath, [injector, '--public-dir', publicDir, '--write'], { encoding: 'utf8' });
    assert.equal(write.status, 0, write.stderr + write.stdout);
    assert.equal(JSON.parse(write.stdout).changedFiles, 1);
    const check = spawnSync(process.execPath, [injector, '--public-dir', publicDir, '--check'], { encoding: 'utf8' });
    assert.equal(check.status, 0, check.stderr + check.stdout);
    assert.equal(JSON.parse(check.stdout).changedFiles, 0);
  } finally {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
});
