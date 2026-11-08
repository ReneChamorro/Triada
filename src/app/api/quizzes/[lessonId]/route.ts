import { NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { jsonError } from '@/lib/api-guards'
import {
  loadQuizLesson,
  isEnrolled,
  loadStudentQuestions,
  loadAttempts,
  buildStudentState,
} from '@/lib/quiz/student-view'
import { isLessonCompleted, markQuizLessonComplete } from '@/lib/quiz/progress'

// Student view of a quiz. Uses ONLY student-safe data: correct answers are
// never read here, so they cannot end up in this response.
export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params
    if (!z.uuid().safeParse(lessonId).success) return jsonError('Cuestionario no encontrado', 404)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return jsonError('No autenticado', 401)

    const rl = await checkRateLimit(`quiz-read:${user.id}`, RATE_LIMITS.quizRead)
    if (!rl.allowed) return jsonError('Demasiadas solicitudes. Intenta más tarde.', 429)

    const svc = createServiceClient()
    const ctx = await loadQuizLesson(svc, lessonId)
    if (!ctx) return jsonError('Cuestionario no encontrado', 404)
    if (!(await isEnrolled(svc, user.id, ctx.courseId))) return jsonError('No tienes acceso a este curso', 403)
    if (!ctx.quiz) return jsonError('Cuestionario no disponible', 404)

    const [questions, attempts] = await Promise.all([
      loadStudentQuestions(svc, ctx.quiz.id),
      loadAttempts(svc, ctx.quiz.id, user.id),
    ])
    const state = buildStudentState(attempts, ctx.quiz.maxAttempts)

    // Self-heal: the attempt passed but the progress write failed at the time.
    let completed = await isLessonCompleted(svc, user.id, lessonId)
    if (state.passed && !completed) {
      await markQuizLessonComplete(svc, { userId: user.id, courseId: ctx.courseId, lessonId })
      completed = true
    }

    // Instructor comments on essays of the last graded attempt (feedback, not answers).
    let essayComments: { prompt: string; comment: string }[] = []
    const lastAttempt = attempts[attempts.length - 1]
    if (lastAttempt?.status === 'graded') {
      const { data } = await svc
        .from('quiz_attempt_answers')
        .select('question_prompt, feedback')
        .eq('attempt_id', lastAttempt.id)
        .eq('question_type', 'essay')
        .not('feedback', 'is', null)
        .order('position')
      essayComments = (data ?? []).map((a) => ({ prompt: a.question_prompt, comment: a.feedback }))
    }

    return NextResponse.json({
      quiz: {
        id: ctx.quiz.id,
        title: ctx.lessonTitle,
        instructions: ctx.quiz.instructions,
        passingScore: ctx.quiz.passingScore,
        maxAttempts: ctx.quiz.maxAttempts,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        questionCount: questions.length,
        hasEssay: questions.some((q) => q.type === 'essay'),
      },
      state: { ...state, completed, essayComments },
      questions: state.canAttempt
        ? questions.map((q) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            points: q.points,
            ...(q.type === 'single' || q.type === 'multiple' ? { options: q.options ?? [] } : {}),
            ...(q.type === 'fill' ? { blankCount: q.blankCount } : {}),
          }))
        : [],
    })
  } catch (error) {
    logger.error('[Quiz] GET error:', error)
    return jsonError('Error al cargar el cuestionario', 500)
  }
}
