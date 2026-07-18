#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const GENERIC_HOSTS = new Set(['artappraisers.org', 'www.artappraisers.org', 'appraisily.com', 'www.appraisily.com']);
const CREDENTIAL_PATTERN = /\b(?:ISA|ASA|AAA|CAPP|USPAP)\b/i;
const HEADING_NAME_PATTERN = /^(?:top|best|list of|appraisers? in|\d+[.)]|#{1,6}\s)/i;

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export function invalidNanp(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const digits = normalizePhone(raw);
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return false;
  return /^[01]/.test(national) || /^[01]/.test(national.slice(3));
}

export function invalidGeneratedEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return Boolean(email && (/^[^@]+@www\./.test(email) || /^(?:user|example)@(?:domain|example)\./.test(email)));
}

export function genericWebsite(value) {
  if (!value) return false;
  try { return GENERIC_HOSTS.has(new URL(value).hostname.toLowerCase()); } catch { return true; }
}

export function suspiciousName(value) {
  const name = String(value || '').trim();
  return !name || HEADING_NAME_PATTERN.test(name) || /^.{0,2}$/.test(name);
}

function providersFrom(value, file, rows = []) {
  if (Array.isArray(value)) {
    for (const item of value) providersFrom(item, file, rows);
    return rows;
  }
  if (!value || typeof value !== 'object') return rows;
  if (typeof value.slug === 'string' && typeof value.name === 'string' && (value.contact || value.metadata || value.business)) {
    rows.push({ ...value, sourceFile: file });
    return rows;
  }
  for (const child of Object.values(value)) providersFrom(child, file, rows);
  return rows;
}

function normalizedText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findingsFor(provider, repeatedReviews, repeatedContacts = new Map()) {
  const findings = [];
  const add = (code, field, value) => findings.push({ code, field, value });
  if (invalidNanp(provider.contact?.phone)) add('invalid_nanp', 'contact.phone', provider.contact.phone);
  if (invalidGeneratedEmail(provider.contact?.email)) add('generated_email', 'contact.email', provider.contact.email);
  if (genericWebsite(provider.contact?.website)) add('generic_or_invalid_website', 'contact.website', provider.contact.website);
  for (const [field, value] of [['phone', provider.contact?.phone], ['email', provider.contact?.email], ['website', provider.contact?.website]]) {
    const normalized = normalizedText(value).replace(/\s+/g, '');
    if (normalized && (repeatedContacts.get(`${field}:${normalized}`) || 0) > 1) add('duplicate_contact_across_providers', `contact.${field}`, value);
  }
  if (suspiciousName(provider.name)) add('suspicious_name', 'name', provider.name);
  const zip = String(provider.address?.zip || '').trim();
  const state = String(provider.address?.state || '').trim().toUpperCase();
  if (state === 'MA' && zip && !/^0[12]\d{3}(?:-\d{4})?$/.test(zip)) add('zip_state_mismatch', 'address.zip', zip);
  if (/\b(?:123|456|789)\s+(?:main|maple|oak|elm)\b/i.test(provider.address?.street || '')) add('placeholder_address', 'address.street', provider.address.street);

  const reviews = Array.isArray(provider.reviews) ? provider.reviews : [];
  const local = new Set();
  for (const review of reviews) {
    const content = normalizedText(review?.content);
    if (!content) continue;
    if (local.has(content)) add('duplicate_review_within_provider', 'reviews', review.content);
    local.add(content);
    if ((repeatedReviews.get(content) || 0) > 1) add('repeated_review_across_providers', 'reviews', review.content);
    if (!review.sourceUrl && !review.sourceId && !review.platformReviewId) add('review_missing_provenance', 'reviews', review.content);
  }
  const certifications = provider.expertise?.certifications || [];
  for (const credential of certifications) {
    if (CREDENTIAL_PATTERN.test(String(credential)) && !provider.metadata?.credentialVerification) {
      add('credential_missing_provenance', 'expertise.certifications', credential);
    }
  }
  return findings;
}

