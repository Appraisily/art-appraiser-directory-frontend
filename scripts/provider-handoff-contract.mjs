import assert from 'node:assert/strict';

// DOM-only so the same contract can check initial HTML and agent-browser states.
export function captureProviderHandoff(document, origin) {
  const compact = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const layout = document.querySelector('[data-directory-provider-layout]');
  const h1 = document.querySelector('h1');
  const links = [...document.querySelectorAll('a[href]')].map((node) => {
    const url = new URL(node.getAttribute('href'), origin);
    return {
      text: compact(node.textContent), href: url.href,
      ownedAction: ['appraisily.com', 'www.appraisily.com'].includes(url.hostname) && ['/start', '/screener'].includes(url.pathname),
      official: node.getAttribute('data-gtm-cta') === 'website',
      globalNavigation: Boolean(node.closest('header')),
      afterHeading: Boolean(h1 && (h1.compareDocumentPosition(node) & 4)),
    };
  });
  return {
    links,
    h1: compact(h1?.textContent),
    status: document.querySelector('[data-provider-publication-status]')?.getAttribute('data-provider-publication-status'),
    correction: [...document.querySelectorAll('a[href]')].some((node) => node.hasAttribute('data-provider-correction-link') || /correct|report.*listing/i.test(node.textContent)),
    layout: layout ? {
      columns: layout.children.length,
      firstContainsHeading: Boolean(layout.firstElementChild?.contains(h1)),
      contactSecond: layout.children[1]?.hasAttribute('data-directory-provider-contact'),
      stylesheet: Boolean(document.querySelector('link[href="/assets/directory-provider-handoff-20261007.css"]')),
    } : null,
  };
}

export function assertProviderHandoff(snapshot, provider) {
  assert.ok(snapshot.h1, `${provider.slug}: provider heading missing`);
  assert.equal(snapshot.status, provider.publicationStatus, `${provider.slug}: listing status changed`);
  assert.ok(snapshot.links.some((link) => link.official && link.href === new URL(provider.sourceUrl).href), `${provider.slug}: official native website link missing`);
  for (const link of snapshot.links.filter((item) => item.ownedAction)) {
    assert.match(link.text, /Appraisily/i, `${provider.slug}: ambiguous Appraisily action: ${link.text}`);
  }
  if (provider.publicationStatus === 'limited' || snapshot.layout) {
    assert.ok(snapshot.layout, `${provider.slug}: provider-first layout missing`);
    assert.equal(snapshot.layout.columns, 2, `${provider.slug}: unexpected profile columns`);
    assert.equal(snapshot.layout.firstContainsHeading, true, `${provider.slug}: provider facts must precede contact/offers in DOM`);
    assert.equal(snapshot.layout.contactSecond, true, `${provider.slug}: official contact sidebar missing`);
    assert.equal(snapshot.layout.stylesheet, true, `${provider.slug}: desktop column contract missing`);
    assert.ok(snapshot.links.filter((link) => link.ownedAction && !link.globalNavigation).every((link) => link.afterHeading), `${provider.slug}: provider offer precedes its heading`);
  }
}

export function assertOwnedHandoffArrival(href, reached, { javascript }) {
  const target = new URL(href);
  const destination = new URL(reached.url);
  assert.equal(destination.origin, target.origin, 'Native appraisal navigation changed origin');
  assert.equal(destination.pathname, target.pathname, 'Native appraisal navigation changed path');
  for (const [key, value] of target.searchParams) {
    // Main-page adopts the journey identity, then removes it from stored/public
    // URLs. Test the adopted identity, not persistence of a sensitive URL value.
    if (javascript && key === 'journey_id') {
      assert.equal(reached.anonymousId, value, 'Native appraisal navigation lost journey identity');
      if (destination.searchParams.has(key)) assert.equal(destination.searchParams.get(key), value);
    } else {
      assert.equal(destination.searchParams.get(key), value, `Native appraisal navigation lost ${key}`);
    }
  }
  if (javascript) {
    assert.ok(target.searchParams.get('journey_id'), 'Native appraisal link lacks journey identity');
    assert.equal(reached.qa, 'synthetic_browser', 'Native appraisal navigation lost synthetic QA marker');
    assert.match(reached.h1, /Start your appraisal|Order (?:your signed|an online signed) appraisal/i, 'Native appraisal form did not render');
  }
}
