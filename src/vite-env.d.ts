/// <reference types="vite/client" />

export {};

declare global {
  interface RuntimeEnv {
    GOOGLE_TAG_MANAGER_ID?: string;
    ANALYTICS_CONTROL_PLANE_URL?: string;
    VITE_ANALYTICS_CONTROL_PLANE_URL?: string;
    PUBLIC_ANALYTICS_CONTROL_PLANE_URL?: string;
    POSTHOG_API_KEY?: string;
    POSTHOG_HOST?: string;
    POSTHOG_DEBUG?: string | boolean;
    POSTHOG_AUTOCAPTURE?: string | boolean;
    POSTHOG_CAPTURE_PAGEVIEW?: string | boolean;
    POSTHOG_REPLAY_ENABLED?: string | boolean;
    POSTHOG_REPLAY_SAMPLE_RATE?: string | number;
    POSTHOG_IMPLICIT_CONSENT?: string | boolean;
  }

  interface Window {
    __ENV__?: RuntimeEnv;
    dataLayer?: Record<string, unknown>[];
  }
}
