'use client'

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { countBlanks } from '@/lib/quiz/blanks'
import type { QuizDefinition } from '@/lib/quiz/schemas'

// Editor state. Fill-in answers are edited as text (one accepted answer per
// line) and converted to the API shape with toQuizDefinition().

type Option = { id: string; text: string }

export type EditorQuestion =
  | { id: string; type: 'single' | 'multiple'; prompt: string; points: number; options: Option[]; correctOptionIds: string[] }
  | { id: string; type: 'fill'; prompt: string; points: number; blanksText: string[]; strict: boolean }
  | { id: string; type: 'essay'; prompt: string; points: number; graderNotes: string }

export interface EditorQuiz {
  instructions: string
  passingScore: number
  maxAttempts: number | null
  questions: EditorQuestion[]
}

const TYPE_LABELS: Record<EditorQuestion['type'], string> = {
  single: 'Opción única',
  multiple: 'Opción múltiple',
  fill: 'Completación',
  essay: 'Desarrollo',
}

const newId = () => crypto.randomUUID()

export function emptyQuiz(): EditorQuiz {
  return { instructions: '', passingScore: 70, maxAttempts: 3, questions: [] }
}

export function toEditorQuiz(definition: QuizDefinition | null): EditorQuiz {
  if (!definition) return emptyQuiz()
  return {
    instructions: definition.instructions ?? '',
    passingScore: definition.passingScore,
    maxAttempts: definition.maxAttempts,
    questions: definition.questions.map((q): EditorQuestion => {
      switch (q.type) {
        case 'single':
        case 'multiple':
          return { id: q.id, type: q.type, prompt: q.prompt, points: q.points, options: q.options, correctOptionIds: q.correctOptionIds }
        case 'fill':
          return { id: q.id, type: 'fill', prompt: q.prompt, points: q.points, blanksText: q.blanks.map((b) => b.join('\n')), strict: q.strict }
        case 'essay':
          return { id: q.id, type: 'essay', prompt: q.prompt, points: q.points, graderNotes: q.graderNotes ?? '' }
      }
    }),
  }
}

export function toQuizDefinition(quiz: EditorQuiz): QuizDefinition {
  return {
    instructions: quiz.instructions.trim() || null,
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts,
    questions: quiz.questions.map((q) => {
      switch (q.type) {
        case 'single':
        case 'multiple':
          return { id: q.id, type: q.type, prompt: q.prompt, points: q.points, options: q.options, correctOptionIds: q.correctOptionIds }
        case 'fill':
          return {
            id: q.id,
            type: 'fill',
            prompt: q.prompt,
            points: q.points,
            strict: q.strict,
            blanks: q.blanksText.map((text) => text.split('\n').map((line) => line.trim()).filter(Boolean)),
          }
        case 'essay':
          return { id: q.id, type: 'essay', prompt: q.prompt, points: q.points, graderNotes: q.graderNotes.trim() || null }
      }
    }) as QuizDefinition['questions'],
  }
}

function newQuestion(type: EditorQuestion['type']): EditorQuestion {
  switch (type) {
    case 'single':
    case 'multiple':
      return {
        id: newId(),
        type,
        prompt: '',
        points: 1,
        options: [{ id: newId(), text: '' }, { id: newId(), text: '' }],
        correctOptionIds: [],
      }
    case 'fill':
      return { id: newId(), type: 'fill', prompt: '', points: 1, blanksText: [], strict: false }
    case 'essay':
      return { id: newId(), type: 'essay', prompt: '', points: 5, graderNotes: '' }
  }
}

const input =
  'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent'
const label = 'block text-sm font-semibold text-[#1a5744] mb-2'

interface Props {
  value: EditorQuiz
  onChange: (value: EditorQuiz) => void
  attemptCount?: number
}

