#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const options = {
  artifactDir: '',
  receipt: '',
};
for (let index = 2; index < process.argv.length; index += 1) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  if (flag === '--artifact-dir') options.artifactDir = path.resolve(value || '');
  else if (flag === '--receipt') options.receipt = path.resolve(value || '');
  else throw new Error(`Unknown or incomplete argument: ${flag}`);
  index += 1;
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
const name = `art-directory-browser-contract-${process.pid}`;
const agentBrowserSocketDir = `/tmp/art-directory-agent-browser-${process.pid}`;

try {
  fs.mkdirSync(agentBrowserSocketDir, { recursive: true });
  docker([
    'run',
    '--rm',
    '-d',
    '--name',
    name,
    '-p',
    '127.0.0.1::8080',
    '-v',
    `${path.join(repoRoot, 'nginx.conf')}:/etc/nginx/nginx.conf:ro`,
    '-v',
    `${path.join(repoRoot, 'public_site')}:/usr/share/nginx/html:ro`,
    image,
  ]);
  const portOutput = docker(['port', name, '8080/tcp']);
  const port = portOutput.match(/:(\d+)\s*$/)?.[1];
  if (!port) throw new Error(`Could not resolve mapped port from ${portOutput}`);
  const base = `http://127.0.0.1:${port}`;

  const sitemap = fs.readFileSync(
    path.join(repoRoot, 'public_site', 'sitemap.xml'),
    'utf8'
  );
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname
  );
  if (routes.length !== 8) {
    throw new Error(`Expected the fixed eight-URL cohort; found ${routes.length}`);
  }

  const args = [
    '/srv/repos/tools/smoke/directory-static-contract.mjs',
    '--base',
    base,
    '--canonical-base',
    'https://art-appraisers-directory.appraisily.com',
    '--expected-sitemap-count',
    '8',
    '--policy-root',
    repoRoot,
    '--browser-matrix',
    path.join(repoRoot, 'scripts/fixtures/customer-qa-browser-matrix.json'),
  ];
  for (const route of routes) args.push('--route', route);
  if (options.artifactDir) {
    fs.mkdirSync(options.artifactDir, { recursive: true });
    args.push('--artifact-dir', options.artifactDir);
  }
  const output = execFileSync(process.execPath, args, {
    encoding: 'utf8',
    env: {
      ...process.env,
      AGENT_BROWSER_SOCKET_DIR: agentBrowserSocketDir,
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  const result = JSON.parse(output);
  const receipt = {
    ...result,
    candidate: {
      publicDir: path.join(repoRoot, 'public_site'),
      nginxConfig: path.join(repoRoot, 'nginx.conf'),
      image,
      testedAt: new Date().toISOString(),
    },
  };
  const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
  if (options.receipt) {
    fs.mkdirSync(path.dirname(options.receipt), { recursive: true });
    fs.writeFileSync(options.receipt, serialized);
  }
  process.stdout.write(serialized);
} finally {
  try {
    docker(['rm', '-f', name]);
  } catch {
    // The --rm container may already have exited.
  }
  fs.rmSync(agentBrowserSocketDir, { recursive: true, force: true });
}
