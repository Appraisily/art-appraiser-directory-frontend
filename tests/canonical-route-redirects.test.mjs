import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { CANONICAL_REDIRECT_MARKER, assertCanonicalConfig, buildCanonicalAliases, renderCanonicalMap } from '../scripts/canonical-route-redirects.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
const policy = {
  providers: read('provider-publication-manifest.json').providers,
  cities: read('city-publication-decisions.json').cities,
  resources: read('directory-resource-pages.json'),
};
const aliases = buildCanonicalAliases(policy);

test('aliases are exact published slashless paths plus only root/resource index documents', () => {
  const published = policy.providers.filter((row) => ['verified', 'limited'].includes(row.publicationStatus));
  const cities = policy.cities.filter((row) => row.status === 'retained' && row.terminalStatus === 200);
  assert.equal(aliases.length, published.length + cities.length + 2 + policy.resources.length + 1 + policy.resources.length);
  for (const row of aliases) {
    assert.ok(row.to.endsWith('/'));
    assert.ok(!row.to.includes('?') && !row.to.includes('#'));
  }
  for (const provider of policy.providers.filter((row) => !['verified', 'limited'].includes(row.publicationStatus))) {
    assert.ok(!aliases.some((row) => row.from === `/appraiser/${provider.slug}`), provider.slug);
  }
  assert.ok(!aliases.some((row) => /^\/(appraiser|location)\/[^/]+\/index\.html$/.test(row.from)));
  assert.ok(!aliases.some((row) => row.from === '/unknown' || row.from === '/unknown/index.html'));
  assert.deepEqual(aliases.filter((row) => row.from.endsWith('/index.html')).map((row) => row.from).sort(),
    ['/index.html', ...policy.resources.map((row) => `${row.path}index.html`)].sort());
});

test('original request matching is query-safe, case-sensitive and does not redirect internal index lookups', () => {
  const map = renderCanonicalMap([{ from: '/location/boston', to: '/location/boston/' }, { from: '/index.html', to: '/' }]);
  assert.ok(map.includes('map $request_uri $art_canonical_alias'));
  const pattern = /^\/location\/boston(?:\?.*)?$/;
  assert.ok(pattern.test('/location/boston?utm_source=partner%2Fart&repeat=one&repeat=two'));
  for (const value of ['/location/BOSTON', '/location/boston/', '/location/boston-other', '/location/boston/index.html']) assert.ok(!pattern.test(value));
  assert.ok(map.includes('~^/index\\.html(?:\\?.*)?$'));
  assert.match(map, /default "";/);
});

test('candidate nginx has the complete exact map and a private artifact gate', () => {
  const source = fs.readFileSync(path.join(root, 'nginx.conf'), 'utf8');
  assertCanonicalConfig(source, aliases);
  assert.equal(fs.readFileSync(path.join(root, 'public_site', CANONICAL_REDIRECT_MARKER), 'utf8'), `${CANONICAL_REDIRECT_MARKER}\n`);
  assert.throws(() => assertCanonicalConfig(source.replace('default "";', 'default "/";'), aliases), /differs from exact publication policy/);
  assert.throws(() => assertCanonicalConfig(source.replace('$is_args$args;', ';'), aliases), /retain query parameters/);
  assert.throws(() => assertCanonicalConfig(source.replace('-f $document_root/.canonical-route-redirects-v1', '$uri'), aliases), /artifact-gated/);
  const first = aliases[0];
  assert.throws(() => assertCanonicalConfig(source.replace(`"${first.to}";`, '"/";'), aliases), /differs from exact publication policy/);
});

test('invalid or duplicated target policies fail before nginx generation', () => {
  assert.throws(() => buildCanonicalAliases({ ...policy, resources: [...policy.resources, policy.resources[0]] }), /duplicate/);
  assert.throws(() => buildCanonicalAliases({ ...policy, resources: [{ path: '/unknown?redirect=home/' }] }), /clean slash path/);
  assert.throws(() => buildCanonicalAliases({ ...policy, providers: [{ slug: '../unknown', publicationStatus: 'limited' }] }), /safe path/);
});

test('reviewable map printing cannot mutate source or runtime configuration', () => {
  const config = path.join(root, 'nginx.conf');
  const before = fs.readFileSync(config, 'utf8');
  const runtime = '/srv/infrastructure/vps-infra/compose/appraisily/runtime/docker-compose/art-appraisers-directory/nginx.conf';
  const runtimeBefore = fs.readFileSync(runtime, 'utf8');
  const output = execFileSync(process.execPath, [path.join(root, 'scripts/check-canonical-route-redirects.mjs'), '--print'], { encoding: 'utf8' });
  assert.equal(output, `${renderCanonicalMap(aliases)}\n`);
  assert.equal(fs.readFileSync(config, 'utf8'), before);
  assert.equal(fs.readFileSync(runtime, 'utf8'), runtimeBefore);
});
