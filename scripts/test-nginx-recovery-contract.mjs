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
    '/mnt/srv-storage/art-appraisers-directory/releases/20260810171926-9c20e8d06226',
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
    location: response.headers.get('location') || '',
    server: response.headers.get('server') || '',
  };
}

async function runArtifact(label, artifactDir) {
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

    const published = [];
    for (const route of [
      '/',
      '/location/',
      '/location/boston/',
      '/location/houston/',
      '/location/los-angeles/',
      '/location/new-york/',
      '/location/philadelphia/',
      '/location/chicago/',
      '/location/seattle/',
      '/appraiser/heidi-vaughan-ma-isa-am/',
    ]) {
      published.push(await probe(base, route, 200));
    }
    const slashCanonicals = [];
    for (const [route, expected] of [
      ['/appraiser', '/appraiser/'],
      ['/location', '/location/'],
    ]) {
      const result = await probe(base, route, 301);
      if (!result.location.endsWith(expected)) {
        throw new Error(`${route} redirects to ${result.location}; expected ${expected}`);
      }
      slashCanonicals.push(result);
    }
    const directIndex = await probe(base, '/location/houston/index.html', 404);
    const unknownCity = await probe(base, '/location/not-a-reviewed-city/', 404);
    const gscTerminalCities = [];
    for (const route of ['/location/alexandria', '/location/alexandria/']) {
      gscTerminalCities.push(await probe(base, route, 404));
    }
    const unknownProvider = await probe(
      base,
      '/appraiser/not-a-reviewed-provider/',
      404
    );
    const gscTerminalProviders = [];
    for (const slug of [
      'abh-fine-art-advisory',
      'adelaide-fine-art',
      'alexandria-new-york-fine-art-appraisers',
    ]) {
      gscTerminalProviders.push(
        await probe(base, `/appraiser/${slug}/`, 404)
      );
    }
    const reviewedAlias = await probe(
      base,
      '/appraiser/amelia-jeffers-auctioneers-appraisers/',
      410
    );

    if (!reviewedAlias.body.trim()) {
      throw new Error(`${reviewedAlias.route} has an empty body`);
    }
    if (
      /nginx\/\d/i.test(reviewedAlias.body) ||
      /nginx\/\d/i.test(reviewedAlias.server)
    ) {
      throw new Error(`${reviewedAlias.route} exposes an Nginx version`);
    }
    if (/<link\b[^>]*rel=["'][^"']*canonical/i.test(reviewedAlias.body)) {
      throw new Error(`${reviewedAlias.route} includes a canonical`);
    }
    if (
      !/no-cache/i.test(reviewedAlias.cacheControl) ||
      !/no-store/i.test(reviewedAlias.cacheControl)
    ) {
      throw new Error(
        `${reviewedAlias.route} is missing the HTML no-store policy`,
      );
    }
    for (const result of [directIndex, unknownCity, unknownProvider]) {
      if (!result.body.trim()) throw new Error(`${result.route} has an empty body`);
    }

    for (const marker of [
      'This profile is not currently published.',
      'href="/appraiser/"',
      'content="noindex, nofollow"',
    ]) {
      if (!reviewedAlias.body.includes(marker)) {
        throw new Error(`${reviewedAlias.route} is missing ${marker}`);
      }
    }

    return {
      label,
      artifactDir,
      publishedResponses: published.length,
      slashCanonicals: slashCanonicals.length,
      unknownCityStatus: unknownCity.status,
      gscTerminalCityStatuses: Object.fromEntries(
        gscTerminalCities.map(({ route, status }) => [route, status])
      ),
      directIndexStatus: directIndex.status,
      unknownProviderStatus: unknownProvider.status,
      gscTerminalProviderStatuses: Object.fromEntries(
        gscTerminalProviders.map(({ route, status }) => [route, status])
      ),
      reviewedAliasStatus: reviewedAlias.status,
      serverHeader: published[0]?.server,
      terminalProviderDocument: 'appraiser-unavailable.html',
    };
  } finally {
    try {
      docker(['rm', '-f', name]);
    } catch {
      // The --rm container may already have exited.
    }
  }
}

const legacy = await runArtifact('legacy', options.legacyDir);
const candidate = await runArtifact('candidate', options.candidateDir);
console.log(JSON.stringify({
  action: 'art-directory-nginx-recovery-contract',
  ok: true,
  config: options.config,
  image,
  legacy,
  candidate,
}, null, 2));
