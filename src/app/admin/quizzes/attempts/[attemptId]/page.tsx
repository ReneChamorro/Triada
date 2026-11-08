'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Answer {
  id: string
  position: number
  question_type: 'single' | 'multiple' | 'fill' | 'essay'
  question_prompt: string
  question_options: { id: string; text: string }[] | null
  max_points: number
  response: Record<string, unknown> | null
  points_awarded: number | null
  feedback: string | null
  key: { correctOptionIds: string[]; blankAnswers: string[][]; strict: boolean } | null
  graderNotes: string | null
}

interface AttemptDetail {
  attempt: {
    attempt_number: number
    status: 'pending_review' | 'graded'
    passing_score: number
    max_points: number
    score_percent: number | null
    passed: boolean | null
    submitted_at: string
  }
  student: { name: string; email: string | null }
  course: { title: string }
  lesson: { title: string }
  answers: Answer[]
}

const TYPE_LABELS = { single: 'Opción única', multiple: 'Opción múltiple', fill: 'Completación', essay: 'Desarrollo' }

function describeResponse(a: Answer): string {
  const r = a.response ?? {}
  const optionText = (id: unknown) => a.question_options?.find((o) => o.id === id)?.text ?? 'Opción eliminada'
  switch (a.question_type) {
    case 'single':
      return r.optionId ? optionText(r.optionId) : 'Sin responder'
    case 'multiple': {
      const ids = (r.optionIds as string[] | undefined) ?? []
      return ids.length ? ids.map(optionText).join(', ') : 'Sin responder'
    }
    case 'fill': {
      const blanks = (r.blanks as string[] | undefined) ?? []
      return blanks.length ? blanks.map((b, i) => `${i + 1}) ${b || '(vacío)'}`).join('   ') : 'Sin responder'
    }
    default:
      return ''
  }
}

function describeKey(a: Answer): string | null {
  if (!a.key) return null
  if (a.question_type === 'single' || a.question_type === 'multiple') {
    return a.key.correctOptionIds
      .map((id) => a.question_options?.find((o) => o.id === id)?.text ?? 'Opción eliminada')
      .join(', ')
  }
  if (a.question_type === 'fill') {
    return a.key.blankAnswers.map((list, i) => `${i + 1}) ${list.join(' / ')}`).join('   ')
  }
  return null
}

export default function GradeAttemptPage() {
  const router = useRouter()
  const { attemptId } = useParams<{ attemptId: string }>()
  const [detail, setDetail] = useState<AttemptDetail | null>(null)
  const [grades, setGrades] = useState<Record<string, { points: string; feedback: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/quiz-attempts/${attemptId}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      setDetail(body)
      const initial: Record<string, { points: string; feedback: string }> = {}
      for (const a of body.answers as Answer[]) {
        if (a.question_type === 'essay') {
          initial[a.id] = {
            points: a.points_awarded === null ? '' : String(a.points_awarded),
            feedback: a.feedback ?? '',
          }
        }
      }
      setGrades(initial)
    } catch (error) {
      logger.error('Error loading attempt:', error)
      alert('No se pudo cargar el intento')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [attemptId])

  const submit = async (finalize: boolean) => {
    const entries = Object.entries(grades).filter(([, g]) => g.points !== '')
    if (finalize && entries.length < Object.keys(grades).length) {
      alert('Asigna puntos a todas las preguntas de desarrollo antes de finalizar')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quiz-attempts/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalize,
          grades: entries.map(([answerId, g]) => ({
            answerId,
            points: Number(g.points),
            feedback: g.feedback.trim() || null,
          })),
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      if (finalize) {
        alert(`Calificación final: ${body.scorePercent}% (${body.passed ? 'Aprobado' : 'No aprobado'})`)
        router.push('/admin/quizzes')
      } else {
        await load()
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]" />
      </div>
    )
  }

  const { attempt } = detail
  const hasEssays = Object.keys(grades).length > 0

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <button onClick={() => router.push('/admin/quizzes')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#1a5744] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a cuestionarios</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h1 className="text-2xl font-bold text-[#1a5744]">{detail.lesson.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{detail.course.title}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-gray-700">
          <span><strong>Estudiante:</strong> {detail.student.name}{detail.student.email ? ` (${detail.student.email})` : ''}</span>
          <span><strong>Intento:</strong> #{attempt.attempt_number}</span>
          <span><strong>Aprobación:</strong> {attempt.passing_score}%</span>
          <span>
            <strong>Estado:</strong>{' '}
            {attempt.status === 'pending_review'
              ? 'En revisión'
              : `${attempt.score_percent}% ${attempt.passed ? 'Aprobado' : 'No aprobado'}`}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {detail.answers.map((a, i) => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-semibold text-[#1a5744]">
                Pregunta {i + 1} <span className="font-normal text-gray-500">· {TYPE_LABELS[a.question_type]}</span>
              </p>
              {a.question_type !== 'essay' && (
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  {a.points_awarded ?? 0} / {a.max_points} pts
                </span>
              )}
            </div>
            <p className="text-gray-900 whitespace-pre-wrap mb-3">{a.question_prompt}</p>

            {a.question_type === 'essay' ? (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                  {(a.response?.text as string) || 'Sin responder'}
                </div>
                {a.graderNotes && (
                  <p className="text-xs text-gray-500"><strong>Notas para el corrector:</strong> {a.graderNotes}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#1a5744] mb-1">Puntos (máx. {a.max_points})</label>
                    <input
                      type="number"
                      min={0}
                      max={a.max_points}
                      step={0.5}
                      value={grades[a.id]?.points ?? ''}
                      onChange={(e) => setGrades((g) => ({ ...g, [a.id]: { ...g[a.id], points: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1a5744] mb-1">Comentario para el estudiante</label>
                    <textarea
                      rows={2}
                      value={grades[a.id]?.feedback ?? ''}
                      onChange={(e) => setGrades((g) => ({ ...g, [a.id]: { ...g[a.id], feedback: e.target.value } }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent resize-y text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Respuesta:</span> <span className="text-gray-900">{describeResponse(a)}</span></p>
                {describeKey(a) && (
                  <p><span className="text-gray-500">Correcta:</span> <span className="text-[#1a5744] font-medium">{describeKey(a)}</span></p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hasEssays && (
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => submit(false)} disabled={saving}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Guardar borrador
          </button>
          <button onClick={() => submit(true)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a5744] text-white rounded-lg hover:bg-[#2d7a5f] disabled:opacity-50">
            <Save className="w-4 h-4" />
            {attempt.status === 'graded' ? 'Recalificar' : 'Finalizar calificación'}
          </button>
        </div>
      )}
    </div>
  )
}
