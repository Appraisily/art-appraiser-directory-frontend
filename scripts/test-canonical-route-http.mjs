import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { CANONICAL_REDIRECT_MARKER, buildCanonicalAliases } from './canonical-route-redirects.mjs';

const root = path.resolve(import.meta.dirname, '..');
const options = { base: '', policyRoot: root, legacyArtifact: '' };
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  assert.ok(value, `Incomplete argument ${flag}`);
  if (flag === '--base') options.base = value.replace(/\/$/, '');
  else if (flag === '--policy-root') options.policyRoot = path.resolve(value);
  else if (flag === '--legacy-artifact') options.legacyArtifact = path.resolve(value);
  else throw new Error(`Unknown argument ${flag}`);
}
const read = (file) => JSON.parse(fs.readFileSync(path.join(options.policyRoot, 'data', file), 'utf8'));
const aliases = buildCanonicalAliases({
  providers: read('provider-publication-manifest.json').providers,
  cities: read('city-publication-decisions.json').cities,
  resources: read('directory-resource-pages.json'),
});
const origin = 'https://art-appraisers-directory.appraisily.com';
const query = '?appraisily_qa=1&appraisily_synthetic=synthetic_browser&utm_source=partner%2Fart&utm_campaign=canonical%20route&journey_id=qa-canonical%2B20261007&ref_path=%2Fart%3Fq%3D1&repeat=one&repeat=two';
const result = { action: 'art-canonical-route-http-contract', ok: false, testedAt: new Date().toISOString(), aliases: [], targets: [], terminals: [], failures: [] };
let started = false;
const container = `art-canonical-routing-${process.pid}`;
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }).trim();

async function probe(route, method = 'GET') {
  const response = await fetch(`${options.base}${route}`, {
    method, redirect: 'manual', signal: AbortSignal.timeout(20000),
    headers: { accept: 'text/html', 'user-agent': 'Appraisily-Directory-QA/1.0' },
  });
  const body = await response.text();
  return { status: response.status, location: response.headers.get('location') || '', body };
}

async function mapChecks(values, callback) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(8, values.length) }, async () => {
    while (cursor < values.length) {
      const value = values[cursor++];
      try { await callback(value); }
      catch (error) { result.failures.push({ input: value, error: error.message }); }
    }
  }));
}

