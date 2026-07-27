#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const runDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'art-provider-source-quality-'));
const reportPath = path.join(runDirectory, 'report.json');
const result = spawnSync(
  process.execPath,
  [
    path.join(repoRoot, 'scripts/audit-provider-source-quality.mjs'),
    '--source-dir',
    path.join(repoRoot, 'src/data/standardized'),
    '--manifest',
    path.join(repoRoot, 'data/provider-publication-manifest.json'),
    '--output',
    reportPath,
  ],
  { cwd: repoRoot, encoding: 'utf8' }
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
console.log(JSON.stringify({ action: 'provider-source-quality-audit-receipt', reportPath }));
process.exit(typeof result.status === 'number' ? result.status : 1);
