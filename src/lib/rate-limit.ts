interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 10 * 60 * 1000)

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

export const RATE_LIMITS = {
  login: { limit: 5, windowSeconds: 15 * 60 } as RateLimitConfig,
  register: { limit: 3, windowSeconds: 60 * 60 } as RateLimitConfig,
  paymentSubmit: { limit: 5, windowSeconds: 60 * 60 } as RateLimitConfig,
  admin: { limit: 100, windowSeconds: 60 * 60 } as RateLimitConfig,
} as const

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 })
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 }
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
