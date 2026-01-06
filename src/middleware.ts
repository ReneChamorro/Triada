import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rate limiting storage (en producción, usa Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Configuración de rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto
const MAX_REQUESTS = 60 // 60 requests por minuto por IP

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `rate_limit:${ip}`
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  record.count++

  if (record.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_REQUESTS - record.count }
}

export async function middleware(request: NextRequest) {
  // Rate limiting para rutas API
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitKey = getRateLimitKey(request)
    const { allowed, remaining } = checkRateLimit(rateLimitKey)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString(),
          }
        }
      )
    }

    const response = await updateSession(request)
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    
    return response
  }

  // Para rutas normales, solo actualizar sesión
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
