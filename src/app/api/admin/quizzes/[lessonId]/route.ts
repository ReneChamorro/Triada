import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { formatZodErrors } from '@/lib/validations'
import { isSameOrigin, isStaff, jsonError } from '@/lib/api-guards'
import { quizDefinitionSchema } from '@/lib/quiz/schemas'
import { loadQuizDefinition, saveQuizDefinition, QuizSaveError } from '@/lib/quiz/answer-keys'

async function authorize(lessonIdRaw: string) {
  if (!z.uuid().safeParse(lessonIdRaw).success) return { error: jsonError('Lección no encontrada', 404) }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: jsonError('No autenticado', 401) }
  if (!(await isStaff(supabase, user.id))) return { error: jsonError('No autorizado', 403) }
  const rl = await checkRateLimit(`admin-quiz:${user.id}`, RATE_LIMITS.admin)
  if (!rl.allowed) return { error: jsonError('Demasiadas solicitudes. Intenta más tarde.', 429) }
  return { user, supabase }
}

// Full quiz definition, including correct answers, for the admin editor.
export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params
    const auth = await authorize(lessonId)
    if ('error' in auth) return auth.error

    const result = await loadQuizDefinition(createServiceClient(), lessonId)
    return NextResponse.json(result)
  } catch (error) {
    logger.error('[AdminQuiz] GET error:', error)
    return jsonError('Error al cargar el cuestionario', 500)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const { lessonId } = await params
    const auth = await authorize(lessonId)
    if ('error' in auth) return auth.error

    const body = await request.json().catch(() => null)
    const parsed = quizDefinitionSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodErrors(parsed.error), 400)

    const svc = createServiceClient()
    const { data: lesson } = await svc
      .from('course_lessons')
      .select('id, title, content_type, module_id')
      .eq('id', lessonId)
      .maybeSingle()
    if (!lesson) return jsonError('Lección no encontrada', 404)
    if (lesson.content_type !== 'quiz') return jsonError('La lección no es de tipo cuestionario', 400)

    const { data: mod } = await svc
      .from('course_modules')
      .select('course_id')
      .eq('id', lesson.module_id)
      .maybeSingle()
    if (!mod) return jsonError('Módulo no encontrado', 404)

    const quizId = await saveQuizDefinition(svc, {
      lessonId,
      courseId: mod.course_id,
      definition: parsed.data,
    })

    try {
      await auth.supabase.from('audit_log').insert({
        admin_id: auth.user.id,
        action: 'save_quiz',
        target_type: 'lesson',
        target_id: lessonId,
        details: { lesson: lesson.title, questions: parsed.data.questions.length },
      })
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ ok: true, quizId })
  } catch (error) {
    if (error instanceof QuizSaveError) return jsonError(error.message, 400)
    logger.error('[AdminQuiz] PUT error:', error)
    return jsonError('Error al guardar el cuestionario', 500)
  }
}
