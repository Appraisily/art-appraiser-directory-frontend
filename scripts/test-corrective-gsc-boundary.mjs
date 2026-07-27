#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  buildCorrectiveGscBoundary,
  writeCorrectiveGscBoundary,
} from './build-corrective-gsc-boundary.mjs';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const hash = (character) => character.repeat(64);

async function writeJson(root, name, value) {
  const file = path.join(root, name);
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
  return file;
}

async function fixtures(root) {
  const releaseId = '20260727114811-6adb6b2f630e';
  const sourceHash = hash('a');
  const urls = [
    '/',
    '/appraiser/',
    '/appraiser/one/',
    '/appraiser/two/',
    '/appraiser/three/',
    '/appraiser/four/',
    '/appraiser/five/',
    '/location/',
  ].map((route) => `https://art-appraisers-directory.appraisily.com${route}`);
  const release = {
    version: 1,
    service: 'art-appraisers-directory',
    verified_at: '2026-07-27T11:49:02.284Z',
    source_hash: sourceHash,
    candidate_release: `/releases/${releaseId}`,
    status: 'verified',
  };
  const registry = {
    version: 1,
    generatedFrom: {
      sitemap: 'https://art-appraisers-directory.appraisily.com/sitemap.xml',
      sitemapSha256: hash('b'),
      artifactSha256: sourceHash,
    },
    routes: urls.map((url) => ({
      url,
      canonicalUrl: url,
      kind: 'fixture',
      publicationStatus: 'published',
    })),
  };
  const qa = {
    version: 1,
    status: 'customer_result_verified',
    release: {
      service: 'art-appraisers-directory',
      releaseId,
      sourceHash,
    },
    ticket: { runId: 'fixture-run' },
    result: {
      status: 'submitted',
      testStatus: 'pass',
      receiptId: 'qa_fixture',
      receivedAt: '2026-07-27T11:59:00Z',
      canonicalResult: '/private/result.json',
      resultSha256: hash('c'),
      receiptSha256: hash('d'),
    },
    acceptance: {
      repairedSurfacesPassed: true,
      blockingAppraisilyDefects: 0,
      seriousAppraisilyDefects: 0,
    },
  };
  const historicalLedger = {
    schemaVersion: 1,
    experimentId: 'historical-fixture',
    previousLedgerSha256: hash('e'),
    requests: [],
  };
  return {
    release,
    registry,
    qa,
    historicalLedger,
    files: {
      releaseReceiptFile: await writeJson(root, 'release.json', release),
      routeRegistryFile: await writeJson(root, 'routes.json', registry),
      qaManifestFile: await writeJson(root, 'qa.json', qa),
      historicalLedgerFile: await writeJson(root, 'historical-ledger.json', historicalLedger),
      outputDirectory: path.join(root, 'output'),
    },
  };
}

async function expectReject(files, pattern) {
  await assert.rejects(
    buildCorrectiveGscBoundary({ ...files, createdAt: '2026-07-27T12:00:00Z' }),
    pattern
  );
}

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'art-gsc-boundary-'));
try {
  const fixture = await fixtures(root);
  const first = await buildCorrectiveGscBoundary({
    ...fixture.files,
    createdAt: '2026-07-27T12:00:00Z',
  });
  const second = await buildCorrectiveGscBoundary({
    ...fixture.files,
    createdAt: '2026-07-27T12:00:00Z',
  });
  assert.equal(first.files.manifest.raw, second.files.manifest.raw);
  assert.equal(first.files.ledger.raw, second.files.ledger.raw);
  assert.equal(first.manifest.cohortUrls.length, 8);
  assert.deepEqual(first.manifest.cohortUrls, first.manifest.plannedIndexingRequestCohort);
  assert.deepEqual(first.ledger.requests, []);
  assert.equal(first.ledger.sitemapSubmission, null);
  assert.equal(first.ledger.executedByAccount, null);
  assert.equal(first.manifest.searchConsoleMutation.status, 'not_started');
  assert.equal(first.manifest.searchConsoleMutation.approvalRequired, true);
  assert.equal(first.manifest.checkpointDates.day7, '2026-08-03');
  assert.equal(first.manifest.checkpointDates.day14, '2026-08-10');
  assert.equal(first.manifest.checkpointDates.day28, '2026-08-24');
  assert.equal(
    first.manifest.artifactHashes.requestReceiptLedger,
    sha256(first.files.ledger.raw)
  );

  await writeCorrectiveGscBoundary(first);
  assert.equal(await fs.readFile(first.files.manifest.path, 'utf8'), first.files.manifest.raw);
  assert.equal(await fs.readFile(first.files.ledger.path, 'utf8'), first.files.ledger.raw);
  await assert.rejects(writeCorrectiveGscBoundary(first), /EEXIST/);

  await assert.rejects(
    buildCorrectiveGscBoundary(fixture.files),
    /createdAt is required/
  );
  await assert.rejects(
    buildCorrectiveGscBoundary({
      ...fixture.files,
      createdAt: '2026-07-27T11:58:59Z',
    }),
    /must not predate/
  );

  fixture.qa.result.status = 'pending';
  fixture.qa.result.receiptId = null;
  fixture.qa.acceptance.repairedSurfacesPassed = false;
  await writeJson(root, 'qa.json', fixture.qa);
  await expectReject(fixture.files, /not terminal/);

  fixture.qa.result.status = 'submitted';
  fixture.qa.result.receiptId = 'qa_fixture';
  fixture.qa.acceptance.repairedSurfacesPassed = true;
  fixture.qa.result.testStatus = 'fail';
  await writeJson(root, 'qa.json', fixture.qa);
  await expectReject(fixture.files, /test status is not pass/);

  fixture.qa.result.testStatus = 'pass';
  fixture.qa.acceptance.blockingAppraisilyDefects = 1;
  await writeJson(root, 'qa.json', fixture.qa);
  await expectReject(fixture.files, /blocking Appraisily defect/);

  fixture.qa.acceptance.blockingAppraisilyDefects = 0;
  fixture.qa.acceptance.seriousAppraisilyDefects = 1;
  await writeJson(root, 'qa.json', fixture.qa);
  await expectReject(fixture.files, /serious Appraisily defect/);

  fixture.qa.acceptance.seriousAppraisilyDefects = 0;
  fixture.release.candidate_release = '/releases/20260727080054-c54bd5d9fceb';
  await writeJson(root, 'qa.json', fixture.qa);
  await writeJson(root, 'release.json', fixture.release);
  await expectReject(fixture.files, /different release ID/);

  process.stdout.write('Corrective GSC boundary contract passed\n');
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
