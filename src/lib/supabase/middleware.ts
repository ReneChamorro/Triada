import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://ujolhgcuruujuzccslot.supabase.co https://*.googleusercontent.com https://*.ytimg.com https://image.mux.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mux.com https://direct-uploads.oci-us-phoenix-1-vop1.production.mux.com https://api.mux.com",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://accounts.google.com",
    "media-src 'self' blob: https://ujolhgcuruujuzccslot.supabase.co https://stream.mux.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
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
