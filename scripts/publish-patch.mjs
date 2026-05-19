#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const LEGACY_CHAT_EMBED_SRC = 'https://www.appraisily.com/widgets/chat-embed.js';
const CANONICAL_CHAT_EMBED_SRC = 'https://appraisily.com/widgets/chat-embed.js';

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    String(date.getUTCFullYear()),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join('');
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    publicDir: path.join(REPO_ROOT, 'public_site'),
    releaseRoot: '/mnt/srv-storage/art-appraisers-directory/releases',
    includes: ['index.html', 'assets/'],
    restartContainer: true,
    containerName: 'art-appraisers-directory',
    dryRun: false,
    allowContentPaths: false,
    updateEnvelope: true,
  };

  while (args.length) {
    const token = args.shift();
    if (!token) continue;
    const [flag, inlineValue] = token.split('=');
    const readValue = () => (inlineValue !== undefined ? inlineValue : args.shift());

    switch (flag) {
      case '--public-dir':
        options.publicDir = path.resolve(process.cwd(), readValue());
        break;
      case '--release-root':
        options.releaseRoot = path.resolve(process.cwd(), readValue());
        break;
      case '--include':
        {
          const value = String(readValue() || '').trim();
          if (value) options.includes.push(value);
        }
        break;
      case '--only':
        {
          const value = String(readValue() || '').trim();
          options.includes = value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
        }
        break;
      case '--allow-content-paths':
        options.allowContentPaths = true;
        break;
      case '--skip-envelope':
        options.updateEnvelope = false;
        break;
      case '--update-envelope':
        options.updateEnvelope = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-restart':
        options.restartContainer = false;
        break;
      case '--restart-container':
        options.restartContainer = true;
        break;
      case '--container':
        {
          const value = readValue();
          if (value) options.containerName = String(value).trim();
        }
        break;
      default:
        throw new Error(`Unknown flag ${flag}`);
    }
  }

  return options;
}

function normalizeIncludePath(value) {
  const normalized = String(value || '').replace(/\\/g, '/').replace(/^\/+/, '').trim();
  if (!normalized || normalized === '.') {
    throw new Error('Patch include paths must be explicit relative paths.');
  }
  if (normalized.split('/').includes('..')) {
    throw new Error(`Unsafe patch include path: ${value}`);
  }
  return normalized;
}

function isContentRoutePath(relativePath) {
  return relativePath === 'appraiser' ||
    relativePath === 'location' ||
    relativePath.startsWith('appraiser/') ||
    relativePath.startsWith('location/');
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function capture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  if (result.error) throw result.error;
  if (typeof result.status === 'number' && result.status !== 0) {
    const details = result.stderr?.trim();
    throw new Error(details || `Command failed: ${command} ${args.join(' ')}`);
  }
  return result.stdout.trim();
}

function inspectContainerLabels(containerName) {
  const raw = capture('docker', ['inspect', containerName, '--format', '{{json .Config.Labels}}']);
  return JSON.parse(raw || '{}') || {};
}

function recreateComposeService(containerName) {
  const labels = inspectContainerLabels(containerName);
  const projectName = labels['com.docker.compose.project'];
  const serviceName = labels['com.docker.compose.service'];
  const workingDir = labels['com.docker.compose.project.working_dir'];
  const configFiles = labels['com.docker.compose.project.config_files'];

  if (!projectName || !serviceName || !workingDir || !configFiles) {
    throw new Error(`Missing Docker Compose labels for ${containerName}`);
  }

  const composeArgs = configFiles
    .split(',')
    .map((file) => file.trim())
    .filter(Boolean)
    .flatMap((file) => ['-f', file]);

  run('docker', [
    'compose',
    ...composeArgs,
    '--project-name',
    projectName,
    'up',
    '-d',
    '--force-recreate',
    serviceName,
  ], { cwd: workingDir });
}

async function walkHtmlFiles(rootDir, relativeDir, bucket) {
  const currentDir = path.join(rootDir, relativeDir);
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const childRel = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue;
      await walkHtmlFiles(rootDir, childRel, bucket);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    bucket.push(path.join(rootDir, childRel));
  }
}

async function normalizeChatEmbedHost(releaseDir) {
  const candidates = [];
  await walkHtmlFiles(releaseDir, '', candidates);
  let touchedCount = 0;

  for (const file of candidates) {
    const input = await fs.readFile(file, 'utf8');
    const next = input.replaceAll(LEGACY_CHAT_EMBED_SRC, CANONICAL_CHAT_EMBED_SRC);
    if (next !== input) {
      await fs.writeFile(file, next, 'utf8');
      touchedCount += 1;
    }
  }

  return { touchedCount };
}

