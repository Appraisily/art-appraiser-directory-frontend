#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const EXPECTED_SERVICE = 'art-appraisers-directory';
const EXPECTED_PROPERTY = 'https://art-appraisers-directory.appraisily.com/';
const EXPECTED_SITEMAP = `${EXPECTED_PROPERTY}sitemap.xml`;
const EXPECTED_COHORT_SIZE = 8;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const RELEASE_ID_PATTERN = /^\d{14}-[a-f0-9]{12}$/;
const ACCEPTED_QA_STATUSES = new Set(['submitted', 'complete']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertSha256(value, label) {
  assert(SHA256_PATTERN.test(String(value || '')), `${label} must be a SHA-256 value`);
}

function normalizeUrl(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }
  assert(url.protocol === 'https:', `${label} must use https`);
  assert(!url.username && !url.password, `${label} must not contain credentials`);
  assert(!url.search && !url.hash, `${label} must not contain query or fragment data`);
  return url.href;
}

function addUtcDays(isoTimestamp, days) {
  const timestamp = Date.parse(isoTimestamp);
  assert(Number.isFinite(timestamp), `Invalid UTC boundary timestamp: ${isoTimestamp}`);
  return new Date(timestamp + days * 86_400_000).toISOString().slice(0, 10);
}

async function readJson(filePath, label) {
  const absolute = path.resolve(filePath);
  let raw;
  try {
    raw = await fs.readFile(absolute, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read ${label} at ${absolute}: ${error.message}`);
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label} at ${absolute}: ${error.message}`);
  }
  return { absolute, raw, value, sha256: sha256(raw) };
}

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function parseReleaseId(candidateRelease) {
  const releaseId = path.basename(String(candidateRelease || ''));
  assert(RELEASE_ID_PATTERN.test(releaseId), 'Release receipt has an invalid candidate release ID');
  return releaseId;
}

