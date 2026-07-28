#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const options = {
  config: path.resolve(import.meta.dirname, '../nginx.conf'),
  artifactDir:
    '/mnt/srv-storage/art-appraisers-directory/releases/20260727194008-9d4493e573cf',
};

for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  if (flag === '--config') options.config = path.resolve(value || '');
  else if (flag === '--artifact-dir') options.artifactDir = path.resolve(value || '');
  else throw new Error(`Unknown or incomplete argument: ${flag}`);
}

for (const [label, filename] of Object.entries(options)) {
  if (!fs.existsSync(filename)) throw new Error(`${label} is missing: ${filename}`);
}

function docker(args) {
  return execFileSync('docker', args, {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  }).trim();
}

const image = docker([
  'inspect',
  'art-appraisers-directory',
  '--format',
  '{{.Image}}',
]);
const name = `art-directory-retired-routing-${process.pid}`;

async function waitForBase(base) {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
      lastError = new Error(`health returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error('candidate did not become ready');
}

try {
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    name,
    '-p',
    '127.0.0.1::8080',
    '-v',
    `${options.config}:/etc/nginx/nginx.conf:ro`,
    '-v',
    `${options.artifactDir}:/usr/share/nginx/html:ro`,
    image,
  ]);
  const portOutput = docker(['port', name, '8080/tcp']);
  const port = portOutput.match(/:(\d+)\s*$/)?.[1];
  if (!port) throw new Error(`Could not resolve mapped port from ${portOutput}`);
  const base = `http://127.0.0.1:${port}`;
  await waitForBase(base);

  const cases = [
    {
      path: '/index.html?source=contract',
      status: 301,
      location:
        'https://antique-appraiser-directory.appraisily.com/?source=contract',
    },
    {
      path: '/robots.txt?source=contract',
      status: 301,
      location:
        'https://antique-appraiser-directory.appraisily.com/robots.txt?source=contract',
    },
    {
      path: '/sitemap.xml?source=contract',
      status: 301,
      location:
        'https://antique-appraiser-directory.appraisily.com/sitemap.xml?source=contract',
    },
    {
      path: '/appraiser/heidi-vaughan-ma-isa-am/?source=contract',
      status: 301,
      location:
        'https://antique-appraiser-directory.appraisily.com/appraiser/heidi-vaughan-ma-isa-am/?source=contract',
    },
    {
      path: '/appraiser/not-a-real-provider/',
      status: 404,
      location: null,
    },
  ];

  const results = [];
  for (const item of cases) {
    const response = await fetch(`${base}${item.path}`, { redirect: 'manual' });
    const location = response.headers.get('location');
    if (response.status !== item.status || location !== item.location) {
      throw new Error(
        `${item.path} returned ${response.status} ${location}; expected ${item.status} ${item.location}`,
      );
    }
    results.push({ path: item.path, status: response.status, location });
  }

  console.log(
    JSON.stringify(
      {
        action: 'retired-index-robots-routing-contract',
        ok: true,
        config: options.config,
        artifactDir: options.artifactDir,
        image,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  try {
    docker(['rm', '-f', name]);
  } catch {
    // The --rm container may already have exited.
  }
}
