import * as Sentry from '@sentry/nextjs'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  },
  error: (...args: unknown[]) => {
    if (isDev) {
      console.error(...args)
    } else {
      // Capture first arg as exception if it's an Error, otherwise send as message
      const [first, ...rest] = args
      if (first instanceof Error) {
        Sentry.captureException(first, { extra: { details: rest } })
      } else {
        Sentry.captureMessage(
          typeof first === 'string' ? first : JSON.stringify(first),
          { level: 'error', extra: { details: rest } }
        )
      }
    }
  },
}
