#!/usr/bin/env node
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const options = {
  publicDir: '',
  nginx: path.resolve(import.meta.dirname, '../nginx.conf'),
  registry:
    '/srv/repos/tools/directory-site-utils/references/art-route-registry.json',
  policyRoot: path.resolve(import.meta.dirname, '..'),
  legacyArtifact: '',
  selfTest: false,
};
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (token === '--public-dir') options.publicDir = path.resolve(process.argv[++index]);
  else if (token === '--nginx') options.nginx = path.resolve(process.argv[++index]);
  else if (token === '--registry') options.registry = path.resolve(process.argv[++index]);
  else if (token === '--policy-root') options.policyRoot = path.resolve(process.argv[++index]);
  else if (token === '--legacy-artifact') options.legacyArtifact = path.resolve(process.argv[++index]);
  else if (token === '--self-test') options.selfTest = true;
  else throw new Error(`Unknown argument: ${token}`);
}

const consolidationTarget = 'https://antique-appraiser-directory.appraisily.com';

function usesConsolidatedHost(nginxSource) {
  return /location\s*=\s*\/sitemap\.xml\s*\{\s*return\s+301\s+https:\/\/antique-appraiser-directory\.appraisily\.com\/sitemap\.xml/.test(
    nginxSource,
  );
}

function candidateSmokeArgs({ base, nginxSource, registry, policyRoot }) {
  if (usesConsolidatedHost(nginxSource)) {
    return [
      '/srv/repos/tools/smoke/art-directory-retirement-contract.mjs',
      '--base', base,
      '--target-base', consolidationTarget,
    ];
  }
  return [
    '/srv/repos/tools/smoke/directory-static-contract.mjs',
    '--base', base,
    '--canonical-base', 'https://art-appraisers-directory.appraisily.com',
    '--expected-sitemap-count', '13',
    '--route', '/',
    '--route', '/location/',
    '--route', '/location/boston/',
    '--browser-route', '/',
  ];
}

function legacyCompatibilityMatches({
  expectedBehavior,
  consolidated,
  providerStatus,
  cityStatus,
  aliasStatus,
}) {
  if (expectedBehavior === 'v1') {
    return providerStatus === 200 && cityStatus === 200 && aliasStatus !== 410;
  }
  return (
    providerStatus === 404 &&
    cityStatus === (consolidated ? 200 : 410) &&
    aliasStatus === 410
  );
}

if (options.selfTest) {
  const base = 'http://127.0.0.1:12345';
  const consolidatedConfig =
    'location = /sitemap.xml { return 301 https://antique-appraiser-directory.appraisily.com/sitemap.xml$is_args$args; }';
  assert.equal(usesConsolidatedHost(consolidatedConfig), true);
  assert.equal(usesConsolidatedHost('location = /sitemap.xml { try_files $uri =404; }'), false);
  assert.deepEqual(
    candidateSmokeArgs({
      base,
      nginxSource: consolidatedConfig,
      registry: '/tmp/registry.json',
      policyRoot: '/tmp/policy',
    }),
    [
      '/srv/repos/tools/smoke/art-directory-retirement-contract.mjs',
      '--base', base,
      '--target-base', consolidationTarget,
    ],
  );
  assert.deepEqual(
    candidateSmokeArgs({
      base,
      nginxSource: 'location = /sitemap.xml { try_files $uri =404; }',
      registry: '/tmp/registry.json',
      policyRoot: '/tmp/policy',
    }),
    [
      '/srv/repos/tools/smoke/directory-static-contract.mjs',
      '--base', base,
      '--canonical-base', 'https://art-appraisers-directory.appraisily.com',
      '--expected-sitemap-count', '13',
      '--route', '/',
      '--route', '/location/',
      '--route', '/location/boston/',
      '--browser-route', '/',
    ],
  );
  assert.equal(
    legacyCompatibilityMatches({
      expectedBehavior: 'v2',
      consolidated: true,
      providerStatus: 404,
      cityStatus: 200,
      aliasStatus: 410,
    }),
    true,
  );
  console.log('[isolated-nginx-candidate] consolidation and independent-site routing passed');
  process.exit(0);
}

if (!options.publicDir) throw new Error('--public-dir is required');
for (const filename of [options.publicDir, options.nginx, options.registry, options.policyRoot]) {
  if (!fs.existsSync(filename)) throw new Error(`Required candidate input is missing: ${filename}`);
}

const hashFile = (filename) =>
  crypto.createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
const nginxSource = fs.readFileSync(options.nginx, 'utf8');
const consolidated = usesConsolidatedHost(nginxSource);
const container = `art-directory-candidate-${process.pid}-${Date.now()}`;
try {
  execFileSync('docker', [
    'run', '--detach', '--rm',
    '--name', container,
    '--publish', '127.0.0.1::8080',
    '--volume', `${options.publicDir}:/usr/share/nginx/html:ro`,
    '--volume', `${options.nginx}:/etc/nginx/nginx.conf:ro`,
    'nginx:1.27-alpine',
  ], { stdio: ['ignore', 'pipe', 'inherit'] });
  const port = execFileSync(
    'docker',
    ['port', container, '8080/tcp'],
    { encoding: 'utf8' },
  ).trim().match(/:(\d+)$/)?.[1];
  if (!port) throw new Error('Unable to resolve isolated nginx port');
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      execFileSync('curl', ['--fail', '--silent', `http://127.0.0.1:${port}/health`]);
      ready = true;
      break;
    } catch {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
    }
  }
  if (!ready) throw new Error('Isolated nginx candidate did not become ready');
  const smokeOutput = execFileSync(
    process.execPath,
    candidateSmokeArgs({
      base: `http://127.0.0.1:${port}`,
      nginxSource,
      registry: options.registry,
      policyRoot: options.policyRoot,
    }),
    { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
  );
  const smoke = JSON.parse(smokeOutput);
  const sitemap = fs.readFileSync(path.join(options.publicDir, 'sitemap.xml'));
  const sitemapUrlCount = [
    ...sitemap.toString('utf8').matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi),
  ].length;
  const routeCount = consolidated ? smoke.redirects.length : smoke.http.routes.length;
  const policyRouteCount = consolidated
    ? smoke.terminal.length
    : smoke.http.policyResults.length;
  let legacyCompatibility = null;
  if (options.legacyArtifact) {
    if (!fs.existsSync(options.legacyArtifact)) {
      throw new Error(`Legacy artifact is missing: ${options.legacyArtifact}`);
    }
    const legacyContainer = `${container}-legacy`;
    try {
      execFileSync('docker', [
        'run', '--detach', '--rm',
        '--name', legacyContainer,
        '--publish', '127.0.0.1::8080',
        '--volume', `${options.legacyArtifact}:/usr/share/nginx/html:ro`,
        '--volume', `${options.nginx}:/etc/nginx/nginx.conf:ro`,
        'nginx:1.27-alpine',
      ], { stdio: ['ignore', 'pipe', 'inherit'] });
      const legacyPort = execFileSync(
        'docker',
        ['port', legacyContainer, '8080/tcp'],
        { encoding: 'utf8' },
      ).trim().match(/:(\d+)$/)?.[1];
      if (!legacyPort) throw new Error('Unable to resolve legacy compatibility port');
      let legacyReady = false;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
          execFileSync('curl', ['--fail', '--silent', `http://127.0.0.1:${legacyPort}/health`]);
          legacyReady = true;
          break;
        } catch {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
        }
      }
      if (!legacyReady) throw new Error('Legacy compatibility container did not become ready');
      const legacyBase = `http://127.0.0.1:${legacyPort}`;
      const provider = await fetch(`${legacyBase}/appraiser/__qa_legacy_unknown_provider__/`);
      const city = await fetch(`${legacyBase}/location/boston/`);
      const alias = await fetch(`${legacyBase}/appraiser/amelia-jeffers-auctioneers-appraisers/`, {
        redirect: 'manual',
      });
      const legacyV2Marker = path.join(
        options.legacyArtifact,
        '.reviewed-route-enforcement-v2',
      );
      const expectedBehavior = fs.existsSync(legacyV2Marker) ? 'v2' : 'v1';
      if (!legacyCompatibilityMatches({
        expectedBehavior,
        consolidated,
        providerStatus: provider.status,
        cityStatus: city.status,
        aliasStatus: alias.status,
      })) {
        throw new Error(
          `${expectedBehavior} artifact did not retain expected compatibility behavior: ` +
          `provider=${provider.status} city=${city.status} alias=${alias.status} consolidated=${consolidated}`,
        );
      }
      legacyCompatibility = {
        artifact: options.legacyArtifact,
        expectedBehavior,
        unknownProviderStatus: provider.status,
        retiredCityStatus: city.status,
        reviewedAliasStatus: alias.status,
        v2BehaviorInactive: expectedBehavior === 'v1',
      };
    } finally {
      try {
        execFileSync('docker', ['rm', '--force', legacyContainer], { stdio: 'ignore' });
      } catch {
        // Best-effort cleanup after an isolated compatibility probe.
      }
    }
  }
  console.log(JSON.stringify({
    ok: true,
    publicDir: options.publicDir,
    nginx: options.nginx,
    nginxSha256: hashFile(options.nginx),
    registry: options.registry,
    registrySha256: hashFile(options.registry),
    sitemapSha256: crypto.createHash('sha256').update(sitemap).digest('hex'),
    sitemapUrlCount,
    routes: routeCount,
    policyRoutes: policyRouteCount,
    noJavaScriptNavigation: consolidated || Boolean(smoke.noJavaScriptBrowser),
    consolidated,
    legacyCompatibility,
  }, null, 2));
} finally {
  try {
    execFileSync('docker', ['rm', '--force', container], { stdio: 'ignore' });
  } catch {
    // Best-effort cleanup after an isolated candidate probe.
  }
}
