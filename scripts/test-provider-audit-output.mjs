#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const wrapper = path.join(repoRoot, 'scripts/run-provider-source-quality-audit.mjs');
const runWrapper = () =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [wrapper], { cwd: repoRoot });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
const [first, second] = await Promise.all([runWrapper(), runWrapper()]);
if (first.status !== 0 || second.status !== 0) {
  throw new Error(`Concurrent-safe wrapper failed:\n${first.stderr}\n${second.stderr}`);
}
const receipt = (output) =>
  output
    .trim()
    .split('\n')
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .find((entry) => entry?.action === 'provider-source-quality-audit-receipt');
const firstReceipt = receipt(first.stdout);
const secondReceipt = receipt(second.stdout);
if (!firstReceipt?.reportPath || !secondReceipt?.reportPath) throw new Error('Missing report receipt');
if (firstReceipt.reportPath === secondReceipt.reportPath) throw new Error('Audit reports collided');
for (const reportPath of [firstReceipt.reportPath, secondReceipt.reportPath]) {
  if (!fs.statSync(reportPath).isFile()) throw new Error(`Missing report ${reportPath}`);
}

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'art-provider-audit-symlink-'));
const target = path.join(fixture, 'target.json');
const link = path.join(fixture, 'report.json');
fs.writeFileSync(target, '{}\n');
fs.symlinkSync(target, link);
const symlinkRun = spawnSync(
  process.execPath,
  [
    path.join(repoRoot, 'scripts/audit-provider-source-quality.mjs'),
    '--source-dir',
    path.join(repoRoot, 'src/data/standardized'),
    '--manifest',
    path.join(repoRoot, 'data/provider-publication-manifest.json'),
    '--output',
    link,
  ],
  { cwd: repoRoot, encoding: 'utf8' }
);
if (symlinkRun.status === 0 || !symlinkRun.stderr.includes('Refusing symlink output')) {
  throw new Error(`Symlink output was not rejected: ${symlinkRun.stderr}`);
}
console.log('[provider-audit-output] PASS isolated=2 symlinkRejected=true');
