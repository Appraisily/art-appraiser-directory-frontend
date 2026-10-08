#!/usr/bin/env node
import { execFile, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { JSDOM } from 'jsdom';
import { assertDocumentParity, assertHandoffAttribution, assertProviderEvidence, assertReviewedInventory, assertUnpublishedDocumentParity, captureDocument } from './settled-document-contract.mjs';
import { assertOwnedHandoffArrival, assertProviderHandoff, captureProviderHandoff } from './provider-handoff-contract.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const origin = 'https://art-appraisers-directory.appraisily.com';
const options = { artifactDir: '', receipt: '', base: '', policyRoot: repoRoot };
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  const value = process.argv[index + 1];
  if (!value || !['--artifact-dir', '--receipt', '--base', '--policy-root'].includes(flag)) throw new Error(`Unknown or incomplete argument: ${flag}`);
  const key = { '--artifact-dir': 'artifactDir', '--policy-root': 'policyRoot' }[flag] || flag.slice(2);
  options[key] = flag === '--base' ? value.replace(/\/$/, '') : path.resolve(value);
}
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(options.policyRoot, file), 'utf8'));
const providers = readJson('data/provider-publication-manifest.json').providers;
const cities = readJson('data/city-publication-decisions.json').cities;
const resources = readJson('data/directory-resource-pages.json');
const focal = readJson('scripts/fixtures/customer-qa-browser-matrix.json').expectedProviderLinks;
const unpublished = [
  { route: '/get-listed/', status: 200, canonical: `${origin}/get-listed/`, robots: 'noindex, follow' },
  { route: '/methodology/', status: 200, canonical: `${origin}/methodology/`, robots: 'noindex, follow' },
  { route: '/appraiser/__qa_unknown_provider__/', status: 404, canonical: null, robots: 'noindex, nofollow' },
  { route: '/appraiser/amelia-jeffers-auctioneers-appraisers/', status: 410, canonical: null, robots: 'noindex, nofollow' },
  { route: '/appraiser/american-society-of-appraisers-asa/', status: 404, canonical: null, robots: 'noindex, nofollow' },
];
const routes = [
  '/', '/appraiser/', '/location/', '/location/boston/', '/location/baltimore/', '/location/denver/',
  ...focal, '/appraiser/spalding-nix-fine-art/', '/appraiser/a-and-a-art-appraisals-naples-fl/',
  '/appraiser/812-maplewood/', '/appraiser/anne-kelly-lewis/', '/appraiser/appraisals-miami-fl-estate-and-appraisal-services-inc/',
  '/appraiser/manhattan-fine-art-appraisers/',
  '/appraiser/worthwise-art-and-antiques-appraisers/',
  '/appraiser/hollingsworth-fine-a/', '/appraiser/lauren-k-stump/',
  '/appraiser/capital-art-group-art-appraisals-personal-property-appraisals-appraisal-reviews-expert-wit/', '/appraiser/maria-tarrence/',
  '/appraiser/jsk-fine-art-appraisals/', '/appraiser/jennifer-e-salvetti-kulla-ma/',
  ...resources.map((page) => page.path),
  ...unpublished.map((page) => page.route),
];
const relationshipTargets = {
  '/appraiser/hollingsworth-fine-a/': '/appraiser/lauren-k-stump/',
  '/appraiser/lauren-k-stump/': '/appraiser/hollingsworth-fine-a/',
  '/appraiser/capital-art-group-art-appraisals-personal-property-appraisals-appraisal-reviews-expert-wit/': '/appraiser/maria-tarrence/',
  '/appraiser/maria-tarrence/': '/appraiser/capital-art-group-art-appraisals-personal-property-appraisals-appraisal-reviews-expert-wit/',
  '/appraiser/jsk-fine-art-appraisals/': '/appraiser/jennifer-e-salvetti-kulla-ma/',
  '/appraiser/jennifer-e-salvetti-kulla-ma/': '/appraiser/jsk-fine-art-appraisals/',
};
const viewports = [{ width: 1365, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 844 }];
const result = { action: 'art-settled-document-contract', ok: false, testedAt: new Date().toISOString(), http: [], browser: [] };
const docker = (args) => execFileSync('docker', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim();
const container = `art-directory-browser-contract-${process.pid}`;
const socketDir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-directory-browser-'));
let startedContainer = false;
const sessions = [];
let base = options.base;
async function readHttp(url) {
  return new Promise((resolve, reject) => {
    execFile('curl', ['--silent', '--show-error', '--max-time', '20', '--write-out', '\n%{http_code}', url],
      { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }, (error, output) => {
        if (error) return reject(error);
        const end = output.lastIndexOf('\n');
        resolve({ status: Number(output.slice(end + 1)), body: output.slice(0, end) });
      });
  });
}
function persist() {
  if (options.receipt) {
    fs.mkdirSync(path.dirname(options.receipt), { recursive: true });
    fs.writeFileSync(options.receipt, `${JSON.stringify(result, null, 2)}\n`);
  }
}
try {
  if (!base) {
    const image = docker(['inspect', 'art-appraisers-directory', '--format', '{{.Image}}']);
    docker(['run', '--rm', '-d', '--name', container, '-p', '127.0.0.1::8080',
      '-v', `${path.join(repoRoot, 'nginx.conf')}:/etc/nginx/nginx.conf:ro`,
      '-v', `${path.join(repoRoot, 'public_site')}:/usr/share/nginx/html:ro`, image]);
    startedContainer = true;
    const port = docker(['port', container, '8080/tcp']).match(/:(\d+)\s*$/)?.[1];
    if (!port) throw new Error('Unable to resolve isolated nginx port');
    base = `http://127.0.0.1:${port}`;
    result.candidate = { publicDir: path.join(repoRoot, 'public_site'), nginx: path.join(repoRoot, 'nginx.conf'), image };
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        if ((await readHttp(`${base}/health`)).status === 200) { ready = true; break; }
      } catch { /* The isolated container can still be starting. */ }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!ready) throw new Error('Isolated nginx candidate did not become ready');
  }
  result.base = base;
  const browserOrigin = new URL(base);
  if (['127.0.0.1', 'localhost'].includes(browserOrigin.hostname)) {
    // Chrome resolves *.localhost to loopback. The existing tracker derives its
    // directory owner from the Art hostname prefix, not the canonical tag.
    browserOrigin.hostname = 'art-appraisers-directory.localhost';
  }
  const browserBase = browserOrigin.origin;
  result.browserBase = browserBase;
  const sitemapResponse = await readHttp(`${base}/sitemap.xml`);
  if (sitemapResponse.status !== 200) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
  const sitemapUrls = [...sitemapResponse.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  result.sitemapCount = assertReviewedInventory({ providers, cities, resources, sitemapUrls });
  const initial = new Map();
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < sitemapUrls.length) {
      const url = sitemapUrls[cursor++];
      const route = new URL(url).pathname;
      const response = await readHttp(`${base}${route}`);
      if (response.status !== 200) throw new Error(`${route}: HTTP ${response.status}`);
      const dom = new JSDOM(response.body, { url });
      try {
        const snapshot = captureDocument(dom.window.document, origin);
        assertDocumentParity(snapshot, snapshot, url);
        const provider = providers.find((record) => ['verified', 'limited'].includes(record.publicationStatus) && route === `/appraiser/${record.slug}/`);
        if (provider) {
          assertProviderEvidence(snapshot, provider, url);
          assertProviderHandoff(captureProviderHandoff(dom.window.document, origin), provider);
        }
        if (routes.includes(route)) initial.set(route, snapshot);
        result.http.push({ route, status: response.status, canonical: snapshot.canonicals[0] });
      } finally { dom.window.close(); }
    }
  }));
  for (const policy of unpublished) {
    if (sitemapUrls.includes(`${origin}${policy.route}`)) throw new Error(`Unpublished route leaked into sitemap: ${policy.route}`);
    const response = await readHttp(`${base}${policy.route}`);
    if (response.status !== policy.status) throw new Error(`${policy.route}: HTTP ${response.status}, expected ${policy.status}`);
    const dom = new JSDOM(response.body, { url: `${origin}${policy.route}` });
    try {
      const snapshot = captureDocument(dom.window.document, origin);
      assertUnpublishedDocumentParity(snapshot, snapshot, { ...policy, url: `${origin}${policy.route}` });
      initial.set(policy.route, snapshot);
      result.http.push({ route: policy.route, status: response.status, unpublished: true, canonical: snapshot.canonicals[0] || null });
    } finally { dom.window.close(); }
  }
  for (const route of routes) if (!initial.has(route)) throw new Error(`Required browser route omitted: ${route}`);
  for (const javascript of [true, false]) {
    const session = `art-parity-${process.pid}-${javascript ? 'js' : 'nojs'}`;
    const args = javascript ? '--no-sandbox' : '--no-sandbox,--blink-settings=scriptEnabled=false';
    const makeRun = (name) => (...command) => {
      let raw;
      try { raw = execFileSync('agent-browser', ['--session', name, '--json', ...command], {
        encoding: 'utf8', timeout: 45000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, AGENT_BROWSER_SOCKET_DIR: socketDir, AGENT_BROWSER_ARGS: args },
      }); } catch (error) {
        throw new Error(`agent-browser ${command[0]}: ${String(error.stdout || error.stderr || error.message).trim()}`);
      }
      const output = JSON.parse(raw);
      if (!output.success) throw new Error(output.error || raw);
      return output.data;
    };
    const run = makeRun(session);
    // Third-party pages have their own scripts and global CLI error queue. A
    // separate owned session prevents their late errors contaminating Art/apex.
    const officialRun = makeRun(`art-official-${process.pid}-${javascript ? 'js' : 'nojs'}`);
    sessions.push(run, officialRun);
    run('open', 'data:text/html,<h1>Script execution probe</h1><script>window.__qaScriptsRan=true</script>');
    const scriptsRan = run('eval', 'window.__qaScriptsRan===true').result;
    if (scriptsRan !== javascript) throw new Error(`JavaScript mode probe failed: ${javascript}`);
    for (const viewport of viewports) {
      run('set', 'viewport', String(viewport.width), String(viewport.height));
      for (const route of routes) {
        const row = { route, javascript, viewport };
        try {
          const aliasEntry = viewport.width === 320 ? {
            '/': '/index.html',
            '/location/boston/': '/location/boston',
            '/appraiser/manhattan-fine-art-appraisers/': '/appraiser/manhattan-fine-art-appraisers',
            '/compare-art-appraisers/': '/compare-art-appraisers/index.html',
            '/art-appraisal-inquiry-worksheet/': '/art-appraisal-inquiry-worksheet/index.html',
          }[route] : null;
          const entryQuery = aliasEntry
            ? '?appraisily_qa=1&journey_id=qa-canonical%2B20261007&redirect_probe=one%20two&repeat=one&repeat=two'
            : '?appraisily_qa=1';
          run('open', `${browserBase}${aliasEntry || route}${entryQuery}`);
          run('wait', '1500');
          if (aliasEntry) {
            const reached = new URL(run('eval', 'location.href').result);
            if (reached.origin !== browserBase || reached.pathname !== route || reached.search !== entryQuery) {
              throw new Error(`Native alias navigation lost canonical path or query: ${reached.href}`);
            }
            row.aliasNavigation = { from: aliasEntry, reached: reached.href, rawQueryPreserved: true };
          }
          row.document = run('eval', `(${captureDocument.toString()})(document, ${JSON.stringify(origin)})`).result;
          const policy = unpublished.find((page) => page.route === route);
          if (policy) assertUnpublishedDocumentParity(initial.get(route), row.document, { ...policy, url: `${origin}${route}` });
          else assertDocumentParity(initial.get(route), row.document, `${origin}${route}`);
          if (javascript) assertHandoffAttribution(initial.get(route), row.document, `${origin}${route}`);
          const provider = providers.find((record) => ['verified', 'limited'].includes(record.publicationStatus) && route === `/appraiser/${record.slug}/`);
          if (provider) {
            assertProviderEvidence(row.document, provider, `${origin}${route}`);
            row.providerHandoff = run('eval', `(${captureProviderHandoff.toString()})(document, ${JSON.stringify(origin)})`).result;
            assertProviderHandoff(row.providerHandoff, provider);
            if (row.providerHandoff.layout) {
              row.providerColumns = run('eval', '(()=>{const grid=document.querySelector("[data-directory-provider-layout]"),summary=grid.children[0].getBoundingClientRect(),contact=grid.children[1].getBoundingClientRect();return{summary:{top:summary.top,bottom:summary.bottom,left:summary.left,right:summary.right},contact:{top:contact.top,bottom:contact.bottom,left:contact.left,right:contact.right}}})()').result;
              if (viewport.width < 768 && row.providerColumns.contact.top < row.providerColumns.summary.bottom - 1) throw new Error(`${route}: mobile contact/offers precede provider facts`);
              if (viewport.width >= 768 && row.providerColumns.contact.right > row.providerColumns.summary.left + 1) throw new Error(`${route}: desktop sidebar arrangement changed`);
            }
          }
          row.layout = run('eval', '({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1Visible:!!document.querySelector("h1")?.getClientRects().length,qaMarker:sessionStorage.getItem("appraisily_qa_marker")})').result;
          if (row.layout.scrollWidth > viewport.width + 1 || !row.layout.h1Visible) throw new Error(`${route}: invalid layout ${JSON.stringify(row.layout)}`);
          if (javascript && row.layout.qaMarker !== 'synthetic_browser') throw new Error(`${route}: synthetic QA marker missing`);
          row.errors = run('errors', '--clear').errors;
          if (row.errors?.length) throw new Error(`${route}: browser errors ${JSON.stringify(row.errors)}`);
          if (options.artifactDir && (focal.includes(route) || provider?.fieldEvidence || provider?.publicationStatus === 'limited' || route === '/location/denver/' || route === '/' || unpublished.some((page) => page.route === route))) {
            fs.mkdirSync(options.artifactDir, { recursive: true });
            const filename = `${javascript ? 'js' : 'nojs'}-${viewport.width}-${route.replace(/[^a-z0-9-]/g, '_')}.png`;
            run('screenshot', path.join(options.artifactDir, filename));
            row.screenshot = filename;
          }
          if (route === '/appraiser/812-maplewood/') {
            const officialSelector = '[data-gtm-cta=website][data-gtm-surface=contact_card]';
            officialRun('set', 'viewport', String(viewport.width), String(viewport.height));
            officialRun('open', 'data:text/html,<h1>Script execution probe</h1><script>window.__qaScriptsRan=true</script>');
            if (officialRun('eval', 'window.__qaScriptsRan===true').result !== javascript) throw new Error(`Official-link JavaScript mode probe failed: ${javascript}`);
            const officialEntry = `${browserBase}${route}?appraisily_qa=1`;
            let navigationTimeout = null;
            try { officialRun('open', officialEntry); }
            catch (error) {
              if (!/Operation timed out/.test(error.message)) throw error;
              navigationTimeout = error.message;
            }
            // open waits on external subresources. A timeout is not a page
            // pass: independently require the exact URL, parsed document,
            // original facts/metadata/native links and (when enabled) QA owner.
            officialRun('wait', '--fn', `location.href === ${JSON.stringify(officialEntry)} && document.readyState !== "loading" && document.querySelector("h1")?.textContent === "812 Maplewood"`);
            if (javascript) officialRun('wait', '--fn', 'sessionStorage.getItem("appraisily_qa_marker") === "synthetic_browser"');
            officialRun('wait', '1500');
            assertDocumentParity(initial.get(route), officialRun('eval', `(${captureDocument.toString()})(document, ${JSON.stringify(origin)})`).result, `${origin}${route}`);
            assertProviderHandoff(officialRun('eval', `(${captureProviderHandoff.toString()})(document, ${JSON.stringify(origin)})`).result, provider);
            row.officialProfileOpen = {url: officialEntry, navigationTimeout, exactDocumentAndQAReadinessProven: true};
            const originalTabs = officialRun('tab', 'list').tabs;
            const directoryTab = originalTabs.find((tab) => tab.active).tabId;
            officialRun('scrollintoview', officialSelector);
            officialRun('click', officialSelector);
            let officialTab;
            for (let attempt = 0; attempt < 20 && !officialTab; attempt += 1) {
              officialTab = officialRun('tab', 'list').tabs.find((tab) => !originalTabs.some((old) => old.tabId === tab.tabId));
              if (!officialTab) officialRun('wait', '200');
            }
            if (!officialTab) throw new Error('Official website native link did not open its provider tab');
            try {
              officialRun('tab', officialTab.tabId);
              officialRun('wait', '--url', '**812maplewood.com/art-advisory-services**');
              officialRun('wait', 'h1');
              row.officialNavigation = officialRun('eval', '({url:location.href,title:document.title,h1:document.querySelector("h1")?.textContent})').result;
              if (row.officialNavigation.url !== provider.sourceUrl || !row.officialNavigation.title.includes('812 Maplewood') || !row.officialNavigation.h1) throw new Error('Official website native link did not reach the provider services page');
            } finally {
              if (row.officialNavigation) row.officialNavigation.errors = officialRun('errors', '--clear').errors;
              officialRun('tab', 'close', officialTab.tabId);
              officialRun('tab', directoryTab);
              officialRun('close');
            }
            // Both a bare sidebar link and a campaign-tagged router link must
            // survive actual clicks. Do not submit the destination form.
            row.appraisilyNavigation = [];
            const selectors = ['[data-gtm-cta=request_appraisal][data-gtm-surface=contact_sidebar]', ...(javascript ? ['[data-cta-kind=signed_report]'] : [])];
            for (const selector of selectors) {
              const href = run('eval', `document.querySelector(${JSON.stringify(selector)}).href`).result;
              run('scrollintoview', selector);
              run('click', selector);
              run('wait', '--url', '**appraisily.com/start**');
              if (javascript) {
                run('wait', 'h1[data-start-intent-summary]');
                run('wait', '--fn', `localStorage.getItem("appraisily_analytics_anonymous_id") === ${JSON.stringify(new URL(href).searchParams.get('journey_id'))} && sessionStorage.getItem("appraisily_qa_marker") === "synthetic_browser"`);
              }
              const reached = run('eval', '({url:location.href,h1:document.querySelector("h1")?.innerText,qa:sessionStorage.getItem("appraisily_qa_marker"),anonymousId:localStorage.getItem("appraisily_analytics_anonymous_id")})').result;
              reached.errors = run('errors', '--clear').errors;
              if (reached.errors?.length) throw new Error(`Native appraisal form errors: ${JSON.stringify(reached.errors)}`);
              row.appraisilyNavigation.push({selector, href, reached, identityAdopted: false});
              assertOwnedHandoffArrival(href, reached, {javascript});
              row.appraisilyNavigation.at(-1).identityAdopted = javascript;
              run('open', `${browserBase}${route}?appraisily_qa=1`);
              if (javascript) run('wait', '1500');
            }
          }
          if (javascript && viewport.width === 390 && route === '/appraiser/') {
            run('fill', '[data-browse-query]', 'zzzz-no-such-directory-record');
            const shown = () => run('eval', 'document.querySelectorAll("[data-browse-item]:not([hidden])").length').result;
            if (shown() !== 0) throw new Error('Real-browser empty filter did not hide listings');
            run('click', '[data-browse-reset]');
            const total = providers.filter((record) => ['verified', 'limited'].includes(record.publicationStatus)).length;
            if (shown() !== total) throw new Error('Real-browser reset did not restore the complete roster');
            run('fill', '[data-browse-query]', 'Heidi Vaughan');
            if (shown() !== 1) throw new Error('Real-browser provider-name filter failed');
            row.filterInteraction = { empty: 0, reset: total, name: 1 };
            run('click', '[data-browse-reset]');
          }
          if (viewport.width === 320 && relationshipTargets[route]) {
            const target = relationshipTargets[route];
            const linkedProvider = providers.find(record => target === `/appraiser/${record.slug}/`);
            const href = run('eval', 'document.querySelector("[data-provider-relationship-link]")?.getAttribute("href")').result;
            if (href !== target) throw new Error('Company/person native relationship target changed');
            run('scrollintoview', '[data-provider-relationship-link]');
            run('click', '[data-provider-relationship-link]');
            run('wait', '--url', `**${target}**`);
            run('wait', '1500');
            const reached = run('eval', `(${captureDocument.toString()})(document, ${JSON.stringify(origin)})`).result;
            assertDocumentParity(initial.get(target), reached, `${origin}${target}`);
            if (reached.h1[0] !== linkedProvider.name) throw new Error('Native company/person link reached the wrong identity');
            row.relationshipNavigation = { target, h1: reached.h1[0], entityType: reached.businesses[0]['@type'], exactDocumentParity: true };
          }
          if (javascript && viewport.width === 390 && route === '/art-appraisal-inquiry-worksheet/') {
            run('eval', 'window.__qaPrintCalls=0;window.print=()=>{window.__qaPrintCalls+=1}');
            run('click', '[data-print-worksheet]');
            const printed = run('eval', '({calls:window.__qaPrintCalls,privateInputs:document.querySelectorAll("form,input,textarea").length})').result;
            if (printed.calls !== 1 || printed.privateInputs !== 0) throw new Error('Worksheet print/privacy interaction failed');
            row.printInteraction = printed;
          }
          if (viewport.width === 320 && route === '/location/denver/') {
            const regional = run('eval', '({text:document.querySelector("[data-reviewed-regional-option]")?.textContent,official:document.querySelector("[data-reviewed-regional-option] [data-cta-kind=provider_contact]")?.getAttribute("href")})').result;
            if (!regional.text?.includes('Colorado Front Range') || !regional.text.includes('Denver office is not confirmed') || regional.official !== 'https://worthwiseappraisers.com/art-appraisal-services-denver/') {
              throw new Error('Denver regional option lost its scope, office limitation or official source');
            }
            run('eval', 'document.querySelector("[data-reviewed-regional-option] [data-cta-kind=provider_profile]").scrollIntoView({block:"center"})');
            run('click', '[data-reviewed-regional-option] [data-cta-kind=provider_profile]');
            run('wait', '--url', '**/appraiser/worthwise-art-and-antiques-appraisers/**');
            const arrived = run('eval', '({url:location.href,h1:document.querySelector("h1")?.textContent,about:document.querySelector("[data-provider-specific-about]")?.textContent})').result;
            if (new URL(arrived.url).pathname !== '/appraiser/worthwise-art-and-antiques-appraisers/' || arrived.h1 !== 'WorthWise Art and Antiques Appraisers' || !arrived.about?.includes('Colorado Front Range')) {
              throw new Error('Denver native provider-profile link did not arrive at the expected regional profile');
            }
            row.regionalProfileNavigation = { ...arrived, officialSource: regional.official, officeLimitationVisible: true };
          }
          if (javascript && viewport.width === 320 && route === '/get-listed/') {
            const contact = run('eval', 'document.querySelector("a.cta")?.href').result;
            const target = new URL(contact);
            if (target.origin !== 'https://appraisily.com' || target.pathname !== '/contact' || target.searchParams.get('source') !== 'art_directory_listing') {
              throw new Error('Native correction contact destination changed');
            }
            if (target.searchParams.get('seo_site') !== 'art_directory' || target.searchParams.get('ref_path') !== route || !target.searchParams.get('journey_id') || target.searchParams.get('appraisily_synthetic') !== 'synthetic_browser') {
              throw new Error('Native correction contact attribution was not preserved');
            }
            // This CLI's coordinate click does not scroll a below-fold link into
            // view. Scroll normally before the real click; do not replace it with
            // programmatic navigation or assume a timed delay proves arrival.
            run('eval', 'document.querySelector("a.cta").scrollIntoView({block:"center"})');
            run('click', 'a.cta');
            run('wait', '--url', '**appraisily.com/contact**');
            run('wait', '--text', 'Contact Appraisily');
            run('wait', '--fn', `localStorage.getItem("appraisily_analytics_anonymous_id") === ${JSON.stringify(target.searchParams.get('journey_id'))} && sessionStorage.getItem("appraisily_qa_marker") === "synthetic_browser"`);
            const reached = run('eval', '({url:location.href,h1:document.querySelector("h1")?.textContent,qa:sessionStorage.getItem("appraisily_qa_marker"),anonymousId:localStorage.getItem("appraisily_analytics_anonymous_id")})').result;
            const destination = new URL(reached.url);
            if (destination.origin !== target.origin || destination.pathname !== target.pathname || reached.h1 !== 'Contact Appraisily' || reached.qa !== 'synthetic_browser') {
              throw new Error(`Native correction navigation failed: ${JSON.stringify(reached)}`);
            }
            for (const [key, value] of target.searchParams) {
              if (key === 'journey_id') {
                if (reached.anonymousId !== value) throw new Error('Native correction navigation lost adopted journey identity');
              } else if (destination.searchParams.get(key) !== value) throw new Error(`Native correction navigation lost ${key}`);
            }
            row.contactNavigation = { destination: `${destination.origin}${destination.pathname}`, h1: reached.h1, qa: reached.qa, adoptedJourneyIdentity: true };
          }
          row.ok = true;
        } catch (error) { row.error = error.message; throw error; }
        finally { result.browser.push(row); persist(); }
      }
    }
    run('close');
    officialRun('close');
  }
  result.ok = true;
} catch (error) {
  result.error = error.stack || error.message;
  process.exitCode = 1;
} finally {
  for (const run of sessions) { try { run('close'); } catch { /* Only this run's sessions. */ } }
  if (startedContainer) { try { docker(['rm', '-f', container]); } catch { /* --rm may already have exited. */ } }
  fs.rmSync(socketDir, { recursive: true, force: true });
  persist();
}
console.log(JSON.stringify(result, null, 2));
