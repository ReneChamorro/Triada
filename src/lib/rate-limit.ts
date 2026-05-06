import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Config ────────────────────────────────────────────────────────────────
// Upstash Redis is used in production (serverless-safe, shared across all
// invocations). Falls back to a local in-memory store for local development
// when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set.

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

export const RATE_LIMITS = {
  login:          { limit: 5,   windowSeconds: 15 * 60 } as RateLimitConfig,
  register:       { limit: 3,   windowSeconds: 60 * 60 } as RateLimitConfig,
  paymentSubmit:  { limit: 5,   windowSeconds: 60 * 60 } as RateLimitConfig,
  grantAccess:    { limit: 30,  windowSeconds: 60 * 60 } as RateLimitConfig,
  accountDelete:  { limit: 3,   windowSeconds: 24 * 60 * 60 } as RateLimitConfig,
  signout:        { limit: 20,  windowSeconds: 60 * 60 } as RateLimitConfig,
  admin:          { limit: 100, windowSeconds: 60 * 60 } as RateLimitConfig,
} as const

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ─── Upstash limiter cache (one Ratelimit instance per config key) ──────────
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  const cacheKey = `${config.limit}:${config.windowSeconds}`
  if (!upstashLimiters.has(cacheKey)) {
    upstashLimiters.set(
      cacheKey,
      new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
        analytics: false,
      })
    )
  }
  return upstashLimiters.get(cacheKey)!
}

// ─── In-memory fallback (dev only) ─────────────────────────────────────────
interface RateLimitEntry { count: number; resetAt: number }
const devStore = new Map<string, RateLimitEntry>()

function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = devStore.get(key)
  const windowMs = config.windowSeconds * 1000

  if (!entry || now > entry.resetAt) {
    devStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: config.limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

// ─── Public API ────────────────────────────────────────────────────────────
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!hasUpstash) {
    return checkInMemory(key, config)
  }

  try {
    const limiter = getUpstashLimiter(config)
    const { success, remaining, reset } = await limiter.limit(key)
    return {
      allowed: success,
      remaining,
      resetAt: reset,
    }
  } catch (error) {
    // Fallback to in-memory if Upstash fails (network issues, etc.)
    console.warn('[RateLimit] Upstash error, falling back to in-memory:', error)
    return checkInMemory(key, config)
  }
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
