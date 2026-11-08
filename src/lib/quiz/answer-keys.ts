import type { SupabaseClient } from '@supabase/supabase-js'
import type { AnswerKey } from './grading'
import type { QuizDefinition, QuestionDefinition } from './schemas'
import { countBlanks } from './blanks'

// Correct answers. Server-side only: used by the grading route and the admin
// editor. NEVER import from a student-facing response path.

export async function loadAnswerKeys(svc: SupabaseClient, questionIds: string[]): Promise<AnswerKey[]> {
  if (questionIds.length === 0) return []
  const { data } = await svc
    .from('quiz_answer_keys')
    .select('question_id, correct_option_ids, blank_answers, strict_match')
    .in('question_id', questionIds)
  return (data ?? []).map((k) => ({
    questionId: k.question_id,
    correctOptionIds: k.correct_option_ids ?? [],
    blankAnswers: k.blank_answers ?? [],
    strict: !!k.strict_match,
  }))
}

/** Full definition (questions + keys) for the admin editor. */
export async function loadQuizDefinition(svc: SupabaseClient, lessonId: string): Promise<{
  definition: QuizDefinition | null
  attemptCount: number
}> {
  const { data: quiz } = await svc
    .from('quizzes')
    .select('id, instructions, passing_score, max_attempts')
    .eq('lesson_id', lessonId)
    .maybeSingle()
  if (!quiz) return { definition: null, attemptCount: 0 }

  const [{ data: questions }, { count }] = await Promise.all([
    svc
      .from('quiz_questions')
      .select('id, type, prompt, points, options, position')
      .eq('quiz_id', quiz.id)
      .order('position'),
    svc.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', quiz.id),
  ])

  const ids = (questions ?? []).map((q) => q.id)
  const { data: keyRows } = ids.length
    ? await svc
        .from('quiz_answer_keys')
        .select('question_id, correct_option_ids, blank_answers, strict_match, grader_notes')
        .in('question_id', ids)
    : { data: [] }
  const keyById = new Map((keyRows ?? []).map((k) => [k.question_id, k]))

  const defs: QuestionDefinition[] = (questions ?? []).map((q) => {
    const key = keyById.get(q.id)
    const base = { id: q.id, prompt: q.prompt, points: Number(q.points) }
    switch (q.type) {
      case 'single':
      case 'multiple':
        return { ...base, type: q.type, options: q.options ?? [], correctOptionIds: key?.correct_option_ids ?? [] }
      case 'fill':
        return { ...base, type: 'fill', blanks: key?.blank_answers ?? [], strict: !!key?.strict_match }
      default:
        return { ...base, type: 'essay', graderNotes: key?.grader_notes ?? null }
    }
  })

  return {
    definition: {
      instructions: quiz.instructions,
      passingScore: quiz.passing_score,
      maxAttempts: quiz.max_attempts,
      questions: defs,
    },
    attemptCount: count ?? 0,
  }
}

export class QuizSaveError extends Error {}

/**
 * Upserts the quiz, its questions and their keys; deletes questions that were
 * removed. Not atomic, but idempotent: re-saving the same payload converges.
 */
export async function saveQuizDefinition(
  svc: SupabaseClient,
  params: { lessonId: string; courseId: string; definition: QuizDefinition }
): Promise<string> {
  const { lessonId, courseId, definition } = params

  const { data: quiz, error: quizError } = await svc
    .from('quizzes')
    .upsert(
      {
        lesson_id: lessonId,
        course_id: courseId,
        instructions: definition.instructions || null,
        passing_score: definition.passingScore,
        max_attempts: definition.maxAttempts,
      },
      { onConflict: 'lesson_id' }
    )
    .select('id')
    .single()
  if (quizError || !quiz) throw new QuizSaveError('No se pudo guardar el cuestionario')

  const incomingIds = definition.questions.map((q) => q.id)

  // Question ids come from the client: refuse ids that belong to another quiz.
  const { data: foreign } = await svc
    .from('quiz_questions')
    .select('id')
    .in('id', incomingIds)
    .neq('quiz_id', quiz.id)
  if (foreign && foreign.length > 0) throw new QuizSaveError('Identificador de pregunta inválido')

  const questionRows = definition.questions.map((q, position) => ({
    id: q.id,
    quiz_id: quiz.id,
    position,
    type: q.type,
    prompt: q.prompt,
    points: q.points,
    options: q.type === 'single' || q.type === 'multiple' ? q.options : null,
    blank_count: q.type === 'fill' ? countBlanks(q.prompt) : 0,
  }))
  const { error: qError } = await svc.from('quiz_questions').upsert(questionRows, { onConflict: 'id' })
  if (qError) throw new QuizSaveError('No se pudieron guardar las preguntas')

  const keyRows = definition.questions.map((q) => ({
    question_id: q.id,
    correct_option_ids: q.type === 'single' || q.type === 'multiple' ? q.correctOptionIds : [],
    blank_answers: q.type === 'fill' ? q.blanks : [],
    strict_match: q.type === 'fill' ? q.strict : false,
    grader_notes: q.type === 'essay' ? q.graderNotes || null : null,
    updated_at: new Date().toISOString(),
  }))
  const { error: kError } = await svc.from('quiz_answer_keys').upsert(keyRows, { onConflict: 'question_id' })
  if (kError) throw new QuizSaveError('No se pudieron guardar las respuestas correctas')

  const { data: existing } = await svc.from('quiz_questions').select('id').eq('quiz_id', quiz.id)
  const stale = (existing ?? []).map((q) => q.id).filter((id) => !incomingIds.includes(id))
  if (stale.length > 0) {
    await svc.from('quiz_questions').delete().in('id', stale)
  }

  return quiz.id
}
