import assert from 'node:assert/strict';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { CitySearch } from '../../src/components/CitySearch';
import { ContentFeedback } from '../../src/components/ContentFeedback';
import { Footer } from '../../src/components/Footer';
import Navbar from '../../src/components/Navbar';
import { getPrimaryCtaUrl } from '../../src/config/site';
import { publishedCities } from '../../src/data/publishedCities';
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

function RouteObserver() {
  const location = useLocation();
  return <output data-testid="route">{location.pathname}</output>;
}

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
  assert.equal(textarea.disabled, true);

  act(() => yesButton.click());
  assert.equal(textarea.disabled, false);
  assert.equal(events[0]?.event, 'seo_content_feedback_vote');
  assert.equal(events[0]?.properties?.page_type, 'location');

  act(() => setInputValue(textarea, 'Email me at person@example.com or 212-555-1212.'));
  const form = container.querySelector('form');
  assert(form instanceof window.HTMLFormElement);
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
  act(() => noButton.click());
  const form = container.querySelector('form');
  assert(form instanceof window.HTMLFormElement);
  act(() => form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  await flush();

  const alert = container.querySelector('[role="alert"]');
  assert.match(alert?.textContent || '', /couldn’t send that feedback/i);
  act(() => root.unmount());
}

async function testCitySearchKeyboardAndTelemetry() {
  const events: CapturedEvent[] = [];
  const { container, root } = mount(
    <MemoryRouter>
      <CitySearch
        trackEventHandler={(event, properties) => events.push({ event, properties })}
      />
      <RouteObserver />
    </MemoryRouter>
  );

  const input = container.querySelector('input');
  assert(input instanceof window.HTMLInputElement);
  act(() => setInputValue(input, 'Boston'));
  await flush();
  act(() =>
    input.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
  );
  await flush();

  assert.equal(container.querySelector('[data-testid="route"]')?.textContent, '/location/boston');
  assert.equal(events.at(-1)?.event, 'location_search_select');
  assert.equal(events.at(-1)?.properties?.city_slug, 'boston');
  act(() => root.unmount());
}

async function testCitySearchGeolocationFailureAndMobileControls() {
  const events: CapturedEvent[] = [];
  Object.defineProperty(window.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (
        _success: PositionCallback,
        failure: PositionErrorCallback
      ) => failure({ code: 1, message: 'denied', PERMISSION_DENIED: 1 } as GeolocationPositionError),
    },
  });
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });

  const { container, root } = mount(
    <MemoryRouter>
      <CitySearch
        trackEventHandler={(event, properties) => events.push({ event, properties })}
      />
    </MemoryRouter>
  );
  const locateButton = container.querySelector('button[aria-label="Use my location"]');
  assert(locateButton instanceof window.HTMLButtonElement);
  act(() => locateButton.click());
  await flush();

  assert.match(container.textContent || '', /Location permission denied/);
  assert.deepEqual(
    events.map(({ event }) => event),
    ['search_geolocate_request', 'search_geolocate_error']
  );
  assert.equal(container.querySelector('input')?.className.includes('h-12'), true);
  act(() => root.unmount());
}

async function testCitySearchGeolocationSuccess() {
  const events: CapturedEvent[] = [];
  Object.defineProperty(window.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: {
            latitude: 42.3601,
            longitude: -71.0589,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition),
    },
  });

  const { container, root } = mount(
    <MemoryRouter>
      <CitySearch
        trackEventHandler={(event, properties) => events.push({ event, properties })}
      />
    </MemoryRouter>
  );
  const locateButton = container.querySelector('button[aria-label="Use my location"]');
  assert(locateButton instanceof window.HTMLButtonElement);
  act(() => locateButton.click());
  await flush();

  assert.equal(container.querySelector('input')?.value, 'Boston, Massachusetts');
  assert.match(container.textContent || '', /Location detected/);
  assert.deepEqual(
    events.map(({ event }) => event),
    ['search_geolocate_request', 'search_geolocate_complete']
  );
  assert.equal(events.at(-1)?.properties?.resolved_city, 'boston');
  act(() => root.unmount());
}

async function testCitySearchGeolocationNoCoverage() {
  const events: CapturedEvent[] = [];
  Object.defineProperty(window.navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: {
            latitude: 21.3069,
            longitude: -157.8583,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition),
    },
  });

  const { container, root } = mount(
    <MemoryRouter>
      <CitySearch
        trackEventHandler={(event, properties) => events.push({ event, properties })}
      />
    </MemoryRouter>
  );
  const locateButton = container.querySelector('button[aria-label="Use my location"]');
  assert(locateButton instanceof window.HTMLButtonElement);
  const input = container.querySelector('input');
  assert(input instanceof window.HTMLInputElement);
  act(() => setInputValue(input, 'Boston'));
  await flush();
  act(() => locateButton.click());
  await flush();

  assert.equal(input.value, '');
  assert.match(container.textContent || '', /do not currently list a reviewed location near you/i);
  assert.deepEqual(
    events.map(({ event }) => event),
    ['search_geolocate_request', 'search_geolocate_no_match']
  );
  assert.equal(events.at(-1)?.properties?.coverage_radius_miles, 100);
  assert.equal('lat' in (events.at(-1)?.properties || {}), false);
  assert.equal('lon' in (events.at(-1)?.properties || {}), false);
  act(() => root.unmount());
}

async function testMobileMenuEscapeAndFocusReturn() {
  const { container, root } = mount(
    <MemoryRouter>
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
  const mobileCityHrefs = [...container.querySelectorAll<HTMLAnchorElement>('a')]
    .map((anchor) => anchor.getAttribute('href'))
    .filter(
      (href): href is string =>
        Boolean(href?.startsWith('/location/') && href !== '/location/')
    )
    .sort();
  assert.deepEqual(
    mobileCityHrefs,
    publishedCities.map((city) => `/location/${city.slug}`).sort()
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
  await testCitySearchKeyboardAndTelemetry();
  await testCitySearchGeolocationFailureAndMobileControls();
  await testCitySearchGeolocationSuccess();
  await testCitySearchGeolocationNoCoverage();
  await testMobileMenuEscapeAndFocusReturn();
  testFooterInternalLinksAndLegalUniqueness();
  testSuppressedProfileContextIsGeneric();
  console.log(
    '[interaction-contract] PASS feedback success/failure, keyboard search, geolocation success/no-coverage/failure, mobile menu Escape/focus, controls, telemetry, and suppressed-profile context'
  );
}
