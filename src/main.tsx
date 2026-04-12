import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { router } from './router';
import { SITE_URL } from './config/site';
import './index.css';
import './styles/animations.css';
import { tagAiAssistantReferrer } from './utils/aiAttribution';
import { captureAttributionFromQueryToCookie } from './utils/startAttribution';

// Ensure we always serve the canonical origin (no stray ports)
if (typeof window !== 'undefined') {
  try {
    const canonicalOrigin = new URL(SITE_URL);
    const isSameHost = window.location.hostname === canonicalOrigin.hostname;
    const hasUnexpectedPort =
      window.location.port &&
      window.location.port !== canonicalOrigin.port &&
      window.location.port !== '443' &&
      window.location.port !== '80';

    if (isSameHost && hasUnexpectedPort) {
      const target = `${canonicalOrigin.protocol}//${canonicalOrigin.hostname}${
        canonicalOrigin.port ? `:${canonicalOrigin.port}` : ''
      }${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(target);
    }
  } catch (error) {
    console.error('Failed to enforce canonical origin', error);
  }
}

// Tag AI assistant referrals as early as possible
try {
  tagAiAssistantReferrer();
  captureAttributionFromQueryToCookie();
} catch (error) {
  console.error('Failed to tag AI assistant referrer', error);
}

// Render client-side only. Hydration has caused React invariant errors in production
// when the server pre-rendered HTML does not match the client bundle.
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Root element not found! DOM structure may be incorrect.');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <HelmetProvider>
          <RouterProvider router={router} />
        </HelmetProvider>
      </StrictMode>
    );
  } catch (error: unknown) {
    console.error('Application initialization failed:', error);

    // Show error UI to user (use textContent to avoid XSS)
    const container = document.createElement('div');
    container.style.cssText = 'padding: 20px; text-align: center; font-family: sans-serif;';
    const heading = document.createElement('h2');
    heading.textContent = 'Something went wrong';
    const para = document.createElement('p');
    para.textContent = 'The application failed to initialize. Please try refreshing the page.';
    const pre = document.createElement('pre');
    pre.style.cssText = 'text-align: left; background: #f5f5f5; padding: 10px; overflow: auto; max-width: 100%; font-size: 12px;';
    pre.textContent = error instanceof Error ? error.message : 'Unknown error';
    container.appendChild(heading);
    container.appendChild(para);
    container.appendChild(pre);
    rootElement.replaceChildren(container);
  }
}