function parseArgs(argv) {
  const options = { sourceDir: '', manifest: '', output: '' };
  const args = [...argv];
  while (args.length) {
    const flag = args.shift();
    const value = args.shift();
    if (flag === '--source-dir') options.sourceDir = path.resolve(value || '');
    else if (flag === '--manifest') options.manifest = path.resolve(value || '');
    else if (flag === '--output') options.output = path.resolve(value || '');
    else throw new Error(`Unknown or incomplete flag ${flag}`);
  }
  if (!options.sourceDir || !options.manifest || !options.output) throw new Error('--source-dir, --manifest, and --output are required');
  return options;
}

async function jsonFiles(root) {
  const files = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const providers = [];
  for (const file of await jsonFiles(options.sourceDir)) {
    const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
    providersFrom(parsed, path.relative(options.sourceDir, file), providers);
  }
  const reviewCounts = new Map();
  const contactCounts = new Map();
  for (const provider of providers) for (const review of provider.reviews || []) {
    const content = normalizedText(review?.content);
    if (content) reviewCounts.set(content, (reviewCounts.get(content) || 0) + 1);
  }
  for (const provider of providers) for (const [field, value] of [['phone', provider.contact?.phone], ['email', provider.contact?.email], ['website', provider.contact?.website]]) {
    const normalized = normalizedText(value).replace(/\s+/g, '');
    if (normalized) contactCounts.set(`${field}:${normalized}`, (contactCounts.get(`${field}:${normalized}`) || 0) + 1);
  }
  const manifest = JSON.parse(await fs.readFile(options.manifest, 'utf8'));
  const states = new Map((manifest.providers || []).map(row => [row.slug, row]));
  const quarantine = providers.map(provider => {
    const findings = findingsFor(provider, reviewCounts, contactCounts);
    if (!findings.length) return null;
    const identityPublicationStatus = states.get(provider.slug)?.publicationStatus || 'not_published';
    return {
      slug: provider.slug,
      name: provider.name,
      sourceFile: provider.sourceFile,
      publicationStatus: ['rejected', 'retired'].includes(identityPublicationStatus) ? identityPublicationStatus : 'under_review',
      identityPublicationStatus,
      findings,
    };
  }).filter(Boolean);
  const hasReviewedOverride = row => {
    const record = states.get(row.slug);
    return record?.publicationStatus === 'verified'
      && record?.verifiedBy === 'manual_official_website_review'
      && Boolean(record?.verifiedAt)
      && Boolean(record?.sourceUrl)
      && Array.isArray(record?.claimScope)
      && record.claimScope.includes('identity')
      && record.claimScope.includes('primary_location')
      && record.claimScope.includes('fine_art_services');
  };
  const unsafePublished = quarantine.filter(row => row.identityPublicationStatus === 'verified' && !hasReviewedOverride(row));
  const reviewedOverrides = quarantine.filter(row => row.identityPublicationStatus === 'verified' && hasReviewedOverride(row));
  const report = {
    generatedAt: new Date().toISOString(),
    sourceRecords: providers.length,
    quarantinedRecords: quarantine.length,
    unsafePublishedRecords: unsafePublished.length,
    reviewedOverrideRecords: reviewedOverrides.length,
    reasonCounts: quarantine.flatMap(row => row.findings).reduce((acc, item) => ({ ...acc, [item.code]: (acc[item.code] || 0) + 1 }), {}),
    quarantine,
  };
  await fs.mkdir(path.dirname(options.output), { recursive: true });
  await fs.writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ok: unsafePublished.length === 0, output: options.output, ...Object.fromEntries(Object.entries(report).filter(([key]) => !['quarantine', 'generatedAt'].includes(key))) }, null, 2));
  if (unsafePublished.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().catch(error => { console.error(`[audit-provider-source-quality] ${error.stack || error}`); process.exit(1); });
}
