import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ContentFeedback } from '../../src/components/ContentFeedback';
import { Footer } from '../../src/components/Footer';
import Navbar from '../../src/components/Navbar';
import { getPrimaryCtaUrl } from '../../src/config/site';
import { derivePageContext, toPublicPagePath } from '../../src/utils/analytics';

type CapturedEvent = {
  event: string;
  properties?: Record<string, unknown>;
};

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const setInputValue = (input: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  const prototype =
    input instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
};

function mount(element: React.ReactNode): { container: HTMLElement; root: Root } {
  const container = document.createElement('div');
  document.body.replaceChildren(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return { container, root };
}

async function testFeedbackSuccess() {
  const events: CapturedEvent[] = [];
  const { container, root } = mount(
    <MemoryRouter initialEntries={['/location/boston']}>
      <ContentFeedback
        captureEvent={(event, properties) => events.push({ event, properties })}
      />
    </MemoryRouter>
  );

  const textarea = container.querySelector('textarea');
  const yesButton = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Yes'
  );
  assert(textarea instanceof window.HTMLTextAreaElement);
  assert(yesButton instanceof window.HTMLButtonElement);
  assert.match(yesButton.className, /focus-visible:ring-2/);
  assert.equal(textarea.disabled, true);

  act(() => yesButton.click());
  assert.equal(textarea.disabled, false);
  assert.equal(events[0]?.event, 'seo_content_feedback_vote');
  assert.equal(events[0]?.properties?.page_type, 'location');

  act(() => setInputValue(textarea, 'Email me at person@example.com or 212-555-1212.'));
  const form = container.querySelector('form');
  assert(form instanceof window.HTMLFormElement);
  const submitButton = form.querySelector('button[type="submit"]');
  assert(submitButton instanceof window.HTMLButtonElement);
  assert.match(submitButton.className, /focus-visible:ring-2/);
  act(() => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  await flush();

  assert.match(container.textContent || '', /Thanks — this helps us improve the directory/);
  assert.equal(events[1]?.event, 'seo_content_feedback_submitted');
  assert.equal(
    events[1]?.properties?.comment,
    'Email me at [redacted-email] or [redacted-phone].'
  );
  act(() => root.unmount());
}

async function testFeedbackFailure() {
  const { container, root } = mount(
    <MemoryRouter>
      <ContentFeedback
        captureEvent={(event) => {
          if (event === 'seo_content_feedback_submitted') {
            throw new Error('forced test failure');
          }
        }}
      />
    </MemoryRouter>
  );

  const noButton = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'No'
  );
  assert(noButton instanceof window.HTMLButtonElement);
  assert.match(noButton.className, /focus-visible:ring-2/);
  act(() => noButton.click());
  const form = container.querySelector('form');
  assert(form instanceof window.HTMLFormElement);
  act(() => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  await flush();

  const alert = container.querySelector('[role="alert"]');
  assert.match(alert?.textContent || '', /couldn’t send that feedback/i);
  act(() => root.unmount());
}

async function testMobileMenuEscapeAndFocusReturn() {
  const { container, root } = mount(
    <MemoryRouter initialEntries={['/location/']}>
      <Navbar />
    </MemoryRouter>
  );
  const menuButton = container.querySelector(
    'button[aria-label="Open main menu"]'
  );
  assert(menuButton instanceof window.HTMLButtonElement);

  act(() => menuButton.click());
  assert.equal(menuButton.getAttribute('aria-expanded'), 'true');
  assert(container.querySelector('button[aria-label="Close menu"]'));
  const mobileHrefs = [...container.querySelectorAll<HTMLAnchorElement>('a')]
    .map((anchor) => anchor.getAttribute('href'))
    .filter((href): href is string => Boolean(href));
  for (const href of ['/appraiser/', '/location/', '/methodology/', '/get-listed/']) {
    assert(mobileHrefs.includes(href));
  }
  assert.equal(
    mobileHrefs.some((href) => /^\/location\/[^/]+\/?$/.test(href)),
    false
  );

  act(() => {
    window.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      })
    );
  });

  assert.equal(menuButton.getAttribute('aria-expanded'), 'false');
  assert.equal(container.querySelector('button[aria-label="Close menu"]'), null);
  assert.equal(document.activeElement, menuButton);
  act(() => root.unmount());
}

function testFooterInternalLinksAndLegalUniqueness() {
  const { container, root } = mount(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
  const hrefs = [...container.querySelectorAll<HTMLAnchorElement>('a')].map(
    (anchor) => anchor.getAttribute('href')
  );
  assert(hrefs.includes('/methodology/'));
  assert(hrefs.includes('/get-listed/'));
  assert.equal(
    [...container.querySelectorAll('a')].filter(
      (anchor) => anchor.textContent === 'Terms of Service'
    ).length,
    1
  );
  act(() => root.unmount());
}

function testSuppressedProfileContextIsGeneric() {
  window.history.replaceState({}, '', '/appraiser/alicia-e-weaver/');

  const suppressedContext = derivePageContext(window.location.pathname);
  assert.equal(suppressedContext.pageType, 'appraiser_unavailable');
  assert.equal(suppressedContext.appraiserSlug, undefined);
  assert.equal(toPublicPagePath(window.location.pathname), '/appraiser/');

  const suppressedCta = new URL(getPrimaryCtaUrl());
  assert.equal(suppressedCta.searchParams.get('ref_path'), '/appraiser/');
  assert.equal(
    suppressedCta.searchParams.get('seo_page_type'),
    'directory_profile_unavailable'
  );
  assert.equal(suppressedCta.searchParams.has('appraiser_slug'), false);
  assert.equal(suppressedCta.toString().includes('alicia-e-weaver'), false);

  window.history.replaceState({}, '', '/appraiser/open-to-the-public/');
  const reviewedContext = derivePageContext(window.location.pathname);
  assert.equal(reviewedContext.pageType, 'appraiser');
  assert.equal(reviewedContext.appraiserSlug, 'open-to-the-public');

  const reviewedCta = new URL(getPrimaryCtaUrl());
  assert.equal(reviewedCta.searchParams.get('appraiser_slug'), 'open-to-the-public');
  assert.equal(
    reviewedCta.searchParams.get('ref_path'),
    '/appraiser/open-to-the-public/'
  );

  window.history.replaceState({}, '', '/');
}

export async function runInteractionTests() {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  await testFeedbackSuccess();
  await testFeedbackFailure();
  await testMobileMenuEscapeAndFocusReturn();
  testFooterInternalLinksAndLegalUniqueness();
  testSuppressedProfileContextIsGeneric();
  console.log(
    '[interaction-contract] PASS feedback success/failure, mobile menu Escape/focus, reviewed-route navigation, controls, telemetry, and suppressed-profile context'
  );
}
