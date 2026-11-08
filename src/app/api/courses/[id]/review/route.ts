import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { reviewSchema, formatZodErrors } from '@/lib/validations'
import { isSameOrigin, jsonError } from '@/lib/api-guards'
import { toReviewDisplayName } from '@/lib/display-name'

// Create or edit the caller's review. Every write goes back to moderation.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const { id: courseId } = await params
    if (!z.uuid().safeParse(courseId).success) return jsonError('Curso no encontrado', 404)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('No autenticado', 401)

    const rl = await checkRateLimit(`review:${user.id}`, RATE_LIMITS.review)
    if (!rl.allowed) return jsonError('Demasiadas solicitudes. Intenta más tarde.', 429)

    const body = await request.json().catch(() => null)
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodErrors(parsed.error), 400)

    const svc = createServiceClient()
    const { data: course } = await svc
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('status', 'published')
      .maybeSingle()
    if (!course) return jsonError('Curso no encontrado', 404)

    const { data: enrollment } = await svc
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()
    if (!enrollment) return jsonError('Solo los estudiantes del curso pueden opinar', 403)

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, lastname, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const { error } = await svc.from('course_reviews').upsert(
      {
        course_id: courseId,
        user_id: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
        display_name: toReviewDisplayName(profile ?? {}),
        status: 'pending',
        moderation_note: null,
        moderated_by: null,
        moderated_at: null,
      },
      { onConflict: 'course_id,user_id' }
    )
    if (error) {
      logger.error('[Review] upsert error:', error)
      return jsonError('No se pudo guardar tu opinión', 500)
    }

    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    logger.error('[Review] unexpected error:', error)
    return jsonError('Error al procesar la solicitud', 500)
  }
}
