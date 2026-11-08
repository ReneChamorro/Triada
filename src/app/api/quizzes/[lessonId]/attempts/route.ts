import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { isSameOrigin, jsonError } from '@/lib/api-guards'
import { quizSubmissionSchema } from '@/lib/quiz/schemas'
import { gradeQuiz, type StudentAnswer } from '@/lib/quiz/grading'
import { loadQuizLesson, isEnrolled, loadStudentQuestions, type StudentQuestion } from '@/lib/quiz/student-view'
import { loadAnswerKeys } from '@/lib/quiz/answer-keys'
import { markQuizLessonComplete } from '@/lib/quiz/progress'

function isValidAnswer(answer: StudentAnswer, question: StudentQuestion): boolean {
  if (answer.type !== question.type) return false
  const optionIds = new Set((question.options ?? []).map((o) => o.id))
  switch (answer.type) {
    case 'single':
      return answer.optionId === null || optionIds.has(answer.optionId)
    case 'multiple':
      return new Set(answer.optionIds).size === answer.optionIds.length &&
        answer.optionIds.every((id) => optionIds.has(id))
    case 'fill':
      return answer.blanks.length === question.blankCount
    case 'essay':
      return true
  }
}

// Submits an attempt. Grading happens here, on the server, with the answer
// keys; the response carries only the grade (or "pending review").
export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    if (!isSameOrigin(request)) return jsonError('No autorizado', 403)

    const { lessonId } = await params
    if (!z.uuid().safeParse(lessonId).success) return jsonError('Cuestionario no encontrado', 404)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('No autenticado', 401)

    const rl = await checkRateLimit(`quiz-submit:${user.id}`, RATE_LIMITS.quizSubmit)
    if (!rl.allowed) return jsonError('Demasiados envíos. Intenta más tarde.', 429)

    const body = await request.json().catch(() => null)
    const parsed = quizSubmissionSchema.safeParse(body)
    if (!parsed.success) return jsonError('Respuestas inválidas', 400)

    const svc = createServiceClient()
    const ctx = await loadQuizLesson(svc, lessonId)
    if (!ctx) return jsonError('Cuestionario no encontrado', 404)
    if (!(await isEnrolled(svc, user.id, ctx.courseId))) return jsonError('No tienes acceso a este curso', 403)
    if (!ctx.quiz) return jsonError('Cuestionario no disponible', 404)

    const questions = await loadStudentQuestions(svc, ctx.quiz.id)
    const byId = new Map(questions.map((q) => [q.id, q]))

    const answers = parsed.data.answers as StudentAnswer[]
    const seen = new Set<string>()
    for (const answer of answers) {
      const question = byId.get(answer.questionId)
      if (!question || seen.has(answer.questionId) || !isValidAnswer(answer, question)) {
        return jsonError('Respuesta inválida', 400)
      }
      seen.add(answer.questionId)
    }

    const keys = await loadAnswerKeys(svc, questions.map((q) => q.id))
    const grade = gradeQuiz(
      questions.map((q) => ({ id: q.id, type: q.type, points: q.points, blankCount: q.blankCount })),
      keys,
      answers,
      ctx.quiz.passingScore
    )

    const answerById = new Map(answers.map((a) => [a.questionId, a]))
    const pointsById = new Map(grade.perQuestion.map((p) => [p.questionId, p.pointsAwarded]))
    const snapshot = questions.map((q) => {
      const answer = answerById.get(q.id)
      let response: unknown = null
      if (answer) {
        const { questionId: _id, type: _type, ...rest } = answer
        response = rest
      }
      return {
        question_id: q.id,
        position: q.position,
        question_type: q.type,
        question_prompt: q.prompt,
        question_options: q.options,
        max_points: q.points,
        response,
        points_awarded: pointsById.get(q.id) ?? null,
      }
    })

    const { data, error } = await svc.rpc('quiz_record_attempt', {
      p_quiz_id: ctx.quiz.id,
      p_user_id: user.id,
      p_needs_review: grade.needsReview,
      p_max_points: grade.maxPoints,
      p_auto_points: grade.autoPoints,
      p_answers: snapshot,
    })

    if (error) {
      const message = error.message ?? ''
      if (message.includes('MAX_ATTEMPTS')) return jsonError('Ya usaste todos tus intentos', 409)
      if (message.includes('ATTEMPT_PENDING')) return jsonError('Tienes un intento en revisión', 409)
      if (message.includes('NOT_ENROLLED')) return jsonError('No tienes acceso a este curso', 403)
      logger.error('[Quiz] record attempt error:', error)
      return jsonError('No se pudo registrar tu intento', 500)
    }

    const row = Array.isArray(data) ? data[0] : data
    if (row?.r_passed) {
      await markQuizLessonComplete(svc, { userId: user.id, courseId: ctx.courseId, lessonId })
    }

    const attemptsRemaining = ctx.quiz.maxAttempts === null
      ? null
      : Math.max(0, ctx.quiz.maxAttempts - Number(row?.r_attempt_number ?? 0))

    if (row?.r_status === 'pending_review') {
      return NextResponse.json({ status: 'pending_review', attemptsRemaining })
    }
    return NextResponse.json({
      status: 'graded',
      scorePercent: Number(row?.r_score_percent ?? 0),
      passed: !!row?.r_passed,
      attemptsRemaining,
    })
  } catch (error) {
    logger.error('[Quiz] POST attempt error:', error)
    return jsonError('Error al enviar el cuestionario', 500)
  }
}