try {
  if (!options.base) {
    const image = docker('inspect', 'art-appraisers-directory', '--format', '{{.Image}}');
    docker('run', '--rm', '-d', '--name', container, '-p', '127.0.0.1::8080',
      '-v', `${path.join(root, 'nginx.conf')}:/etc/nginx/nginx.conf:ro`,
      '-v', `${options.legacyArtifact || path.join(root, 'public_site')}:/usr/share/nginx/html:ro`, image);
    started = true;
    const port = docker('port', container, '8080/tcp').match(/:(\d+)\s*$/)?.[1];
    assert.ok(port, 'Isolated nginx port is missing');
    options.base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try { if ((await probe('/health')).status === 200) { ready = true; break; } }
      catch { /* Owned candidate can still be starting. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'Isolated nginx did not become ready');
  }
  result.base = options.base;
  const legacy = options.legacyArtifact && !fs.existsSync(path.join(options.legacyArtifact, CANONICAL_REDIRECT_MARKER));
  result.policy = legacy ? 'pre-marker-compatibility' : 'canonical-v1';
  if (legacy) {
    // No marker: staged config must not turn old-artifact duplicate 200s into
    // redirects. Derive existence from that exact artifact, not the new roster.
    const samples = ['/index.html', '/compare-art-appraisers', '/compare-art-appraisers/index.html',
      '/art-appraisal-inquiry-worksheet', '/art-appraisal-inquiry-worksheet/index.html',
      '/appraiser/manhattan-fine-art-appraisers', '/location/boston'];
    await mapChecks(samples.flatMap((from) => ['GET', 'HEAD'].map((method) => ({ from, method }))), async ({ from, method }) => {
      const file = path.join(options.legacyArtifact, from.endsWith('.html') ? from : `${from}/index.html`);
      const expected = fs.existsSync(file) ? 200 : 404;
      const response = await probe(from + query, method);
      assert.equal(response.status, expected, `Old artifact changed at ${from}`);
      assert.equal(response.location, '', 'Old artifact got a new redirect');
      result.aliases.push({ from, method, status: response.status, legacyPreserved: true });
    });
  } else {
    const inputs = aliases.flatMap((alias) => ['GET', 'HEAD'].map((method) => ({ ...alias, method, query })));
    const samples = ['/index.html', '/location/boston', '/appraiser/manhattan-fine-art-appraisers', '/compare-art-appraisers', '/art-appraisal-inquiry-worksheet/index.html'];
    for (const from of samples) inputs.push({ ...aliases.find((alias) => alias.from === from), method: 'GET', query: '' });
    await mapChecks(inputs, async (input) => {
      const response = await probe(input.from + input.query, input.method);
      assert.equal(response.status, 301, `${input.from}: must have one permanent redirect`);
      const destination = new URL(response.location, options.base);
      assert.equal(destination.origin, new URL(options.base).origin, 'Redirect leaks a host/scheme/port');
      assert.equal(destination.pathname, input.to, 'Redirect target differs from reviewed canonical path');
      assert.equal(destination.search, input.query, 'Raw acquisition/query parameters changed');
      assert.equal(destination.hash, '');
      result.aliases.push({ ...input, status: response.status, location: response.location, rawQueryPreserved: true });
    });
    await mapChecks([...new Set(aliases.map((alias) => alias.to))], async (to) => {
      const response = await probe(to + query);
      assert.equal(response.status, 200, `${to}: redirect final must be a direct 200`);
      assert.equal(response.location, '', 'Canonical target adds another redirect');
      const dom = new JSDOM(response.body, { url: `${origin}${to}` });
      try {
        const document = dom.window.document;
        assert.deepEqual([...document.querySelectorAll('link[rel="canonical"]')].map((node) => node.href), [`${origin}${to}`]);
        assert.doesNotMatch(document.querySelector('meta[name="robots"]')?.content || '', /noindex/i);
        result.targets.push({ path: to, status: 200, canonical: `${origin}${to}` });
      } finally { dom.window.close(); }
    });
  }

  const terminalCases = new Map();
  for (const row of read('historical-url-retirement-ledger.json').urls.filter((row) => row.terminalStatus !== 200)) {
    const canonicalPath = new URL(row.url).pathname;
    terminalCases.set(canonicalPath, row.terminalStatus);
    terminalCases.set(canonicalPath.replace(/\/$/, ''), row.terminalStatus);
    terminalCases.set(`${canonicalPath}index.html`, 404);
  }
  for (const { to } of aliases.filter((row) => /^\/(appraiser|location)\/[^/]+\/$/.test(row.to))) terminalCases.set(`${to}index.html`, 404);
  for (const route of ['/.canonical-route-redirects-v1', '/unknown/index.html', '/appraiser/__qa_unknown_provider__', '/appraiser/__qa_unknown_provider__/',
    '/location/__qa_unknown_city__', '/location/__qa_unknown_city__/', '/location/BOSTON', '/appraiser/MANHATTAN-FINE-ART-APPRAISERS']) terminalCases.set(route, 404);
  await mapChecks([...terminalCases].flatMap(([route, status]) => ['GET', 'HEAD'].map((method) => ({ route, status, method }))), async ({ route, status, method }) => {
    const response = await probe(route + query, method);
    assert.equal(response.status, status, `${route}: terminal status changed`);
    assert.equal(response.location, '', `${route}: terminal must not redirect`);
    result.terminals.push({ route, method, status });
  });
  result.ok = result.failures.length === 0;
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  result.failures.push({ error: error.message });
  process.exitCode = 1;
} finally {
  if (started) {
    try { docker('rm', '--force', container); } catch { /* Only this owned container. */ }
  }
  console.log(JSON.stringify(result, null, 2));
}
