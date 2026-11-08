'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ClipboardList, CheckCircle, Clock } from 'lucide-react'
import { splitPrompt } from '@/lib/quiz/blanks'

// Student quiz runner. The server never sends correct answers, and this
// component only ever shows the final grade (or "En revisión").

type QuestionType = 'single' | 'multiple' | 'fill' | 'essay'

interface Question {
  id: string
  type: QuestionType
  prompt: string
  points: number
  options?: { id: string; text: string }[]
  blankCount?: number
}

interface QuizData {
  quiz: {
    title: string
    instructions: string | null
    passingScore: number
    maxAttempts: number | null
    questionCount: number
    hasEssay: boolean
  }
  state: {
    attemptsUsed: number
    attemptsRemaining: number | null
    pendingReview: boolean
    best: { scorePercent: number; passed: boolean } | null
    last: { status: 'pending_review' } | { status: 'graded'; scorePercent: number; passed: boolean } | null
    passed: boolean
    canAttempt: boolean
    completed: boolean
    essayComments: { prompt: string; comment: string }[]
  }
  questions: Question[]
}

type Result =
  | { status: 'graded'; scorePercent: number; passed: boolean; attemptsRemaining: number | null }
  | { status: 'pending_review'; attemptsRemaining: number | null }

type AnswerValue = { optionId: string | null } | { optionIds: string[] } | { blanks: string[] } | { text: string }

const pct = (n: number) => `${n.toLocaleString('es', { maximumFractionDigits: 2 })}%`

const card = 'bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto shadow-sm'
const primaryBtn =
  'px-5 py-2.5 bg-[#1a5744] hover:bg-[#2d7a5f] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

function isAnswered(q: Question, value: AnswerValue | undefined): boolean {
  if (!value) return false
  if ('optionId' in value) return value.optionId !== null
  if ('optionIds' in value) return value.optionIds.length > 0
  if ('blanks' in value) return value.blanks.some((b) => b.trim() !== '')
  return value.text.trim() !== ''
}

interface Props {
  lessonId: string
  onPassed?: () => void
}

