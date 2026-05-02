import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Known hashes for Google Identity Services inline scripts.
// If Google updates their library and new hashes appear in browser CSP errors, add them here.
const GOOGLE_INLINE_HASHES = [
  "'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo='",
  "'sha256-/5wIVVKTDSYx7PIpmNCMAo1ZNW4Gsep34uhnegMY0ho='",
  "'sha256-ri8UEtrJ2+887h0O4qfsjMwmjlWcGqtz7+ciAYHsmvE='",
  "'sha256-0jxqS+5zMUBtYp0TX8A2eOow5Dh/yGAHx+PEZu72VwA='",
  "'sha256-423tk2n/XRTY0474poXMhi7uZGMyCcM2LcV8i7QHoeA='",
  "'sha256-0jehuMSZMVl5UFN83FAi7dJBdKypslLTW/Sw49Gh4/Q='",
  "'sha256-Snw5Phxis5HbQnuCL4qX1OuWEzIUiM7TJW0k1fLhuYo='",
  "'sha256-WE+5yY01UbW9LX1I6LnhK5a7e8Uiq5KJGEmy9jcy3kM='",
]

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' is intentionally omitted: it disables host-based allowlisting,
    // which breaks Google OAuth scripts from accounts.google.com.
    // The nonce protects our own scripts; Google's known inline scripts are covered by hashes.
    `script-src 'self' 'nonce-${nonce}' https://accounts.google.com https://apis.google.com ${GOOGLE_INLINE_HASHES.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://ujolhgcuruujuzccslot.supabase.co https://*.googleusercontent.com https://*.ytimg.com https://image.mux.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mux.com https://direct-uploads.oci-us-phoenix-1-vop1.production.mux.com https://api.mux.com https://accounts.google.com https://ve.dolarapi.com",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://accounts.google.com",
    "media-src 'self' blob: https://ujolhgcuruujuzccslot.supabase.co https://stream.mux.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
  ].join('; ')
}

export async function updateSession(request: NextRequest) {
  // Generate a per-request nonce for CSP (eliminates 'unsafe-inline' in script-src)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCSP(nonce)

  // Forward nonce in request headers so Next.js App Router uses it on its own
  // generated <script> tags automatically (reads 'x-nonce' by convention)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Server-side absolute session timeout: 8 hours
  if (user) {
    const lastSignIn = user.last_sign_in_at
    if (lastSignIn) {
      const signInTime = new Date(lastSignIn).getTime()
      const maxSessionMs = 8 * 60 * 60 * 1000
      if (Date.now() - signInTime > maxSessionMs) {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('reason', 'expired')
        return NextResponse.redirect(url)
      }
    }
  }

  // Protected routes
  const protectedPaths = ['/dashboard', '/my-courses', '/admin']
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Check if accessing course learn page
  const isCourseLearningPath = request.nextUrl.pathname.match(/\/courses\/[^\/]+\/learn/)

  if ((isProtectedPath || isCourseLearningPath) && !user) {
    // Redirect to login if accessing protected route without authentication
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin routes check
  if (request.nextUrl.pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Only admin and teacher can access admin routes
    const allowedRoles = ['admin', 'teacher']
    if (!profile || !allowedRoles.includes(profile.role)) {
      // Redirect non-admins away from admin routes
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Set dynamic CSP with nonce on the response
  supabaseResponse.headers.set('Content-Security-Policy', csp)

  return supabaseResponse
}
