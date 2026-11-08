import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { isStaff, jsonError } from '@/lib/api-guards'

const PAGE_SIZE = 25

const querySchema = z.object({
  status: z.enum(['pending_review', 'graded', 'all']).default('pending_review'),
  courseId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
})

// Attempts list for the "Cuestionarios" admin page.
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('No autenticado', 401)
    if (!(await isStaff(supabase, user.id))) return jsonError('No autorizado', 403)
    const rl = await checkRateLimit(`admin-quiz:${user.id}`, RATE_LIMITS.admin)
    if (!rl.allowed) return jsonError('Demasiadas solicitudes. Intenta más tarde.', 429)

    const url = new URL(request.url)
    const parsed = querySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      courseId: url.searchParams.get('courseId') || undefined,
      page: url.searchParams.get('page') ?? undefined,
    })
    if (!parsed.success) return jsonError('Filtros inválidos', 400)
    const { status, courseId, page } = parsed.data

    const svc = createServiceClient()
    let query = svc
      .from('quiz_attempts')
      .select('id, user_id, course_id, lesson_id, attempt_number, status, score_percent, passed, submitted_at, graded_at', { count: 'exact' })
      .order('submitted_at', { ascending: status === 'pending_review' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    if (status !== 'all') query = query.eq('status', status)
    if (courseId) query = query.eq('course_id', courseId)

    const { data: rows, count, error } = await query
    if (error) throw error

    const unique = (values: string[]) => [...new Set(values)]
    const userIds = unique((rows ?? []).map((r) => r.user_id))
    const courseIds = unique((rows ?? []).map((r) => r.course_id))
    const lessonIds = unique((rows ?? []).map((r) => r.lesson_id))

    const [profiles, courses, lessons] = await Promise.all([
      userIds.length ? svc.from('profiles').select('id, full_name, email').in('id', userIds) : { data: [] },
      courseIds.length ? svc.from('courses').select('id, title').in('id', courseIds) : { data: [] },
      lessonIds.length ? svc.from('course_lessons').select('id, title').in('id', lessonIds) : { data: [] },
    ])
    const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]))
    const courseById = new Map((courses.data ?? []).map((c) => [c.id, c]))
    const lessonById = new Map((lessons.data ?? []).map((l) => [l.id, l]))

    return NextResponse.json({
      total: count ?? 0,
      pageSize: PAGE_SIZE,
      attempts: (rows ?? []).map((r) => ({
        id: r.id,
        student: {
          name: profileById.get(r.user_id)?.full_name ?? 'Estudiante',
          email: profileById.get(r.user_id)?.email ?? null,
        },
        course: { id: r.course_id, title: courseById.get(r.course_id)?.title ?? 'Curso' },
        lesson: { id: r.lesson_id, title: lessonById.get(r.lesson_id)?.title ?? 'Cuestionario' },
        attemptNumber: r.attempt_number,
        status: r.status,
        scorePercent: r.score_percent === null ? null : Number(r.score_percent),
        passed: r.passed,
        submittedAt: r.submitted_at,
        gradedAt: r.graded_at,
      })),
    })
  } catch (error) {
    logger.error('[AdminQuizAttempts] GET error:', error)
    return jsonError('Error al cargar los intentos', 500)
  }
}
