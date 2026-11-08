// Pure grading logic. Runs ONLY on the server (API routes), where the answer
// keys are available. No I/O here so it can be unit-tested in isolation.

export type QuestionType = 'single' | 'multiple' | 'fill' | 'essay'

export interface GradableQuestion {
  id: string
  type: QuestionType
  points: number
  blankCount: number
}

export interface AnswerKey {
  questionId: string
  correctOptionIds: string[]
  blankAnswers: string[][]
  strict: boolean
}

export type StudentAnswer =
  | { questionId: string; type: 'single'; optionId: string | null }
  | { questionId: string; type: 'multiple'; optionIds: string[] }
  | { questionId: string; type: 'fill'; blanks: string[] }
  | { questionId: string; type: 'essay'; text: string }

export interface QuizGradeResult {
  perQuestion: { questionId: string; pointsAwarded: number | null }[]
  maxPoints: number
  autoPoints: number
  /** true when at least one essay has content and must be graded by an instructor */
  needsReview: boolean
  /** null while needsReview */
  scorePercent: number | null
  passed: boolean | null
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

const EDGE_PUNCTUATION = /^[.,;:!?¡¿"'«»()]+|[.,;:!?¡¿"'«»()]+$/g

/**
 * Normalizes a fill-in answer before comparing. In non-strict mode case and
 * accents are ignored (so "Freud" == "freud" and "Pávlov" == "pavlov").
 */
export function normalizeAnswer(raw: string, strict: boolean): string {
  let s = raw.normalize('NFC').replace(/\s+/g, ' ').trim()
  s = s.replace(EDGE_PUNCTUATION, '').trim()
  if (!strict) {
    s = s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es')
  }
  return s
}

function sameSet(a: string[], b: string[]): boolean {
  const setA = new Set(a)
  const setB = new Set(b)
  if (setA.size !== setB.size) return false
  for (const item of setA) if (!setB.has(item)) return false
  return true
}

/** Returns the points earned, or null when the answer needs manual review. */
export function gradeQuestion(
  question: GradableQuestion,
  key: AnswerKey | undefined,
  answer: StudentAnswer | undefined
): number | null {
  if (question.type === 'essay') {
    const text = answer?.type === 'essay' ? answer.text.trim() : ''
    return text ? null : 0
  }

  if (!key || !answer || answer.type !== question.type) return 0

  switch (answer.type) {
    case 'single':
      return answer.optionId !== null && answer.optionId === key.correctOptionIds[0]
        ? question.points
        : 0

    case 'multiple':
      // All-or-nothing: the exact set must match, so ticking every option never pays.
      return answer.optionIds.length > 0 && sameSet(answer.optionIds, key.correctOptionIds)
        ? question.points
        : 0

    case 'fill': {
      const total = key.blankAnswers.length
      if (total === 0) return 0
      let correct = 0
      key.blankAnswers.forEach((accepted, i) => {
        const given = normalizeAnswer(answer.blanks[i] ?? '', key.strict)
        if (!given) return
        if (accepted.some((a) => normalizeAnswer(a, key.strict) === given)) correct++
      })
      return round2((question.points * correct) / total)
    }

    default:
      return 0
  }
}

export function gradeQuiz(
  questions: GradableQuestion[],
  keys: AnswerKey[],
  answers: StudentAnswer[],
  passingScore: number
): QuizGradeResult {
  const keyById = new Map(keys.map((k) => [k.questionId, k]))
  const answerById = new Map(answers.map((a) => [a.questionId, a]))

  let maxPoints = 0
  let autoPoints = 0
  let needsReview = false

  const perQuestion = questions.map((q) => {
    maxPoints += q.points
    const pointsAwarded = gradeQuestion(q, keyById.get(q.id), answerById.get(q.id))
    if (pointsAwarded === null) needsReview = true
    else autoPoints += pointsAwarded
    return { questionId: q.id, pointsAwarded }
  })

  maxPoints = round2(maxPoints)
  autoPoints = round2(autoPoints)

  if (needsReview) {
    return { perQuestion, maxPoints, autoPoints, needsReview, scorePercent: null, passed: null }
  }

  const scorePercent = maxPoints > 0 ? round2((100 * autoPoints) / maxPoints) : 0
  return {
    perQuestion,
    maxPoints,
    autoPoints,
    needsReview,
    scorePercent,
    passed: scorePercent >= passingScore,
  }
}
