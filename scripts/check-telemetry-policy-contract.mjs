import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const analyticsSource = read('src/utils/analytics.ts');
const trackerSource = read('src/components/AnalyticsTracker.tsx');
const posthogSource = read('src/lib/posthog.ts');
const syntheticSource = read('src/utils/syntheticTraffic.ts');
const staticBootstrap = read('public_site/assets/appraisily-directory-telemetry-20260828-v1.js');
const nginxSource = read('nginx.conf');
const failures = [];

for (const snippet of [
  "const QA_MARKER_STORAGE_KEY = 'appraisily_qa_marker'",
  "params.get('appraisily_synthetic')",
  "params.get('appraisily_qa') === '1'",
  'export function isSyntheticTelemetrySession()',
]) {
  if (!syntheticSource.includes(snippet)) {
    failures.push(`Synthetic traffic contract must include ${JSON.stringify(snippet)}.`);
  }
}
if (!analyticsSource.includes("sendControlPlaneEvent('surface_arrived'")) {
  failures.push('Directory arrival must enter the first-party collector.');
}
if (analyticsSource.includes("sendControlPlaneEvent('page_view'")) {
  failures.push('Raw page_view must not be copied to the first-party collector.');
}
if (!analyticsSource.includes('if (isSyntheticTelemetrySession()) return;')) {
  failures.push('The data-layer adapter must exclude marked synthetic sessions.');
}
if (!trackerSource.includes('isLikelyBot() || isSyntheticTelemetrySession()')) {
  failures.push('The GTM tracker must exclude bots and marked synthetic sessions.');
}
if (!trackerSource.includes('toPublicPagePath(location.pathname)')) {
  failures.push('Google page_view fields must omit query strings and fragments.');
}
if (!posthogSource.includes('isLikelyBot() || isSyntheticTelemetrySession()')) {
  failures.push('Direct PostHog initialization must exclude bots and marked synthetic sessions.');
}
for (const snippet of [
  "sendFirstParty('surface_arrived'",
  "if (event === 'page_view')",
  "if (event === 'page_view') return noOpResponse()",
  "return kind === 'posthog' || (vendorExcluded && Boolean(kind))",
  "data-appraisily-telemetry-owner",
  "cleanParams.journey_id = journeyId",
  "click_owner: 'directory_static_bootstrap'",
  "document.addEventListener('click', onDirectoryCtaClick, true)",
]) {
  if (!staticBootstrap.includes(snippet)) {
    failures.push(`Canonical static telemetry bootstrap must include ${JSON.stringify(snippet)}.`);
  }
}
if (!nginxSource.includes(
  "sub_filter '<head>' '<head><script src=\"/assets/appraisily-directory-telemetry-20260828-v1.js\"",
)) {
  failures.push('Nginx must inject the governed telemetry bootstrap before legacy page scripts.');
}

if (failures.length) {
  console.error('Telemetry policy contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Telemetry policy contract passed.');