export async function buildCorrectiveGscBoundary({
  releaseReceiptFile,
  routeRegistryFile,
  qaManifestFile,
  historicalLedgerFile,
  outputDirectory,
  createdAt,
} = {}) {
  assert(releaseReceiptFile, 'releaseReceiptFile is required');
  assert(routeRegistryFile, 'routeRegistryFile is required');
  assert(qaManifestFile, 'qaManifestFile is required');
  assert(historicalLedgerFile, 'historicalLedgerFile is required');
  assert(outputDirectory, 'outputDirectory is required');

  const release = await readJson(releaseReceiptFile, 'release receipt');
  const registry = await readJson(routeRegistryFile, 'route registry');
  const qa = await readJson(qaManifestFile, 'external-QA manifest');
  const historicalLedger = await readJson(historicalLedgerFile, 'historical GSC ledger');

  assert(release.value.service === EXPECTED_SERVICE, 'Release receipt service does not match Art');
  assert(release.value.status === 'verified', 'Release receipt is not verified');
  assertSha256(release.value.source_hash, 'Release source hash');
  const releaseId = parseReleaseId(release.value.candidate_release);

  assert(registry.value.version === 1, 'Unsupported route registry version');
  assert(
    registry.value.generatedFrom?.artifactSha256 === release.value.source_hash,
    'Route registry is not bound to the corrective release source hash'
  );
  assert(
    registry.value.generatedFrom?.sitemap === EXPECTED_SITEMAP,
    'Route registry sitemap URL does not match the Art sitemap'
  );
  assertSha256(registry.value.generatedFrom?.sitemapSha256, 'Sitemap hash');

  const routes = Array.isArray(registry.value.routes) ? registry.value.routes : [];
  assert(routes.length === EXPECTED_COHORT_SIZE, `Route registry must contain exactly ${EXPECTED_COHORT_SIZE} routes`);
  const cohortUrls = routes.map((route, index) => {
    assert(route.publicationStatus === 'published', `Route ${index + 1} is not published`);
    const url = normalizeUrl(route.url, `Route ${index + 1}`);
    const canonical = normalizeUrl(route.canonicalUrl, `Route ${index + 1} canonical`);
    assert(url === canonical, `Route ${index + 1} is not self-canonical`);
    assert(url.startsWith(EXPECTED_PROPERTY), `Route ${index + 1} is outside the Art URL-prefix property`);
    return url;
  });
  assert(new Set(cohortUrls).size === cohortUrls.length, 'Route registry contains duplicate URLs');

  assert(qa.value.release?.service === EXPECTED_SERVICE, 'External-QA manifest service does not match Art');
  assert(
    qa.value.release?.releaseId === releaseId,
    'External-QA manifest is bound to a different release ID'
  );
  assert(
    qa.value.release?.sourceHash === release.value.source_hash,
    'External-QA manifest is bound to a different source hash'
  );
  assert(
    ACCEPTED_QA_STATUSES.has(qa.value.result?.status),
    'External-QA result is not terminal; refusing to create a GSC boundary'
  );
  assert(
    qa.value.result?.testStatus === 'pass',
    'External-QA test status is not pass; refusing to create a GSC boundary'
  );
  assert(String(qa.value.result?.receiptId || '').startsWith('qa_'), 'External-QA receipt ID is missing');
  assert(qa.value.result?.canonicalResult, 'Canonical external-QA result path is missing');
  assertSha256(qa.value.result?.resultSha256, 'External-QA result hash');
  assertSha256(qa.value.result?.receiptSha256, 'External-QA receipt hash');
  assert(
    qa.value.acceptance?.repairedSurfacesPassed === true,
    'External-QA acceptance for the repaired surfaces has not been recorded'
  );
  assert(
    qa.value.acceptance?.blockingAppraisilyDefects === 0,
    'External-QA acceptance records a blocking Appraisily defect'
  );
  assert(
    qa.value.acceptance?.seriousAppraisilyDefects === 0,
    'External-QA acceptance records a serious Appraisily defect'
  );
  const qaReceivedAt = qa.value.result?.receivedAt;
  assert(Number.isFinite(Date.parse(qaReceivedAt)), 'External-QA receivedAt is invalid');

  assert(historicalLedger.value.schemaVersion === 1, 'Unsupported historical ledger version');
  assert(Array.isArray(historicalLedger.value.requests), 'Historical ledger requests are invalid');
  const verifiedAt = release.value.verified_at;
  assert(Number.isFinite(Date.parse(verifiedAt)), 'Release receipt verified_at is invalid');
  const boundaryDate = new Date(verifiedAt).toISOString().slice(0, 10);
  const experimentId = `art-directory-corrective-${boundaryDate}-${releaseId}`;
  const outputRoot = path.resolve(outputDirectory);
  const ledgerPath = path.join(outputRoot, 'gsc-request-receipt-ledger.json');
  const manifestPath = path.join(outputRoot, 'experiment-manifest.json');
  assert(createdAt, 'createdAt is required and must record the actual boundary creation UTC');
  const resolvedCreatedAt = createdAt;
  assert(Number.isFinite(Date.parse(resolvedCreatedAt)), 'createdAt must be an ISO timestamp');
  assert(
    Date.parse(resolvedCreatedAt) >= Date.parse(qaReceivedAt),
    'createdAt must not predate the accepted external-QA result'
  );

  const ledger = {
    schemaVersion: 1,
    experimentId,
    previousLedgerSha256: historicalLedger.sha256,
    property: EXPECTED_PROPERTY,
    executedByAccount: null,
    sitemapSubmission: null,
    checks: {
      manualActions: null,
      securityIssues: null,
    },
    requests: [],
  };
  const ledgerRaw = canonicalJson(ledger);
  const ledgerSha256 = sha256(ledgerRaw);
  const manifest = {
    schemaVersion: 1,
    experimentId,
    createdAt: new Date(resolvedCreatedAt).toISOString(),
    releaseBoundary: new Date(verifiedAt).toISOString(),
    sitemapUrl: EXPECTED_SITEMAP,
    sitemapSha256: registry.value.generatedFrom.sitemapSha256,
    cohortUrls,
    plannedIndexingRequestCohort: cohortUrls,
    releaseIds: {
      artDirectory: releaseId,
    },
    artifactHashes: {
      artDirectory: release.value.source_hash,
      routeRegistry: registry.sha256,
      releaseReceipt: release.sha256,
      externalQaManifest: qa.sha256,
      externalQaResult: qa.value.result.resultSha256,
      externalQaReceipt: qa.value.result.receiptSha256,
      requestReceiptLedger: ledgerSha256,
    },
    deploymentUtc: {
      artDirectoryVerifiedAt: new Date(verifiedAt).toISOString(),
    },
    externalQa: {
      runId: qa.value.ticket?.runId || null,
      receiptId: qa.value.result.receiptId,
      submissionStatus: qa.value.result.status,
      testStatus: qa.value.result.testStatus,
      repairedSurfacesPassed: true,
    },
    checkpointDates: {
      interim: boundaryDate,
      day7: addUtcDays(verifiedAt, 7),
      day14: addUtcDays(verifiedAt, 14),
      day28: addUtcDays(verifiedAt, 28),
      consolidation: addUtcDays(verifiedAt, 28),
    },
    requestReceiptLedger: ledgerPath,
    historicalReference: {
      experimentId: historicalLedger.value.experimentId,
      ledger: historicalLedger.absolute,
      ledgerSha256: historicalLedger.sha256,
    },
    searchConsoleMutation: {
      status: 'not_started',
      approvalRequired: true,
    },
  };
  const manifestRaw = canonicalJson(manifest);

  return {
    manifest,
    ledger,
    files: {
      manifest: { path: manifestPath, raw: manifestRaw, sha256: sha256(manifestRaw) },
      ledger: { path: ledgerPath, raw: ledgerRaw, sha256: ledgerSha256 },
    },
  };
}

export async function writeCorrectiveGscBoundary(result) {
  await fs.mkdir(path.dirname(result.files.manifest.path), { recursive: true });
  for (const file of Object.values(result.files)) {
    await fs.writeFile(file.path, file.raw, { flag: 'wx', mode: 0o640 });
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (name === '--write') {
      args.write = true;
      continue;
    }
    if (!name.startsWith('--')) throw new Error(`Unexpected argument: ${name}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
    args[name.slice(2)] = value;
    index += 1;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await buildCorrectiveGscBoundary({
    releaseReceiptFile: args['release-receipt'],
    routeRegistryFile: args['route-registry'],
    qaManifestFile: args['qa-manifest'],
    historicalLedgerFile: args['historical-ledger'],
    outputDirectory: args['output-dir'],
    createdAt: args['created-at'],
  });
  if (args.write) await writeCorrectiveGscBoundary(result);
  process.stdout.write(
    `${JSON.stringify({
      status: args.write ? 'written' : 'validated',
      experimentId: result.manifest.experimentId,
      releaseId: result.manifest.releaseIds.artDirectory,
      cohortCount: result.manifest.cohortUrls.length,
      sitemapSha256: result.manifest.sitemapSha256,
      manifest: result.files.manifest,
      ledger: result.files.ledger,
      searchConsoleMutation: result.manifest.searchConsoleMutation,
    }, null, 2)}\n`
  );
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  main().catch((error) => {
    process.stderr.write(`Corrective GSC boundary rejected: ${error.message}\n`);
    process.exitCode = 1;
  });
}
