import assert from 'node:assert/strict';

export const CANONICAL_REDIRECT_MARKER = '.canonical-route-redirects-v1';
const begin = '  # BEGIN REVIEWED CANONICAL ALIASES v1';
const end = '  # END REVIEWED CANONICAL ALIASES v1';
const safeSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function buildCanonicalAliases({ providers, cities, resources }) {
  const targets = ['/', '/appraiser/', '/location/'];
  for (const provider of providers.filter((row) => ['verified', 'limited'].includes(row.publicationStatus))) {
    assert.match(provider.slug, safeSlug, 'Published provider slug is not an exact safe path');
    targets.push(`/appraiser/${provider.slug}/`);
  }
  for (const city of cities.filter((row) => row.status === 'retained' && row.terminalStatus === 200)) {
    assert.match(city.slug, safeSlug, 'Retained city slug is not an exact safe path');
    targets.push(`/location/${city.slug}/`);
  }
  for (const resource of resources) {
    assert.match(resource.path, /^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/, 'Resource must declare a clean slash path');
    targets.push(resource.path);
  }
  assert.equal(new Set(targets).size, targets.length, 'Canonical policy declares duplicate targets');
  const aliases = targets.filter((target) => target !== '/').map((target) => ({ from: target.slice(0, -1), to: target }));
  aliases.push({ from: '/index.html', to: '/' });
  for (const resource of resources) aliases.push({ from: `${resource.path}index.html`, to: resource.path });
  assert.equal(new Set(aliases.map((row) => row.from)).size, aliases.length, 'Canonical policy declares duplicate aliases');
  return aliases.sort((left, right) => left.from.localeCompare(right.from));
}

export function renderCanonicalMap(aliases) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [
    begin,
    '  # Match original request paths, not internal index redirects; keep case exact.',
    '  map $request_uri $art_canonical_alias {',
    '    default "";',
    ...aliases.map(({ from, to }) => `    ~^${escape(from)}(?:\\?.*)?$ "${to}";`),
    '  }',
    end,
  ].join('\n');
}

export function assertCanonicalConfig(source, aliases) {
  const start = source.indexOf(begin);
  const finish = source.indexOf(end);
  assert.ok(start >= 0 && finish > start, 'Reviewed canonical map is missing');
  assert.equal(source.indexOf(begin, start + 1), -1, 'Duplicate canonical map');
  assert.equal(source.slice(start, finish + end.length), renderCanonicalMap(aliases), 'Canonical map differs from exact publication policy');
  assert.match(source, /set \$art_release_canonical_alias "";\s*if \(-f \$document_root\/\.canonical-route-redirects-v1\) \{\s*set \$art_release_canonical_alias \$art_canonical_alias;\s*\}\s*if \(\$art_release_canonical_alias\) \{\s*return 301 \$art_release_canonical_alias\$is_args\$args;\s*\}/, 'Canonical redirects must be artifact-gated and retain query parameters');
  assert.match(source, /location = \/\.canonical-route-redirects-v1 \{\s*internal;\s*\}/, 'Routing marker must not be public');
}