async function assertNoLegacyChatEmbedHost(releaseDir) {
  const candidates = [];
  await walkHtmlFiles(releaseDir, '', candidates);
  const offenders = [];

  for (const file of candidates) {
    const input = await fs.readFile(file, 'utf8');
    if (input.includes(LEGACY_CHAT_EMBED_SRC)) {
      offenders.push(path.relative(releaseDir, file));
      if (offenders.length >= 10) break;
    }
  }

  if (offenders.length) {
    throw new Error(
      `Legacy chat embed host detected in release HTML (${LEGACY_CHAT_EMBED_SRC}). Example files: ${offenders.join(', ')}`,
    );
  }
}

async function overlayPath({ publicDir, releaseDir, relativePath }) {
  const source = path.join(publicDir, relativePath);
  const destination = path.join(releaseDir, relativePath);
  const stat = await fs.stat(source);

  if (stat.isDirectory()) {
    await fs.mkdir(destination, { recursive: true });
    await fs.cp(source, destination, {
      recursive: true,
      force: true,
      preserveTimestamps: true,
    });
    return { relativePath, kind: 'directory' };
  }

  if (stat.isFile()) {
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return { relativePath, kind: 'file' };
  }

  throw new Error(`Unsupported patch include path: ${relativePath}`);
}

