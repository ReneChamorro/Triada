import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { feedbackSchema, formatZodErrors } from '@/lib/validations'
import { isSameOrigin, jsonError } from '@/lib/api-guards'
import { sendFeedbackNotification } from '@/lib/emails'

// Platform feedback from registered users.
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('Inicia sesión para enviar comentarios', 401)

    const rl = await checkRateLimit(`feedback:${user.id}`, RATE_LIMITS.feedback)
    if (!rl.allowed) return jsonError('Has enviado varios comentarios seguidos. Intenta más tarde.', 429)

    const body = await request.json().catch(() => null)
    const parsed = feedbackSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodErrors(parsed.error), 400)
    const { category, rating, message, pagePath } = parsed.data

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle()
    const userName = profile?.full_name || user.email || 'Usuario'
    const userEmail = profile?.email || user.email || null

    const svc = createServiceClient()
    const { error } = await svc.from('platform_feedback').insert({
      user_id: user.id,
      user_name: userName,
      user_email: userEmail,
      category,
      rating: rating ?? null,
      message,
      page_path: pagePath ?? null,
    })
    if (error) {
      logger.error('[Feedback] insert error:', error)
      return jsonError('No se pudo enviar tu comentario', 500)
    }

    try {
      await sendFeedbackNotification({ category, rating: rating ?? null, message, userName, userEmail })
    } catch (emailError) {
      logger.error('[Feedback] email error:', emailError)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error('[Feedback] unexpected error:', error)
    return jsonError('Error al procesar la solicitud', 500)
  }
}
