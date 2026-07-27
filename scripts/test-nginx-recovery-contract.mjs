#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const options = {
  config: path.join(repoRoot, 'nginx.conf'),
  candidateDir: path.join(repoRoot, 'public_site'),
  legacyDir:
    '/mnt/srv-storage/art-appraisers-directory/releases/20260727080054-c54bd5d9fceb',
};

for (let index = 2; index < process.argv.length; index += 1) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  if (flag === '--config') options.config = path.resolve(value || '');
  else if (flag === '--candidate-dir') {
    options.candidateDir = path.resolve(value || '');
  } else if (flag === '--legacy-dir') {
    options.legacyDir = path.resolve(value || '');
  } else {
    throw new Error(`Unknown or incomplete argument: ${flag}`);
  }
  index += 1;
}

for (const [label, filename] of Object.entries({
  config: options.config,
  candidateDir: options.candidateDir,
  legacyDir: options.legacyDir,
})) {
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
if (!image.startsWith('sha256:')) {
  throw new Error(`Could not resolve the running Nginx image: ${image}`);
}

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
  throw lastError || new Error('Nginx candidate did not become ready');
}

async function probe(base, route, expectedStatus) {
  const response = await fetch(`${base}${route}`, { redirect: 'manual' });
  const body = await response.text();
  if (response.status !== expectedStatus) {
    throw new Error(
      `${route} returned ${response.status}; expected ${expectedStatus}`
    );
  }
  return {
    route,
    status: response.status,
    body,
    cacheControl: response.headers.get('cache-control') || '',
    server: response.headers.get('server') || '',
  };
}

async function runArtifact(label, artifactDir, expectDedicatedRecovery) {
  const name = `art-directory-nginx-contract-${process.pid}-${label}`;
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
      `${artifactDir}:/usr/share/nginx/html:ro`,
      image,
    ]);
    const portOutput = docker(['port', name, '8080/tcp']);
    const port = portOutput.match(/:(\d+)\s*$/)?.[1];
    if (!port) throw new Error(`Could not resolve mapped port from ${portOutput}`);
    const base = `http://127.0.0.1:${port}`;
    await waitForBase(base);

    const retired = [];
    for (const slug of [
      'boston',
      'houston',
      'los-angeles',
      'new-york',
      'philadelphia',
    ]) {
      retired.push(await probe(base, `/location/${slug}/`, 410));
      retired.push(await probe(base, `/location/${slug}`, 410));
    }
    const directIndex = await probe(base, '/location/houston/index.html', 404);
    const unknownCity = await probe(base, '/location/not-a-reviewed-city/', 404);
    const unknownProvider = await probe(
      base,
      '/appraiser/not-a-reviewed-provider/',
      404
    );
    const reviewedAlias = await probe(
      base,
      '/appraiser/amelia-jeffers-auctioneers-appraisers/',
      410
    );

    for (const result of [...retired, reviewedAlias]) {
      if (!result.body.trim()) throw new Error(`${result.route} has an empty body`);
      if (/nginx\/\d/i.test(result.body) || /nginx\/\d/i.test(result.server)) {
        throw new Error(`${result.route} exposes an Nginx version`);
      }
      if (/<link\b[^>]*rel=["'][^"']*canonical/i.test(result.body)) {
        throw new Error(`${result.route} includes a canonical`);
      }
      if (!/no-cache/i.test(result.cacheControl) || !/no-store/i.test(result.cacheControl)) {
        throw new Error(`${result.route} is missing the HTML no-store policy`);
      }
    }
    for (const result of [directIndex, unknownCity, unknownProvider]) {
      if (!result.body.trim()) throw new Error(`${result.route} has an empty body`);
    }

    if (expectDedicatedRecovery) {
      for (const result of retired) {
        for (const marker of [
          'This city page is no longer published.',
          'href="/location/"',
          'href="/appraiser/"',
          'utm_medium=retired_location',
          'content="noindex, follow"',
        ]) {
          if (!result.body.includes(marker)) {
            throw new Error(`${result.route} is missing ${marker}`);
          }
        }
      }
    } else if (!retired.every((result) => /Page not found/i.test(result.body))) {
      throw new Error('Legacy artifact fallback did not retain a branded recovery body');
    }

    return {
      label,
      artifactDir,
      retiredResponses: retired.length,
      unknownCityStatus: unknownCity.status,
      directIndexStatus: directIndex.status,
      unknownProviderStatus: unknownProvider.status,
      reviewedAliasStatus: reviewedAlias.status,
      serverHeader: retired[0]?.server,
      recoveryDocument: expectDedicatedRecovery ? '410.html' : '404.html fallback',
    };
  } finally {
    try {
      docker(['rm', '-f', name]);
    } catch {
      // The --rm container may already have exited.
    }
  }
}

const legacy = await runArtifact('legacy', options.legacyDir, false);
const candidate = await runArtifact('candidate', options.candidateDir, true);
console.log(JSON.stringify({
  action: 'art-directory-nginx-recovery-contract',
  ok: true,
  config: options.config,
  image,
  legacy,
  candidate,
}, null, 2));
