import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { CANONICAL_REDIRECT_MARKER, assertCanonicalConfig, buildCanonicalAliases, renderCanonicalMap } from './canonical-route-redirects.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
const aliases = buildCanonicalAliases({
  providers: read('provider-publication-manifest.json').providers,
  cities: read('city-publication-decisions.json').cities,
  resources: read('directory-resource-pages.json'),
});
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--print'), 'Only --print is supported; generation never writes configuration');
if (args[0] === '--print') console.log(renderCanonicalMap(aliases));
else {
  assertCanonicalConfig(fs.readFileSync(path.join(root, 'nginx.conf'), 'utf8'), aliases);
  assert.equal(fs.readFileSync(path.join(root, 'public_site', CANONICAL_REDIRECT_MARKER), 'utf8'), `${CANONICAL_REDIRECT_MARKER}\n`);
  console.log(JSON.stringify({ action: 'checked-canonical-redirect-policy', aliases: aliases.length, marker: CANONICAL_REDIRECT_MARKER }));
}