export default function QuizEditor({ value, onChange, attemptCount = 0 }: Props) {
  const update = (patch: Partial<EditorQuiz>) => onChange({ ...value, ...patch })

  const updateQuestion = (index: number, next: EditorQuestion) => {
    const questions = [...value.questions]
    questions[index] = next
    update({ questions })
  }

  const moveQuestion = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= value.questions.length) return
    const questions = [...value.questions]
    ;[questions[index], questions[target]] = [questions[target], questions[index]]
    update({ questions })
  }

  const removeQuestion = (index: number) => {
    if (!confirm('¿Eliminar esta pregunta?')) return
    update({ questions: value.questions.filter((_, i) => i !== index) })
  }

  const setPrompt = (index: number, prompt: string) => {
    const q = value.questions[index]
    if (q.type === 'fill') {
      // Keep one answer list per [[ ]] marker in the prompt.
      const n = countBlanks(prompt)
      const blanksText = Array.from({ length: n }, (_, i) => q.blanksText[i] ?? '')
      updateQuestion(index, { ...q, prompt, blanksText })
    } else {
      updateQuestion(index, { ...q, prompt })
    }
  }

  const totalPoints = value.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)

  return (
    <div className="space-y-6">
      {attemptCount > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Este cuestionario ya tiene {attemptCount} intento(s). Los cambios no recalifican intentos anteriores.
        </div>
      )}

      {/* Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Puntaje mínimo para aprobar (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={value.passingScore}
            onChange={(e) => update({ passingScore: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Intentos permitidos</label>
          <input
            type="number"
            min={1}
            max={50}
            value={value.maxAttempts ?? ''}
            placeholder="Sin límite"
            onChange={(e) => {
              const n = parseInt(e.target.value)
              update({ maxAttempts: Number.isNaN(n) ? null : Math.min(50, Math.max(1, n)) })
            }}
            className={input}
          />
          <p className="text-xs text-gray-500 mt-1">Déjalo vacío para intentos ilimitados. Cuenta la mejor nota.</p>
        </div>
      </div>

      <div>
        <label className={label}>Instrucciones para el estudiante</label>
        <textarea
          rows={3}
          value={value.instructions}
          onChange={(e) => update({ instructions: e.target.value })}
          className={`${input} resize-none`}
          placeholder="Ej: Lee cada pregunta con atención. Tienes 3 intentos."
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1a5744]">Preguntas ({value.questions.length})</h3>
          <span className="text-sm text-gray-500">Total: {totalPoints} pts</span>
        </div>

        {value.questions.map((q, index) => (
          <div key={q.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4 bg-gray-50/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[#1a5744]">
                Pregunta {index + 1}
                <span className="ml-2 text-xs font-medium text-[#2d7a5f] bg-[#a4c639]/15 px-2 py-0.5 rounded-full">
                  {TYPE_LABELS[q.type]}
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Subir pregunta" onClick={() => moveQuestion(index, -1)} disabled={index === 0}
                  className="p-1.5 text-gray-500 hover:text-[#1a5744] disabled:opacity-30">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Bajar pregunta" onClick={() => moveQuestion(index, 1)} disabled={index === value.questions.length - 1}
                  className="p-1.5 text-gray-500 hover:text-[#1a5744] disabled:opacity-30">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button type="button" aria-label="Eliminar pregunta" onClick={() => removeQuestion(index)}
                  className="p-1.5 text-red-500 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
              <div>
                <label className={label}>Enunciado</label>
                <textarea
                  rows={q.type === 'fill' ? 3 : 2}
                  value={q.prompt}
                  onChange={(e) => setPrompt(index, e.target.value)}
                  className={`${input} resize-y bg-white`}
                  placeholder={q.type === 'fill' ? 'Ej: La terapia [[ ]] fue desarrollada por Aaron [[ ]].' : 'Escribe la pregunta'}
                />
                {q.type === 'fill' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Escribe <code className="px-1 bg-white border rounded">[[ ]]</code> en cada espacio a completar. No pongas la respuesta dentro.
                  </p>
                )}
              </div>
              <div>
                <label className={label}>Puntos</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={q.points}
                  onChange={(e) => updateQuestion(index, { ...q, points: parseFloat(e.target.value) || 0 })}
                  className={`${input} bg-white`}
                />
              </div>
            </div>

            {(q.type === 'single' || q.type === 'multiple') && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#1a5744]">
                  Opciones <span className="font-normal text-gray-500">
                    ({q.type === 'single' ? 'marca la correcta' : 'marca todas las correctas'})
                  </span>
                </p>
                {q.options.map((option, oi) => {
                  const checked = q.correctOptionIds.includes(option.id)
                  return (
                    <div key={option.id} className="flex items-center gap-2">
                      <input
                        type={q.type === 'single' ? 'radio' : 'checkbox'}
                        name={`correct-${q.id}`}
                        checked={checked}
                        aria-label={`Marcar opción ${oi + 1} como correcta`}
                        onChange={() => {
                          const correctOptionIds = q.type === 'single'
                            ? [option.id]
                            : checked
                              ? q.correctOptionIds.filter((id) => id !== option.id)
                              : [...q.correctOptionIds, option.id]
                          updateQuestion(index, { ...q, correctOptionIds })
                        }}
                        className="w-4 h-4 accent-[#2d7a5f]"
                      />
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const options = q.options.map((o) => (o.id === option.id ? { ...o, text: e.target.value } : o))
                          updateQuestion(index, { ...q, options })
                        }}
                        className={`${input} bg-white py-2`}
                        placeholder={`Opción ${oi + 1}`}
                      />
                      <button
                        type="button"
                        aria-label={`Eliminar opción ${oi + 1}`}
                        disabled={q.options.length <= 2}
                        onClick={() => updateQuestion(index, {
                          ...q,
                          options: q.options.filter((o) => o.id !== option.id),
                          correctOptionIds: q.correctOptionIds.filter((id) => id !== option.id),
                        })}
                        className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
                {q.options.length < 10 && (
                  <button
                    type="button"
                    onClick={() => updateQuestion(index, { ...q, options: [...q.options, { id: newId(), text: '' }] })}
                    className="text-sm font-semibold text-[#2d7a5f] hover:text-[#1a5744]"
                  >
                    + Agregar opción
                  </button>
                )}
              </div>
            )}

            {q.type === 'fill' && (
              <div className="space-y-3">
                {q.blanksText.length === 0 ? (
                  <p className="text-sm text-gray-500">Agrega al menos un espacio [[ ]] al enunciado.</p>
                ) : (
                  q.blanksText.map((text, bi) => (
                    <div key={bi}>
                      <label className="block text-sm font-semibold text-[#1a5744] mb-1">
                        Respuestas aceptadas para el espacio {bi + 1}
                      </label>
                      <textarea
                        rows={2}
                        value={text}
                        onChange={(e) => {
                          const blanksText = [...q.blanksText]
                          blanksText[bi] = e.target.value
                          updateQuestion(index, { ...q, blanksText })
                        }}
                        className={`${input} bg-white resize-y text-sm`}
                        placeholder="Una respuesta por línea (ej: Beck)"
                      />
                    </div>
                  ))
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={q.strict}
                    onChange={(e) => updateQuestion(index, { ...q, strict: e.target.checked })}
                    className="w-4 h-4 accent-[#2d7a5f]"
                  />
                  Distinguir mayúsculas y acentos
                </label>
              </div>
            )}

            {q.type === 'essay' && (
              <div>
                <label className={label}>Notas para el corrector (no las ve el estudiante)</label>
                <textarea
                  rows={2}
                  value={q.graderNotes}
                  onChange={(e) => updateQuestion(index, { ...q, graderNotes: e.target.value })}
                  className={`${input} bg-white resize-y text-sm`}
                  placeholder="Criterios o puntos clave esperados"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta pregunta la corriges tú. El estudiante verá su nota cuando termines de calificar.
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as EditorQuestion['type'][]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => update({ questions: [...value.questions, newQuestion(type)] })}
              className="flex items-center gap-1.5 px-3 py-2 border border-[#2d7a5f]/30 text-[#2d7a5f] rounded-lg text-sm font-semibold hover:bg-[#a4c639]/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
