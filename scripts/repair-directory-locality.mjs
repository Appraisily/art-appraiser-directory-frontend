#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const options = {
    publicDir: path.resolve(process.cwd(), 'public_site'),
    write: false,
  };

  const args = [...argv];
  while (args.length) {
    const token = args.shift();
    if (!token) continue;
    const [flag, inlineValue] = token.split('=');
    const readValue = () => (inlineValue !== undefined ? inlineValue : args.shift());

    switch (flag) {
      case '--public-dir':
        options.publicDir = path.resolve(process.cwd(), String(readValue() || ''));
        break;
      case '--write':
        options.write = true;
        break;
      case '--dry-run':
        options.write = false;
        break;
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildProfileMap(appraisersFeed) {
  const profiles = appraisersFeed.appraisers || [];
  return new Map(profiles.map(profile => [profile.slug, profile]));
}

function explicitServiceAreaSlugs(profile) {
  const rawAreas = [
    ...(Array.isArray(profile?.serviceAreas) ? profile.serviceAreas : []),
    ...(Array.isArray(profile?.areasServed) ? profile.areasServed : []),
    ...(profile?.serviceArea ? [profile.serviceArea] : []),
  ];

  return new Set(rawAreas.map(area => {
    if (typeof area === 'string') return slugify(area);
    return slugify(area?.slug || area?.city || area?.name || '');
  }).filter(Boolean));
}

function filterListedAppraisers({ location, profileMap }) {
  const listed = location.listedAppraisers || [];
  const kept = [];
  const nearby = [];
  const removed = [];

  for (const entry of listed) {
    if (!entry?.slug) {
      removed.push({
        reason: 'unverifiable-no-slug',
        name: entry?.name || '',
        slug: '',
        profileCity: '',
      });
      continue;
    }

    const profile = profileMap.get(entry.slug);
    const profileCitySlug = slugify(profile?.address?.city);

    if (profileCitySlug === location.slug) {
      kept.push(entry);
      continue;
    }

    if (profile && explicitServiceAreaSlugs(profile).has(location.slug)) {
      nearby.push({
        ...entry,
        relationship: 'verified-service-area',
        profileCity: profile.address?.city || '',
        profileRegion: profile.address?.region || '',
      });
      continue;
    }

    removed.push({
      reason: profile ? 'out-of-city-profile' : 'missing-profile',
      name: entry.name || '',
      slug: entry.slug,
      profileCity: profile?.address?.city || '',
      profileRegion: profile?.address?.region || '',
    });
  }

  return { kept, nearby, removed };
}

function applyFilteredLocation(location, listedAppraisers, nearbyAppraisers = []) {
  return {
    ...location,
    numberOfListedAppraisers: listedAppraisers.length,
    listedAppraisers,
    numberOfNearbyAppraisers: nearbyAppraisers.length,
    nearbyAppraisers,
  };
}

async function repairRouteLocationJson({ publicDir, location, filteredLocation, write }) {
  const routeJsonPath = path.join(publicDir, 'location', location.slug, 'index.json');
  const routeJson = await readJson(routeJsonPath);
  const nextRouteJson = {
    ...routeJson,
    location: applyFilteredLocation(
      routeJson.location || location,
      filteredLocation.listedAppraisers,
      filteredLocation.nearbyAppraisers,
    ),
  };

  if (write) {
    await writeJson(routeJsonPath, nextRouteJson);
  }
}

function summarize(results) {
  const totals = results.reduce((acc, item) => {
    acc.before += item.before;
    acc.after += item.after;
    acc.nearby += item.nearby;
    for (const removed of item.removed) {
      acc.removed[removed.reason] = (acc.removed[removed.reason] || 0) + 1;
    }
    if (item.after === 0) acc.emptyCities += 1;
    if (item.after > 0 && item.after < 3) acc.citiesUnder3 += 1;
    return acc;
  }, {
    before: 0,
    after: 0,
    nearby: 0,
    removed: {},
    emptyCities: 0,
    citiesUnder3: 0,
  });

  return {
    ...totals,
    sampledCities: results
      .filter(item => item.removed.length || item.after < 3)
      .slice(0, 30)
      .map(item => ({
        slug: item.slug,
        before: item.before,
        after: item.after,
        removed: item.removed.length,
      })),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const locationsPath = path.join(options.publicDir, 'locations.json');
  const appraisersPath = path.join(options.publicDir, 'appraisers.json');
  const directoryPath = path.join(options.publicDir, 'directory.json');

  const locationsFeed = await readJson(locationsPath);
  const appraisersFeed = await readJson(appraisersPath);
  const profileMap = buildProfileMap(appraisersFeed);
  const results = [];
  const filteredLocations = [];

  for (const location of locationsFeed.locations || []) {
    const { kept, nearby, removed } = filterListedAppraisers({ location, profileMap });
    const filteredLocation = applyFilteredLocation(location, kept, nearby);
    filteredLocations.push(filteredLocation);
    results.push({
      slug: location.slug,
      before: location.listedAppraisers?.length || 0,
      after: kept.length,
      nearby: nearby.length,
      removed,
    });

    await repairRouteLocationJson({
      publicDir: options.publicDir,
      location,
      filteredLocation,
      write: options.write,
    });
  }

  if (options.write) {
    await writeJson(locationsPath, {
      ...locationsFeed,
      locations: filteredLocations,
    });

    try {
      const directoryFeed = await readJson(directoryPath);
      const directoryLocations = new Map(filteredLocations.map(location => [location.slug, location]));
      await writeJson(directoryPath, {
        ...directoryFeed,
        locations: (directoryFeed.locations || []).map(location => {
          const filteredLocation = directoryLocations.get(location.slug);
          return filteredLocation
            ? applyFilteredLocation(
              location,
              filteredLocation.listedAppraisers,
              filteredLocation.nearbyAppraisers,
            )
            : location;
        }),
      });
    } catch (error) {
      throw new Error(`Failed to update directory.json: ${error.message}`);
    }
  }

  console.log(JSON.stringify({
    action: options.write ? 'repaired-directory-locality' : 'dry-run-directory-locality-repair',
    publicDir: options.publicDir,
    summary: summarize(results),
  }, null, 2));
}

main().catch(error => {
  console.error('[repair-directory-locality] Failed:', error?.stack || error?.message || error);
  process.exit(1);
});
