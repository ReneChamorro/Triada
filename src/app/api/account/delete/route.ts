import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function DELETE(request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Rate limit: max 3 deletion attempts per day per user
  const rl = await checkRateLimit(`account-delete:${user.id}`, RATE_LIMITS.accountDelete)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Intenta mañana.' }, { status: 429 })
  }

  const body = await request.json()
  if (body.confirm !== 'ELIMINAR') {
    return NextResponse.json({ error: 'Confirmación inválida' }, { status: 400 })
  }

  try {
    // Delete user's receipt files from storage
    const { data: files } = await supabase.storage
      .from('payment-receipts')
      .list(user.id)

    if (files && files.length > 0) {
      const filePaths = files.map(f => `${user.id}/${f.name}`)
      const serviceSupabase = createServiceClient()
      await serviceSupabase.storage.from('payment-receipts').remove(filePaths)
    }

    // Delete user via Supabase Admin API (CASCADE handles profiles, user_courses, lesson_progress, purchases)
    const serviceSupabase = createServiceClient()
    const { error } = await serviceSupabase.auth.admin.deleteUser(user.id)

    if (error) {
      return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error inesperado al eliminar la cuenta' }, { status: 500 })
  }
}
