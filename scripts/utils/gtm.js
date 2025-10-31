/**
 * Utilities for working with Google Tag Manager snippets.
 * Centralizes how we resolve the GTM container ID and generate the embed code.
 */

const ENV_KEYS = [
  'GTM_ID',
  'GOOGLE_TAG_MANAGER_ID',
  'DIRECTORY_GTM_ID',
  'VITE_GTM_ID'
];

let cachedGtmId;

/**
 * Resolve the GTM container ID from well-known environment variables.
 * Throws an explicit error if none of the expected variables are present.
 * @returns {string} The GTM container ID to embed.
 */
export function getGtmId() {
  if (cachedGtmId) {
    return cachedGtmId;
  }

  const key = ENV_KEYS.find((envKey) => {
    const value = process.env[envKey];
    return typeof value === 'string' && value.trim().length > 0;
  });

  if (!key) {
    cachedGtmId = 'GTM-PSLHDGM';
    return cachedGtmId;
  }

  cachedGtmId = process.env[key].trim() || 'GTM-PSLHDGM';
  return cachedGtmId;
}

/**
 * Builds the standard GTM script to be injected in the document head.
 * @param {string} [id] - Optional override, defaults to the resolved GTM ID.
 * @returns {string} HTML snippet for the GTM head script.
 */
export function getGtmHeadSnippet(id = getGtmId()) {
  return `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');</script>
<!-- End Google Tag Manager -->`;
}

/**
 * Builds the GTM noscript iframe to be injected immediately after <body>.
 * @param {string} [id] - Optional override, defaults to the resolved GTM ID.
 * @returns {string} HTML snippet for the GTM noscript iframe.
 */
export function getGtmBodySnippet(id = getGtmId()) {
  return `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
}
