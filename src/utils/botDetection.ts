/**
 * Shared bot detection utility.
 * Used by AnalyticsTracker and PostHog to avoid tracking automated traffic.
 */

type NavigatorWithWebdriver = Navigator & { webdriver?: boolean };

export function isLikelyBot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const nav = window.navigator as NavigatorWithWebdriver;
    const ua = String(nav.userAgent || '');
    if (!ua) return false;
    if (nav.webdriver) return true;
    if (/HeadlessChrome|PhantomJS|Nightmare|Playwright|Puppeteer/i.test(ua)) return true;
    return /(bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora link preview|slackbot|discordbot|telegrambot|whatsapp|pinterest|yandex|baiduspider|duckduckbot|googlebot)/i.test(ua);
  } catch {
    return false;
  }
}
