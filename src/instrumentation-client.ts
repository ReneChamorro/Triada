// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Auto-reload when a Next.js chunk fails to load after a new deployment
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Loading chunk') || event.message?.includes('ChunkLoadError')) {
      window.location.reload()
    }
  })
}

Sentry.init({
  dsn: "https://5afa2fda1e7ce8267467b75370ed26f4@o4511293412081664.ingest.us.sentry.io/4511293414113280",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  beforeSend(event) {
    // Don't send ChunkLoadErrors to Sentry — they're expected after deployments
    if (event.exception?.values?.some(e => e.type === 'ChunkLoadError')) {
      return null
    }
    return event
  },

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
