import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  // Capture only errors, not performance traces by default
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
})
