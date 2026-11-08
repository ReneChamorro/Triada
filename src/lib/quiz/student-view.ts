import type { SupabaseClient } from '@supabase/supabase-js'

// The ONLY quiz data module student routes may use. It never reads
// quiz_answer_keys: correct answers live in ./answer-keys.ts (admin + grading).

export interface QuizLessonContext {
  lessonId: string
  lessonTitle: string
  courseId: string
  quiz: {
    id: string
    instructions: string | null
    passingScore: number
    maxAttempts: number | null
  } | null
}

/** A published quiz lesson inside a published module of a published course. */
export async function loadQuizLesson(svc: SupabaseClient, lessonId: string): Promise<QuizLessonContext | null> {
  const { data: lesson } = await svc
    .from('course_lessons')
    .select('id, title, content_type, is_published, module_id')
    .eq('id', lessonId)
    .maybeSingle()
  if (!lesson || lesson.content_type !== 'quiz' || lesson.is_published === false) return null

  const { data: mod } = await svc
    .from('course_modules')
    .select('course_id, is_published')
    .eq('id', lesson.module_id)
    .maybeSingle()
  if (!mod || mod.is_published === false) return null

  const { data: course } = await svc
    .from('courses')
    .select('id, status')
    .eq('id', mod.course_id)
    .maybeSingle()
  if (!course || course.status !== 'published') return null

  const { data: quiz } = await svc
    .from('quizzes')
    .select('id, instructions, passing_score, max_attempts')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  return {
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    courseId: course.id,
    quiz: quiz
      ? {
          id: quiz.id,
          instructions: quiz.instructions,
          passingScore: quiz.passing_score,
          maxAttempts: quiz.max_attempts,
        }
      : null,
  }
}

export async function isEnrolled(svc: SupabaseClient, userId: string, courseId: string): Promise<boolean> {
  const { data } = await svc
    .from('user_courses')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  return !!data
}

export interface StudentQuestion {
  id: string
  type: 'single' | 'multiple' | 'fill' | 'essay'
  prompt: string
  points: number
  options: { id: string; text: string }[] | null
  blankCount: number
  position: number
}

/** Explicit, student-safe columns only. */
export async function loadStudentQuestions(svc: SupabaseClient, quizId: string): Promise<StudentQuestion[]> {
  const { data } = await svc
    .from('quiz_questions')
    .select('id, type, prompt, points, options, blank_count, position')
    .eq('quiz_id', quizId)
    .order('position')
  return (data ?? []).map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    points: Number(q.points),
    options: q.options ?? null,
    blankCount: q.blank_count ?? 0,
    position: q.position,
  }))
}

export interface AttemptRow {
  id: string
  attempt_number: number
  status: 'pending_review' | 'graded'
  score_percent: number | string | null
  passed: boolean | null
  submitted_at: string
}

export async function loadAttempts(svc: SupabaseClient, quizId: string, userId: string): Promise<AttemptRow[]> {
  const { data } = await svc
    .from('quiz_attempts')
    .select('id, attempt_number, status, score_percent, passed, submitted_at')
    .eq('quiz_id', quizId)
    .eq('user_id', userId)
    .order('attempt_number')
  return (data ?? []) as AttemptRow[]
}

export interface QuizStudentState {
  attemptsUsed: number
  attemptsRemaining: number | null
  pendingReview: boolean
  best: { scorePercent: number; passed: boolean } | null
  last: { status: 'pending_review' } | { status: 'graded'; scorePercent: number; passed: boolean } | null
  passed: boolean
  canAttempt: boolean
}

export function buildStudentState(attempts: AttemptRow[], maxAttempts: number | null): QuizStudentState {
  const graded = attempts.filter((a) => a.status === 'graded' && a.score_percent !== null)
  const pendingReview = attempts.some((a) => a.status === 'pending_review')

  let best: QuizStudentState['best'] = null
  for (const a of graded) {
    const score = Number(a.score_percent)
    if (!best || score > best.scorePercent) best = { scorePercent: score, passed: !!a.passed }
  }

  const lastRow = attempts[attempts.length - 1]
  const last: QuizStudentState['last'] = !lastRow
    ? null
    : lastRow.status === 'pending_review'
      ? { status: 'pending_review' }
      : { status: 'graded', scorePercent: Number(lastRow.score_percent ?? 0), passed: !!lastRow.passed }

  const attemptsUsed = attempts.length
  const attemptsRemaining = maxAttempts === null ? null : Math.max(0, maxAttempts - attemptsUsed)

  return {
    attemptsUsed,
    attemptsRemaining,
    pendingReview,
    best,
    last,
    passed: graded.some((a) => a.passed),
    canAttempt: !pendingReview && (attemptsRemaining === null || attemptsRemaining > 0),
  }
}
