import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { reviewModerationSchema, formatZodErrors } from '@/lib/validations'
import { isSameOrigin, isStaff, jsonError } from '@/lib/api-guards'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const { id } = await params
    if (!z.uuid().safeParse(id).success) return jsonError('Reseña no encontrada', 404)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('No autenticado', 401)
    if (!(await isStaff(supabase, user.id))) return jsonError('No autorizado', 403)
    const rl = await checkRateLimit(`admin-reviews:${user.id}`, RATE_LIMITS.admin)
    if (!rl.allowed) return jsonError('Demasiadas solicitudes. Intenta más tarde.', 429)

    const body = await request.json().catch(() => null)
    const parsed = reviewModerationSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodErrors(parsed.error), 400)

    const { error } = await createServiceClient()
      .from('course_reviews')
      .update({
        status: parsed.data.status,
        moderation_note: parsed.data.moderationNote || null,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error

    try {
      await supabase.from('audit_log').insert({
        admin_id: user.id,
        action: parsed.data.status === 'approved' ? 'approve_review' : 'reject_review',
        target_type: 'course_review',
        target_id: id,
        details: { note: parsed.data.moderationNote ?? null },
      })
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('[AdminReviews] PATCH error:', error)
    return jsonError('Error al moderar la reseña', 500)
  }
}
