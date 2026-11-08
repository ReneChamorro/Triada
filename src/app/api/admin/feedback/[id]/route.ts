import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { feedbackStatusSchema, formatZodErrors } from '@/lib/validations'
import { isSameOrigin, isStaff, jsonError } from '@/lib/api-guards'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const { id } = await params
    if (!z.uuid().safeParse(id).success) return jsonError('Comentario no encontrado', 404)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('No autenticado', 401)
    if (!(await isStaff(supabase, user.id))) return jsonError('No autorizado', 403)
    const rl = await checkRateLimit(`admin-feedback:${user.id}`, RATE_LIMITS.admin)
    if (!rl.allowed) return jsonError('Demasiadas solicitudes. Intenta más tarde.', 429)

    const body = await request.json().catch(() => null)
    const parsed = feedbackStatusSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodErrors(parsed.error), 400)

    const { error } = await createServiceClient()
      .from('platform_feedback')
      .update({
        status: parsed.data.status,
        ...(parsed.data.adminNote !== undefined ? { admin_note: parsed.data.adminNote || null } : {}),
        handled_by: user.id,
      })
      .eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('[AdminFeedback] PATCH error:', error)
    return jsonError('Error al actualizar el comentario', 500)
  }
}
