'use client'

import { useState } from 'react'
import Link from 'next/link'
import StarRating from '@/components/reviews/StarRating'

const CATEGORIES = [
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'problema', label: 'Problema o error' },
  { value: 'contenido', label: 'Contenido de los cursos' },
  { value: 'otro', label: 'Otro' },
] as const

type Category = (typeof CATEGORIES)[number]['value']

export default function FeedbackForm() {
  const [category, setCategory] = useState<Category>('sugerencia')
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 10) {
      setError('Cuéntanos un poco más (mínimo 10 caracteres)')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, rating: rating || null, message: message.trim() }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'No se pudo enviar tu comentario')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar tu comentario')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6" role="status">
        <p className="text-lg font-semibold text-[#1a5744] mb-2">Gracias. Recibimos tus comentarios.</p>
        <p className="text-sm text-[#1a5744]/85 mb-6">Nuestro equipo los revisa para mejorar la plataforma.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-[#2d7a5f] hover:text-[#1a5744]">
          Volver a mi panel
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="feedback-category" className="block text-sm font-semibold text-[#1a5744] mb-2">
          Tema
        </label>
        <select
          id="feedback-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full px-4 py-2.5 border border-[#e8e4d0] rounded-xl focus:ring-2 focus:ring-[#a4c639] focus:border-transparent text-sm bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="block text-sm font-semibold text-[#1a5744] mb-2">
          ¿Cómo calificarías tu experiencia? <span className="font-normal text-[#1a5744]/70">(opcional)</span>
        </p>
        <StarRating value={rating} onChange={setRating} label="Calificación de la plataforma" />
      </div>

      <div>
        <label htmlFor="feedback-message" className="block text-sm font-semibold text-[#1a5744] mb-2">
          Tu comentario
        </label>
        <textarea
          id="feedback-message"
          rows={6}
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos qué podemos mejorar o qué te funcionó bien"
          className="w-full px-4 py-3 border border-[#e8e4d0] rounded-xl focus:ring-2 focus:ring-[#a4c639] focus:border-transparent text-sm resize-y"
        />
        <p className="text-xs text-[#1a5744]/70 text-right mt-1">{message.length} / 2000</p>
      </div>

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-[#1a5744] hover:bg-[#2d7a5f] text-white px-8 min-h-12 rounded-xl font-semibold disabled:opacity-50 active:scale-[0.98] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
      >
        {submitting ? 'Enviando...' : 'Enviar comentarios'}
      </button>
    </form>
  )
}
