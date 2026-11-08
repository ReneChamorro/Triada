import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Shared guards for the quiz / feedback routes. Mirrors the inline checks in
// src/app/api/admin/grant-access/route.ts.

/** CSRF: the request must come from the application's own origin. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const allowed = new Set([appUrl, 'http://localhost:3000'].filter(Boolean))
  let requestOrigin: string | null = origin
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin
    } catch {
      requestOrigin = null
    }
  }
  return !!requestOrigin && allowed.has(requestOrigin)
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** admin or teacher, read from the caller's own profile row. */
export async function isStaff(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return !!data && ['admin', 'teacher'].includes(data.role)
}
