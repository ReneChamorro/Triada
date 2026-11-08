'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageSquare, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

type Tab = 'platform' | 'reviews'

interface FeedbackRow {
  id: string
  user_name: string | null
  user_email: string | null
  category: 'sugerencia' | 'problema' | 'contenido' | 'otro'
  rating: number | null
  message: string
  status: 'nuevo' | 'leido' | 'resuelto'
  admin_note: string | null
  created_at: string
}

interface ReviewRow {
  id: string
  display_name: string
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  moderation_note: string | null
  created_at: string
  courses: { title: string } | null
}

const CATEGORY_LABELS: Record<FeedbackRow['category'], string> = {
  sugerencia: 'Sugerencia',
  problema: 'Problema o error',
  contenido: 'Contenido',
  otro: 'Otro',
}

const FEEDBACK_STATUS: { value: FeedbackRow['status']; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'leido', label: 'Leído' },
  { value: 'resuelto', label: 'Resuelto' },
]

const REVIEW_FILTERS: { value: ReviewRow['status']; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Publicadas' },
  { value: 'rejected', label: 'Rechazadas' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} aria-hidden="true"
          className={`w-3.5 h-3.5 ${n <= value ? 'text-[#a4c639] fill-[#a4c639]' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  )
}

async function patch(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
}

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState<Tab>('platform')
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackRow['status'] | 'all'>('nuevo')
  const [reviewFilter, setReviewFilter] = useState<ReviewRow['status']>('pending')
  const [feedback, setFeedback] = useState<FeedbackRow[]>([])
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      if (tab === 'platform') {
        let query = supabase
          .from('platform_feedback')
          .select('id, user_name, user_email, category, rating, message, status, admin_note, created_at')
          .order('created_at', { ascending: false })
          .limit(100)
        if (feedbackFilter !== 'all') query = query.eq('status', feedbackFilter)
        const { data, error } = await query
        if (error) throw error
        setFeedback((data ?? []) as FeedbackRow[])
      } else {
        const { data, error } = await supabase
          .from('course_reviews')
          .select('id, display_name, rating, comment, status, moderation_note, created_at, courses(title)')
          .eq('status', reviewFilter)
          .order('created_at', { ascending: reviewFilter === 'pending' })
          .limit(100)
        if (error) throw error
        setReviews((data ?? []) as unknown as ReviewRow[])
      }
    } catch (error) {
      logger.error('Error loading feedback:', error)
    } finally {
      setLoading(false)
    }
  }, [tab, feedbackFilter, reviewFilter])

  useEffect(() => { load() }, [load])

  const updateFeedback = async (row: FeedbackRow, status: FeedbackRow['status']) => {
    try {
      await patch(`/api/admin/feedback/${row.id}`, { status })
      await load()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const saveNote = async (row: FeedbackRow) => {
    const note = prompt('Nota interna (solo visible para el equipo):', row.admin_note ?? '')
    if (note === null) return
    try {
      await patch(`/api/admin/feedback/${row.id}`, { status: row.status, adminNote: note })
      await load()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const moderate = async (row: ReviewRow, status: 'approved' | 'rejected') => {
    let moderationNote: string | null = null
    if (status === 'rejected') {
      const reason = prompt('Motivo del rechazo (opcional, lo verá el estudiante):')
      if (reason === null) return
      moderationNote = reason.trim() || null
    }
    try {
      await patch(`/api/admin/reviews/${row.id}`, { status, moderationNote })
      await load()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-[#1a5744] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744]">Comentarios</h1>
        <p className="text-gray-500 mt-1">Opiniones sobre la plataforma y reseñas de los cursos.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button className={tabClass(tab === 'platform')} onClick={() => setTab('platform')}>Plataforma</button>
        <button className={tabClass(tab === 'reviews')} onClick={() => setTab('reviews')}>Reseñas de cursos</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tab === 'platform'
          ? [...FEEDBACK_STATUS, { value: 'all' as const, label: 'Todos' }].map((f) => (
              <button key={f.value} onClick={() => setFeedbackFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  feedbackFilter === f.value ? 'bg-[#a4c639]/25 text-[#1a5744]' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {f.label}
              </button>
            ))
          : REVIEW_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setReviewFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  reviewFilter === f.value ? 'bg-[#a4c639]/25 text-[#1a5744]' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {f.label}
              </button>
            ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a4c639]" />
        </div>
      ) : tab === 'platform' ? (
        feedback.length === 0 ? (
          <EmptyState text="No hay comentarios en esta vista" />
        ) : (
          <ul className="space-y-3">
            {feedback.map((row) => (
              <li key={row.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#2d7a5f] bg-[#a4c639]/15 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[row.category]}
                    </span>
                    {row.rating && <Stars value={row.rating} />}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>
                </div>
                <p className="text-gray-900 text-sm whitespace-pre-wrap mb-3">{row.message}</p>
                <p className="text-xs text-gray-500 mb-3">
                  {row.user_name ?? 'Usuario'}{row.user_email ? ` · ${row.user_email}` : ''}
                </p>
                {row.admin_note && (
                  <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2 mb-3">
                    <strong>Nota interna:</strong> {row.admin_note}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.status}
                    onChange={(e) => updateFeedback(row, e.target.value as FeedbackRow['status'])}
                    aria-label="Estado del comentario"
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#a4c639]"
                  >
                    {FEEDBACK_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <button onClick={() => saveNote(row)} className="text-sm font-semibold text-[#2d7a5f] hover:text-[#1a5744]">
                    {row.admin_note ? 'Editar nota' : 'Añadir nota'}
                  </button>
                  {row.user_email && (
                    <a href={`mailto:${row.user_email}`} className="text-sm font-semibold text-[#2d7a5f] hover:text-[#1a5744]">
                      Responder por email
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : reviews.length === 0 ? (
        <EmptyState text="No hay reseñas en esta vista" />
      ) : (
        <ul className="space-y-3">
          {reviews.map((row) => (
            <li key={row.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-[#1a5744]">{row.courses?.title ?? 'Curso'}</p>
                  <p className="text-xs text-gray-500">{row.display_name}</p>
                </div>
                <div className="text-right">
                  <Stars value={row.rating} />
                  <p className="text-xs text-gray-500">{formatDate(row.created_at)}</p>
                </div>
              </div>
              {row.comment
                ? <p className="text-gray-900 text-sm whitespace-pre-wrap mb-3">{row.comment}</p>
                : <p className="text-gray-400 text-sm italic mb-3">Sin comentario</p>}
              {row.moderation_note && (
                <p className="text-xs text-gray-600 mb-3"><strong>Motivo:</strong> {row.moderation_note}</p>
              )}
              <div className="flex gap-2">
                {row.status !== 'approved' && (
                  <button onClick={() => moderate(row, 'approved')}
                    className="px-4 py-2 bg-[#1a5744] hover:bg-[#2d7a5f] text-white rounded-lg text-sm font-semibold">
                    Aprobar
                  </button>
                )}
                {row.status !== 'rejected' && (
                  <button onClick={() => moderate(row, 'rejected')}
                    className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold">
                    {row.status === 'approved' ? 'Ocultar' : 'Rechazar'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
      <MessageSquare className="w-10 h-10 text-[#a4c639] mx-auto mb-3" />
      <p className="font-semibold text-[#1a5744]">{text}</p>
    </div>
  )
}
