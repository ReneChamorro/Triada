'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

type Status = 'pending_review' | 'graded' | 'all'

interface AttemptRow {
  id: string
  student: { name: string; email: string | null }
  course: { id: string; title: string }
  lesson: { id: string; title: string }
  attemptNumber: number
  status: 'pending_review' | 'graded'
  scorePercent: number | null
  passed: boolean | null
  submittedAt: string
}

const TABS: { value: Status; label: string }[] = [
  { value: 'pending_review', label: 'Pendientes de revisión' },
  { value: 'graded', label: 'Calificados' },
  { value: 'all', label: 'Todos' },
]

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })

export default function AdminQuizzesPage() {
  const [status, setStatus] = useState<Status>('pending_review')
  const [courseId, setCourseId] = useState('')
  const [page, setPage] = useState(1)
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [attempts, setAttempts] = useState<AttemptRow[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Reached from a course's content page with ?courseId=...
  const [entryCourseId, setEntryCourseId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('courseId')
    if (fromUrl) {
      setCourseId(fromUrl)
      setEntryCourseId(fromUrl)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    createClient()
      .from('courses')
      .select('id, title')
      .order('title')
      .then(({ data }) => setCourses(data ?? []))
  }, [])

  useEffect(() => {
    if (!ready) return
    const params = new URLSearchParams({ status, page: String(page) })
    if (courseId) params.set('courseId', courseId)
    setLoading(true)
    setError(null)
    fetch(`/api/admin/quiz-attempts?${params}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) throw new Error(body.error ?? 'Error al cargar')
        setAttempts(body.attempts)
        setTotal(body.total)
        setPageSize(body.pageSize)
      })
      .catch((err) => {
        logger.error('Error loading attempts:', err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [ready, status, courseId, page])

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-6">
        {entryCourseId && (
          <Link href={`/admin/courses/${entryCourseId}/content`}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1a5744] mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al contenido del curso</span>
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744]">Resultados de cuestionarios</h1>
        <p className="text-gray-500 mt-1">
          Corrige las respuestas de desarrollo y consulta las notas de los estudiantes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                status === tab.value ? 'bg-[#1a5744] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={courseId}
          onChange={(e) => { setCourseId(e.target.value); setPage(1) }}
          aria-label="Filtrar por curso"
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
        >
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a4c639]" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-red-600 text-sm">{error}</p>
        ) : attempts.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardCheck className="w-10 h-10 text-[#a4c639] mx-auto mb-3" />
            <p className="font-semibold text-[#1a5744]">
              {status === 'pending_review' ? 'No hay intentos pendientes de revisión' : 'No hay intentos'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Estudiante</th>
                  <th className="px-4 py-3 font-semibold">Curso / cuestionario</th>
                  <th className="px-4 py-3 font-semibold">Intento</th>
                  <th className="px-4 py-3 font-semibold">Enviado</th>
                  <th className="px-4 py-3 font-semibold">Resultado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.student.name}</p>
                      {a.student.email && <p className="text-xs text-gray-500">{a.student.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{a.course.title}</p>
                      <p className="text-xs text-gray-500">{a.lesson.title}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">#{a.attemptNumber}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(a.submittedAt)}</td>
                    <td className="px-4 py-3">
                      {a.status === 'pending_review' ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">En revisión</span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          a.passed ? 'bg-[#a4c639]/20 text-[#1a5744]' : 'bg-red-100 text-red-700'
                        }`}>
                          {a.scorePercent}% {a.passed ? 'Aprobado' : 'No aprobado'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/quizzes/attempts/${a.id}`}
                        className="text-sm font-semibold text-[#2d7a5f] hover:text-[#1a5744] whitespace-nowrap"
                      >
                        {a.status === 'pending_review' ? 'Calificar' : 'Ver'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4 text-sm">
          <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Página anterior"
            className="p-2 border border-gray-200 rounded-lg disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-gray-600">Página {page} de {pages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= pages} aria-label="Página siguiente"
            className="p-2 border border-gray-200 rounded-lg disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
