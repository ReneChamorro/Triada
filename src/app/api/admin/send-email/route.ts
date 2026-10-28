import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/emails'
import { z } from 'zod/v4'

// Only `type`, `purchaseId` and an optional admin-authored `reason` are trusted
// from the client. Recipient, student name and course are derived server-side
// from the purchase so this endpoint cannot be used to send branded emails to
// arbitrary addresses with attacker-controlled content.
const schema = z.object({
  type: z.enum(['approval', 'rejection']),
  purchaseId: z.uuid(),
  reason: z.string().max(500).optional(),
})

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const allowed = new Set([appUrl, 'http://localhost:3000'].filter(Boolean))
  const reqOrigin = origin ?? (referer ? new URL(referer).origin : null)
  return !!reqOrigin && allowed.has(reqOrigin)
}

export async function POST(request: Request) {
  try {
    // CSRF: verify Origin matches the application domain
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verify admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { type, purchaseId, reason } = parsed.data

    // Derive recipient + course server-side from the purchase (never trust the client)
    const { data: purchase } = await supabase
      .from('purchases')
      .select('user_id, course_id')
      .eq('id', purchaseId)
      .single()

    if (!purchase) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    const [{ data: student }, { data: course }] = await Promise.all([
      supabase.from('profiles').select('email, full_name').eq('id', purchase.user_id).single(),
      supabase.from('courses').select('title').eq('id', purchase.course_id).single(),
    ])

    if (!student?.email || !course?.title) {
      return NextResponse.json({ error: 'Datos de la compra incompletos' }, { status: 404 })
    }

    const studentName = student.full_name || student.email

    if (type === 'approval') {
      await sendApprovalEmail(student.email, studentName, course.title, purchase.course_id)
    } else {
      await sendRejectionEmail(student.email, studentName, course.title, reason)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[SendEmail] Error:', error)
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }
}
