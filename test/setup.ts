import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount React trees between tests so queries don't leak across specs.
afterEach(() => {
  cleanup()
})

/* ─── Browser API stubs ────────────────────────────────────────────────────
   jsdom lacks the APIs that motion/react (useInView, useScroll,
   useReducedMotion) and our scroll listeners rely on. Minimal stubs let
   components render without throwing. */

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, // useReducedMotion → false (animations enabled)
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

class IntersectionObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub)

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

/* ─── Module mocks (applied to every spec) ──────────────────────────────────
   These are stateless/logged-out defaults. A spec that needs a logged-in user
   or seeded data can call vi.mock() locally to override the Supabase client. */

// next/navigation — stub router + path hooks.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// next/link — render a plain anchor.
vi.mock('next/link', async () => {
  const React = (await import('react')).default
  return {
    default: ({ children, href, ...rest }: any) =>
      React.createElement('a', { href: typeof href === 'string' ? href : '#', ...rest }, children),
  }
})

// next/image — render a plain img (strip Next-only props).
vi.mock('next/image', async () => {
  const React = (await import('react')).default
  return {
    default: ({ src, alt = '', fill, priority, ...rest }: any) =>
      React.createElement('img', { src: typeof src === 'string' ? src : '', alt, ...rest }),
  }
})

// @/lib/supabase/client — logged-out client whose queries resolve empty, so
// pages fall back to their hardcoded copy and cards show the guest CTAs.
vi.mock('@/lib/supabase/client', () => {
  const makeQuery = () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      order: () => q,
      limit: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
        resolve({ data: [], error: null }),
    }
    return q
  }
  return {
    createClient: () => ({
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => makeQuery(),
    }),
  }
})
