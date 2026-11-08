'use client'

import { useState } from 'react'
import Link from 'next/link'
import StarRating from './StarRating'

interface Props {
  courseId: string
  initial: {
    rating: number
    comment: string | null
    status: 'pending' | 'approved' | 'rejected'
    moderationNote: string | null
  } | null
}

const STATUS_COPY = {
  pending: 'Tu opinión está en revisión. La publicaremos cuando la aprobemos.',
  approved: 'Tu opinión está publicada en la página del curso.',
  rejected: 'Tu opinión no fue publicada.',
}

export default function ReviewForm({ courseId, initial }: Props) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [status, setStatus] = useState(initial?.status ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Elige una calificación de 1 a 5 estrellas')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'No se pudo guardar tu opinión')
      setStatus('pending')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu opinión')
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6" role="status">
        <p className="text-lg font-semibold text-[#1a5744] mb-2">Gracias por tu opinión</p>
        <p className="text-sm text-[#1a5744]/85 mb-6">{STATUS_COPY.pending}</p>
        <Link href={`/courses/${courseId}`} className="text-sm font-semibold text-[#2d7a5f] hover:text-[#1a5744]">
          Volver al curso
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {status && (
        <p className="text-sm p-3 rounded-xl bg-[#f5f3e8] text-[#1a5744]">
          {STATUS_COPY[status]}
          {status === 'rejected' && initial?.moderationNote ? ` Motivo: ${initial.moderationNote}` : ''}
          {' '}Si la editas, volverá a revisión.
        </p>
      )}

      <div>
        <p className="block text-sm font-semibold text-[#1a5744] mb-2">Tu calificación</p>
        <StarRating value={rating} onChange={setRating} label="Tu calificación del curso" />
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-semibold text-[#1a5744] mb-2">
          Comentario <span className="font-normal text-[#1a5744]/70">(opcional)</span>
        </label>
        <textarea
          id="review-comment"
          rows={5}
          maxLength={1500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Qué te aportó el curso? ¿Cómo lo aplicas en tu práctica?"
          className="w-full px-4 py-3 border border-[#e8e4d0] rounded-xl focus:ring-2 focus:ring-[#a4c639] focus:border-transparent text-sm resize-y"
        />
        <p className="text-xs text-[#1a5744]/70 text-right mt-1">{comment.length} / 1500</p>
      </div>

      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full sm:w-auto bg-[#1a5744] hover:bg-[#2d7a5f] text-white px-8 min-h-12 rounded-xl font-semibold disabled:opacity-50 active:scale-[0.98] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
      >
        {submitting ? 'Enviando...' : initial ? 'Actualizar opinión' : 'Enviar opinión'}
      </button>
    </form>
  )
}