async function listRouteHtmlFiles(rootDir) {
  const files = [];
  for (const routeRoot of ['appraiser', 'location']) {
    const absoluteRoot = path.join(rootDir, routeRoot);
    let entries = [];
    try {
      entries = await fs.readdir(absoluteRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const relativePath = path.join(routeRoot, entry.name, 'index.html');
      try {
        await fs.access(path.join(rootDir, relativePath));
        files.push(relativePath);
      } catch {
        continue;
      }
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function upsertHeadManagedBlock(targetHtml, sourceHtml, selectorPattern) {
  const sourceMatch = sourceHtml.match(selectorPattern);
  const targetMatch = targetHtml.match(selectorPattern);
  if (!sourceMatch) {
    return targetMatch ? targetHtml.replace(selectorPattern, '') : targetHtml;
  }
  if (targetMatch) {
    return targetHtml.replace(selectorPattern, sourceMatch[0]);
  }
  return targetHtml.replace(/<\/head>/i, `${sourceMatch[0]}\n</head>`);
}

function replaceTagByPattern(targetHtml, sourceHtml, pattern) {
  const sourceMatch = sourceHtml.match(pattern);
  const targetMatch = targetHtml.match(pattern);
  if (!sourceMatch) {
    return targetMatch ? targetHtml.replace(pattern, '') : targetHtml;
  }
  if (targetMatch) {
    return targetHtml.replace(pattern, sourceMatch[0]);
  }
  return targetHtml;
}

function replaceAssetReferences(targetHtml, sourceHtml) {
  let next = targetHtml;
  const patterns = [
    /<link\b[^>]*rel=(["'])preload\1[^>]*href=(["'])[^"']*\/assets\/[^"']+\.css\2[^>]*>/i,
    /<link\b[^>]*rel=(["'])preload\1[^>]*href=(["'])[^"']*\/assets\/[^"']+\.js\2[^>]*>/i,
    /<link\b[^>]*rel=(["'])stylesheet\1[^>]*href=(["'])[^"']*\/assets\/[^"']+\.css\2[^>]*>/i,
    /<script\b[^>]*type=(["'])module\1[^>]*src=(["'])[^"']*\/assets\/[^"']+\.js\2[^>]*><\/script>/i,
  ];

  for (const pattern of patterns) {
    next = replaceTagByPattern(next, sourceHtml, pattern);
  }

  return next;
}

function mergeEnvelopeHtml(targetHtml, sourceHtml) {
  let next = targetHtml;
  next = replaceAssetReferences(next, sourceHtml);
  next = upsertHeadManagedBlock(
    next,
    sourceHtml,
    /<style\b[^>]*\bdata-appraisily-footer-cleanup\b[^>]*>[\s\S]*?<\/style>\s*/i,
  );
  next = replaceTagByPattern(
    next,
    sourceHtml,
    /<footer\b[^>]*>[\s\S]*?<\/footer>\s*/i,
  );
  next = replaceTagByPattern(
    next,
    sourceHtml,
    /<section\b[^>]*\bdata-appraisily-directory-decision-router=(["'])1\1[\s\S]*?<\/section>\s*/i,
  );
  next = replaceTagByPattern(
    next,
    sourceHtml,
    /<section\b[^>]*\bdata-appraisily-directory-sample-proof=(["'])1\1[\s\S]*?<\/section>\s*/i,
  );
  next = replaceTagByPattern(
    next,
    sourceHtml,
    /<script\b[^>]*\bdata-appraisily-directory-decision-router-telemetry=(["'])1\1[\s\S]*?<\/script>\s*/i,
  );
  next = replaceTagByPattern(
    next,
    sourceHtml,
    /<(?:section|div)\b[^>]*\bdata-appraisily-crawl-links\b[^>]*>[\s\S]*?<\/(?:section|div)>\s*/i,
  );
  return next;
}

function stripEnvelopeForContentHash(html) {
  return html
    .replace(/<link\b[^>]*rel=(["'])preload\1[^>]*href=(["'])[^"']*\/assets\/[^"']+\.(?:css|js)\2[^>]*>\s*/gi, '')
    .replace(/<link\b[^>]*rel=(["'])stylesheet\1[^>]*href=(["'])[^"']*\/assets\/[^"']+\.css\2[^>]*>\s*/gi, '')
    .replace(/<script\b[^>]*type=(["'])module\1[^>]*src=(["'])[^"']*\/assets\/[^"']+\.js\2[^>]*><\/script>\s*/gi, '')
    .replace(/<style\b[^>]*\bdata-appraisily-footer-cleanup\b[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>\s*/gi, '')
    .replace(/<section\b[^>]*\bdata-appraisily-directory-decision-router=(["'])1\1[\s\S]*?<\/section>\s*/gi, '')
    .replace(/<section\b[^>]*\bdata-appraisily-directory-sample-proof=(["'])1\1[\s\S]*?<\/section>\s*/gi, '')
    .replace(/<script\b[^>]*\bdata-appraisily-directory-decision-router-telemetry=(["'])1\1[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<(?:section|div)\b[^>]*\bdata-appraisily-crawl-links\b[^>]*>[\s\S]*?<\/(?:section|div)>\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function applyEnvelopeToExistingRoutes({ publicDir, currentRelease, releaseDir }) {
  const currentRoutes = await listRouteHtmlFiles(currentRelease);
  let updated = 0;
  let skippedMissingSource = 0;

  for (const relativePath of currentRoutes) {
    const sourcePath = path.join(publicDir, relativePath);
    const currentPath = path.join(currentRelease, relativePath);
    const releasePath = path.join(releaseDir, relativePath);

    let sourceHtml = '';
    try {
      sourceHtml = await fs.readFile(sourcePath, 'utf8');
    } catch {
      skippedMissingSource += 1;
      continue;
    }

    const beforeHtml = await fs.readFile(currentPath, 'utf8');
    const releaseHtml = await fs.readFile(releasePath, 'utf8');
    const nextHtml = mergeEnvelopeHtml(releaseHtml, sourceHtml);

    if (stripEnvelopeForContentHash(beforeHtml) !== stripEnvelopeForContentHash(nextHtml)) {
      throw new Error(`Envelope merge changed protected content in ${relativePath}`);
    }

    if (nextHtml !== releaseHtml) {
      await fs.writeFile(releasePath, nextHtml, 'utf8');
      updated += 1;
    }
  }

  return {
    checkedRoutes: currentRoutes.length,
    updatedRoutes: updated,
    skippedMissingSource,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const timestamp = formatTimestamp();
  const releaseDir = path.join(options.releaseRoot, timestamp);
  const currentSymlink = path.join(options.releaseRoot, 'current');
  const currentRelease = await fs.realpath(currentSymlink);
  const includes = [...new Set(options.includes.map(normalizeIncludePath))];

  if (!includes.length) {
    throw new Error('Patch publish requires at least one --include path.');
  }

  const blocked = includes.filter(isContentRoutePath);
  if (blocked.length && !options.allowContentPaths) {
    throw new Error(
      `Patch publish refuses appraiser/location content paths by default: ${blocked.join(', ')}. Use full publish with --allow-route-changes for content publishes.`,
    );
  }

  const planned = {
    action: options.dryRun ? 'dry-run-patch' : 'published-patch',
    currentRelease,
    releaseDir,
    currentSymlink,
    includes,
    updateEnvelope: options.updateEnvelope,
  };

  if (options.dryRun) {
    console.log(JSON.stringify(planned, null, 2));
    return;
  }

  await fs.mkdir(releaseDir, { recursive: true });
  run('rsync', ['-a', '--delete', '--no-perms', '--no-owner', '--no-group', `${currentRelease}/`, `${releaseDir}/`]);

  const overlays = [];
  for (const relativePath of includes) {
    overlays.push(await overlayPath({ publicDir: options.publicDir, releaseDir, relativePath }));
  }

  const envelope = options.updateEnvelope
    ? await applyEnvelopeToExistingRoutes({
        publicDir: options.publicDir,
        currentRelease,
        releaseDir,
      })
    : { checkedRoutes: 0, updatedRoutes: 0, skippedMissingSource: 0 };

  const chatHostNormalization = await normalizeChatEmbedHost(releaseDir);
  await assertNoLegacyChatEmbedHost(releaseDir);
  run('ln', ['-sfn', releaseDir, currentSymlink]);

  let containerRefresh = 'skipped';
  if (options.restartContainer && options.containerName) {
    recreateComposeService(options.containerName);
    containerRefresh = 'compose_force_recreate';
  }

  console.log(
    JSON.stringify(
      {
        ...planned,
        overlays,
        envelope,
        chatHostNormalization,
        containerRestarted: Boolean(options.restartContainer && options.containerName),
        containerRefresh,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[publish-patch] Failed:', error?.stack || error?.message || error);
  process.exit(1);
});