export default function QuizPlayer({ lessonId, onPassed }: Props) {
  const [data, setData] = useState<QuizData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'intro' | 'taking' | 'result'>('intro')
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [confirmUnanswered, setConfirmUnanswered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  // Kept in a ref so an inline callback from the parent never retriggers the fetch.
  const onPassedRef = useRef(onPassed)
  useEffect(() => { onPassedRef.current = onPassed }, [onPassed])

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/quizzes/${lessonId}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'No se pudo cargar el cuestionario')
      setData(body)
      if (body.state.passed) onPassedRef.current?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el cuestionario')
    }
  }, [lessonId])

  useEffect(() => { load() }, [load])

  const start = () => {
    setAnswers({})
    setConfirmUnanswered(false)
    setResult(null)
    setPhase('taking')
  }

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setConfirmUnanswered(false)
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const unanswered = data ? data.questions.filter((q) => !isAnswered(q, answers[q.id])).length : 0

  const submit = async () => {
    if (!data) return
    if (unanswered > 0 && !confirmUnanswered) {
      setConfirmUnanswered(true)
      return
    }
    setSubmitting(true)
    try {
      const payload = data.questions.map((q) => {
        const value = answers[q.id]
        switch (q.type) {
          case 'single':
            return { questionId: q.id, type: q.type, optionId: value && 'optionId' in value ? value.optionId : null }
          case 'multiple':
            return { questionId: q.id, type: q.type, optionIds: value && 'optionIds' in value ? value.optionIds : [] }
          case 'fill': {
            const blanks = value && 'blanks' in value ? value.blanks : []
            return { questionId: q.id, type: q.type, blanks: Array.from({ length: q.blankCount ?? 0 }, (_, i) => blanks[i] ?? '') }
          }
          case 'essay':
            return { questionId: q.id, type: q.type, text: value && 'text' in value ? value.text : '' }
        }
      })
      const res = await fetch(`/api/quizzes/${lessonId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'No se pudo enviar el cuestionario')
      setResult(body)
      setPhase('result')
      if (body.status === 'graded' && body.passed) onPassedRef.current?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo enviar el cuestionario')
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className={`${card} text-center`}>
          <p className="text-[#2d7a5f] font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a4c639]" />
      </div>
    )
  }

  const { quiz, state } = data

  // ── Result after submitting ─────────────────────────────────────────────
  if (phase === 'result' && result) {
    const canRetry = result.status === 'graded' && (result.attemptsRemaining === null || result.attemptsRemaining > 0)
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className={`${card} text-center`}>
          {result.status === 'pending_review' ? (
            <>
              <Clock className="w-10 h-10 text-[#a4c639] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-[#1a5744] mb-2">En revisión</h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Recibimos tus respuestas. Tu instructor calificará las preguntas de desarrollo y
                verás tu nota aquí cuando termine.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#2d7a5f]/70 mb-2">Tu calificación</p>
              <p className="text-5xl font-black text-[#1a5744] mb-3">{pct(result.scorePercent)}</p>
              <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                result.passed ? 'bg-[#a4c639]/20 text-[#1a5744]' : 'bg-[#e8e4d0] text-[#2d7a5f]'
              }`}>
                {result.passed ? 'Aprobado' : `No aprobado. Necesitas ${quiz.passingScore}%`}
              </p>
              <p className="text-xs text-gray-500 mt-4">
                {result.attemptsRemaining === null
                  ? 'Intentos ilimitados. Cuenta tu mejor nota.'
                  : `Te quedan ${result.attemptsRemaining} intento(s). Cuenta tu mejor nota.`}
              </p>
            </>
          )}
          <div className="flex justify-center gap-3 mt-6">
            {canRetry && (
              <button onClick={start} className={primaryBtn}>Reintentar</button>
            )}
            <button onClick={() => { setPhase('intro'); load() }}
              className="px-5 py-2.5 bg-gray-100 text-[#2d7a5f] rounded-xl hover:bg-gray-200 font-semibold text-sm">
              Volver al resumen
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Taking the quiz ─────────────────────────────────────────────────────
  if (phase === 'taking') {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className={card}>
          <h2 className="text-2xl font-bold text-[#2d7a5f] mb-6">{quiz.title}</h2>
          <ol className="space-y-8">
            {data.questions.map((q, index) => (
              <li key={q.id}>
                <fieldset>
                  <legend className="text-sm font-semibold text-[#1a5744] mb-2">
                    Pregunta {index + 1}
                    <span className="ml-2 font-normal text-gray-500">({q.points} {q.points === 1 ? 'punto' : 'puntos'})</span>
                  </legend>

                  {q.type === 'fill' ? (
                    <p className="text-gray-800 leading-loose">
                      {splitPrompt(q.prompt).map((part, i) =>
                        part.kind === 'text' ? (
                          <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                        ) : (
                          <input
                            key={i}
                            type="text"
                            aria-label={`Espacio ${part.index + 1}`}
                            maxLength={200}
                            value={(answers[q.id] as { blanks: string[] } | undefined)?.blanks?.[part.index] ?? ''}
                            onChange={(e) => {
                              const current = (answers[q.id] as { blanks: string[] } | undefined)?.blanks ?? []
                              const blanks = Array.from({ length: q.blankCount ?? 0 }, (_, bi) => current[bi] ?? '')
                              blanks[part.index] = e.target.value
                              setAnswer(q.id, { blanks })
                            }}
                            className="mx-1 inline-block w-40 px-2 py-1 border-b-2 border-[#a4c639] bg-[#f9f8f4] focus:outline-none focus:bg-white"
                          />
                        )
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-800 whitespace-pre-wrap mb-3">{q.prompt}</p>
                  )}

                  {q.type === 'single' && (
                    <div className="space-y-2">
                      {q.options?.map((o) => (
                        <label key={o.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-[#f9f8f4] has-[:checked]:border-[#a4c639] has-[:checked]:bg-[#a4c639]/10">
                          <input
                            type="radio"
                            name={q.id}
                            checked={(answers[q.id] as { optionId: string | null } | undefined)?.optionId === o.id}
                            onChange={() => setAnswer(q.id, { optionId: o.id })}
                            className="mt-0.5 accent-[#2d7a5f]"
                          />
                          <span className="text-sm text-gray-800">{o.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'multiple' && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Selecciona todas las correctas.</p>
                      {q.options?.map((o) => {
                        const selected = (answers[q.id] as { optionIds: string[] } | undefined)?.optionIds ?? []
                        const checked = selected.includes(o.id)
                        return (
                          <label key={o.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-[#f9f8f4] has-[:checked]:border-[#a4c639] has-[:checked]:bg-[#a4c639]/10">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setAnswer(q.id, {
                                optionIds: checked ? selected.filter((id) => id !== o.id) : [...selected, o.id],
                              })}
                              className="mt-0.5 accent-[#2d7a5f]"
                            />
                            <span className="text-sm text-gray-800">{o.text}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'essay' && (
                    <div>
                      <textarea
                        rows={6}
                        maxLength={10000}
                        aria-label={`Respuesta a la pregunta ${index + 1}`}
                        value={(answers[q.id] as { text: string } | undefined)?.text ?? ''}
                        onChange={(e) => setAnswer(q.id, { text: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#a4c639] focus:border-transparent text-sm resize-y"
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">
                        {((answers[q.id] as { text: string } | undefined)?.text ?? '').length} / 10000
                      </p>
                    </div>
                  )}
                </fieldset>
              </li>
            ))}
          </ol>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-600" aria-live="polite">
              {confirmUnanswered
                ? `Tienes ${unanswered} pregunta(s) sin responder. Pulsa "Enviar" otra vez para confirmar.`
                : quiz.hasEssay
                  ? 'Las preguntas de desarrollo las corrige tu instructor.'
                  : ''}
            </p>
            <button onClick={submit} disabled={submitting} className={primaryBtn}>
              {submitting ? 'Enviando...' : 'Enviar respuestas'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Intro / summary ─────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 lg:p-8">
      <div className={card}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#a4c639]/15 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#2d7a5f]" />
          </div>
          <h2 className="text-2xl font-bold text-[#2d7a5f]">{quiz.title}</h2>
        </div>

        {quiz.instructions && <p className="text-gray-600 text-sm whitespace-pre-wrap mb-6">{quiz.instructions}</p>}

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <dt className="text-xs text-gray-500">Preguntas</dt>
            <dd className="text-lg font-bold text-[#1a5744]">{quiz.questionCount}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Para aprobar</dt>
            <dd className="text-lg font-bold text-[#1a5744]">{quiz.passingScore}%</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Intentos</dt>
            <dd className="text-lg font-bold text-[#1a5744]">
              {quiz.maxAttempts === null ? `${state.attemptsUsed} (sin límite)` : `${state.attemptsUsed} de ${quiz.maxAttempts}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Mejor nota</dt>
            <dd className="text-lg font-bold text-[#1a5744]">{state.best ? pct(state.best.scorePercent) : 'Sin nota'}</dd>
          </div>
        </dl>

        {state.passed && (
          <p className="flex items-center gap-2 text-sm font-semibold text-[#1a5744] mb-4">
            <CheckCircle className="w-4 h-4 text-[#a4c639]" /> Aprobado. Esta lección está completada.
          </p>
        )}

        {state.pendingReview && (
          <p className="flex items-center gap-2 text-sm text-[#2d7a5f] mb-4">
            <Clock className="w-4 h-4" /> Tu último intento está en revisión. Verás tu nota cuando el instructor termine.
          </p>
        )}

        {state.essayComments.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold text-[#1a5744]">Comentarios de tu instructor</p>
            {state.essayComments.map((c, i) => (
              <div key={i} className="p-3 bg-[#f9f8f4] border border-[#e8e4d0] rounded-xl text-sm">
                <p className="text-gray-500 mb-1 line-clamp-2">{c.prompt}</p>
                <p className="text-gray-800 whitespace-pre-wrap">{c.comment}</p>
              </div>
            ))}
          </div>
        )}

        {state.canAttempt ? (
          <button onClick={start} className={primaryBtn}>
            {state.attemptsUsed === 0 ? 'Comenzar cuestionario' : 'Nuevo intento'}
          </button>
        ) : !state.pendingReview ? (
          <p className="text-sm text-gray-600">Ya usaste todos tus intentos.</p>
        ) : null}
      </div>
    </div>
  )
}
