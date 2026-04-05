import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/emails'
import { z } from 'zod/v4'

const schema = z.object({
  type: z.enum(['approval', 'rejection']),
  purchaseId: z.uuid(),
  email: z.email(),
  studentName: z.string().min(1),
  courseName: z.string().min(1),
  courseId: z.string().optional(),
  reason: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  try {
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

    const { type, email, studentName, courseName, courseId, reason } = parsed.data

    if (type === 'approval' && courseId) {
      await sendApprovalEmail(email, studentName, courseName, courseId)
    } else if (type === 'rejection') {
      await sendRejectionEmail(email, studentName, courseName, reason)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[SendEmail] Error:', error)
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }
}
