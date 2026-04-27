import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // CSRF: verify Origin matches the application domain
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const allowedOrigins = new Set([appUrl, 'http://localhost:3000'].filter(Boolean))
  const requestOrigin = origin ?? (referer ? new URL(referer).origin : null)
  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL))
}
