import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { formatZodErrors } from '@/lib/validations'
import { isSameOrigin, isStaff, jsonError } from '@/lib/api-guards'
import { essayGradeSchema } from '@/lib/quiz/schemas'
import { loadAnswerKeys } from '@/lib/quiz/answer-keys'
import { markQuizLessonComplete } from '@/lib/quiz/progress'

async function authorize(attemptIdRaw: string) {
  if (!z.uuid().safeParse(attemptIdRaw).success) return { error: jsonError('Intento no encontrado', 404) }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: jsonError('No autenticado', 401) }
  if (!(await isStaff(supabase, user.id))) return { error: jsonError('No autorizado', 403) }
  const rl = await checkRateLimit(`admin-quiz:${user.id}`, RATE_LIMITS.admin)
  if (!rl.allowed) return { error: jsonError('Demasiadas solicitudes. Intenta más tarde.', 429) }
  return { user, supabase }
}

// One attempt with the student's answers, for grading.
export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params
    const auth = await authorize(attemptId)
    if ('error' in auth) return auth.error

    const svc = createServiceClient()
    const { data: attempt } = await svc
      .from('quiz_attempts')
      .select('id, quiz_id, user_id, course_id, lesson_id, attempt_number, status, passing_score, max_points, earned_points, score_percent, passed, submitted_at, graded_at')
      .eq('id', attemptId)
      .maybeSingle()
    if (!attempt) return jsonError('Intento no encontrado', 404)

    const [{ data: answers }, { data: student }, { data: course }, { data: lesson }] = await Promise.all([
      svc
        .from('quiz_attempt_answers')
        .select('id, question_id, position, question_type, question_prompt, question_options, max_points, response, points_awarded, feedback')
        .eq('attempt_id', attemptId)
        .order('position'),
      svc.from('profiles').select('full_name, email').eq('id', attempt.user_id).maybeSingle(),
      svc.from('courses').select('title').eq('id', attempt.course_id).maybeSingle(),
      svc.from('course_lessons').select('title').eq('id', attempt.lesson_id).maybeSingle(),
    ])

    const questionIds = (answers ?? []).map((a) => a.question_id).filter(Boolean) as string[]
    const keys = await loadAnswerKeys(svc, questionIds)
    const { data: notes } = questionIds.length
      ? await svc.from('quiz_answer_keys').select('question_id, grader_notes').in('question_id', questionIds)
      : { data: [] }
    const keyById = new Map(keys.map((k) => [k.questionId, k]))
    const notesById = new Map((notes ?? []).map((n) => [n.question_id, n.grader_notes]))

    return NextResponse.json({
      attempt: {
        ...attempt,
        max_points: Number(attempt.max_points),
        score_percent: attempt.score_percent === null ? null : Number(attempt.score_percent),
      },
      student: { name: student?.full_name ?? 'Estudiante', email: student?.email ?? null },
      course: { title: course?.title ?? 'Curso' },
      lesson: { title: lesson?.title ?? 'Cuestionario' },
      answers: (answers ?? []).map((a) => ({
        ...a,
        max_points: Number(a.max_points),
        points_awarded: a.points_awarded === null ? null : Number(a.points_awarded),
        key: a.question_id ? keyById.get(a.question_id) ?? null : null,
        graderNotes: a.question_id ? notesById.get(a.question_id) ?? null : null,
      })),
    })
  } catch (error) {
    logger.error('[AdminQuizAttempt] GET error:', error)
    return jsonError('Error al cargar el intento', 500)
  }
}

// Grade essay answers and optionally finalize the attempt.
export async function PATCH(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const { attemptId } = await params
    const auth = await authorize(attemptId)
    if ('error' in auth) return auth.error

    const body = await request.json().catch(() => null)
    const parsed = essayGradeSchema.safeParse(body)
    if (!parsed.success) return jsonError(formatZodErrors(parsed.error), 400)

    const svc = createServiceClient()
    const { data: answers } = await svc
      .from('quiz_attempt_answers')
      .select('id, question_type, max_points')
      .eq('attempt_id', attemptId)
    if (!answers || answers.length === 0) return jsonError('Intento no encontrado', 404)
    const answerById = new Map(answers.map((a) => [a.id, a]))

    for (const grade of parsed.data.grades) {
      const answer = answerById.get(grade.answerId)
      if (!answer || answer.question_type !== 'essay') return jsonError('Respuesta inválida', 400)
      if (grade.points > Number(answer.max_points)) {
        return jsonError(`La nota no puede superar ${Number(answer.max_points)} puntos`, 400)
      }
    }

    const now = new Date().toISOString()
    for (const grade of parsed.data.grades) {
      const { error } = await svc
        .from('quiz_attempt_answers')
        .update({
          points_awarded: grade.points,
          feedback: grade.feedback || null,
          graded_by: auth.user.id,
          graded_at: now,
        })
        .eq('id', grade.answerId)
        .eq('attempt_id', attemptId)
      if (error) throw error
    }

    if (!parsed.data.finalize) return NextResponse.json({ status: 'saved' })

    const { data, error } = await svc.rpc('quiz_finalize_attempt', {
      p_attempt_id: attemptId,
      p_grader_id: auth.user.id,
    })
    if (error) {
      if ((error.message ?? '').includes('UNGRADED_ANSWERS')) {
        return jsonError('Faltan preguntas de desarrollo por calificar', 409)
      }
      throw error
    }

    const row = Array.isArray(data) ? data[0] : data
    if (row?.r_passed) {
      await markQuizLessonComplete(svc, {
        userId: row.r_user_id,
        courseId: row.r_course_id,
        lessonId: row.r_lesson_id,
      })
    }

    try {
      await auth.supabase.from('audit_log').insert({
        admin_id: auth.user.id,
        action: 'grade_quiz_attempt',
        target_type: 'quiz_attempt',
        target_id: attemptId,
        details: { score: Number(row?.r_score_percent ?? 0), passed: !!row?.r_passed },
      })
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      status: 'graded',
      scorePercent: Number(row?.r_score_percent ?? 0),
      passed: !!row?.r_passed,
    })
  } catch (error) {
    logger.error('[AdminQuizAttempt] PATCH error:', error)
    return jsonError('Error al guardar la calificación', 500)
  }
}
