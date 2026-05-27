'use client'
import { logger } from '@/lib/logger'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, FileText } from 'lucide-react'
import { motion } from 'motion/react'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  price: number
  category: string
  level: string
  status: string
  enrolled_count: number
  image_url: string | null
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  web_development: 'Desarrollo Web',
  mobile_development: 'Desarrollo Móvil',
  data_science: 'Ciencia de Datos',
  design: 'Diseño',
  marketing: 'Marketing',
  business: 'Negocios',
  psychology: 'Psicología',
  other: 'Otro',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}

export default function CoursesPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    loadCourses()
  }, [filter])

  async function loadCourses() {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      logger.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id)
      if (error) throw error
      setCourses(courses.filter(c => c.id !== id))
    } catch (error) {
      logger.error('Error deleting course:', error)
      alert('Error al eliminar el curso')
    }
  }

  async function toggleStatus(course: Course) {
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    try {
      const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', course.id)
      if (error) throw error
      setCourses(courses.map(c => c.id === course.id ? { ...c, status: newStatus } : c))
    } catch (error) {
      logger.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8"
      >
        <div>
          <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-2">
            Contenido
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
            Cursos
          </h1>
          <p className="text-[#1a5744]/50 mt-1 text-sm">
            Administra los cursos de la plataforma
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/courses/new')}
          className="flex items-center gap-2 bg-[#a4c639] text-white px-5 py-2.5
                     rounded-xl font-bold text-sm hover:bg-[#2d7a5f] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {([
          { key: 'all', label: `Todos (${courses.length})` },
          { key: 'published', label: 'Publicados' },
          { key: 'draft', label: 'Borradores' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              filter === key
                ? 'bg-[#1a5744] text-white'
                : 'bg-white border border-[#e8e4d0] text-[#1a5744]/60 hover:border-[#1a5744]/30 hover:text-[#1a5744]'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-16 text-center"
        >
          <div className="w-16 h-16 bg-[#a4c639]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#a4c639]" />
          </div>
          <h3 className="text-lg font-black text-[#1a5744] tracking-tight mb-2">
            No hay cursos {filter !== 'all' && `en estado ${filter}`}
          </h3>
          <p className="text-[#1a5744]/40 text-sm mb-6">Comienza creando tu primer curso</p>
          <button
            onClick={() => router.push('/admin/courses/new')}
            className="bg-[#a4c639] text-white px-6 py-2.5 rounded-full font-bold
                       text-sm hover:bg-[#2d7a5f] transition-colors"
          >
            Crear Curso
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden
                         hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="w-full sm:w-44 h-40 sm:h-auto bg-[#e8e4d0] flex-shrink-0 flex items-center justify-center">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-10 h-10 text-[#1a5744]/25" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-[#1a5744] tracking-tight mb-1">
                        {course.title}
                      </h3>
                      <p className="text-[#1a5744]/50 text-sm line-clamp-2 mb-3">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-[#e8e4d0] text-[#1a5744] text-xs font-semibold px-3 py-1 rounded-full">
                          {CATEGORY_LABELS[course.category] || course.category}
                        </span>
                        <span className="bg-[#e8e4d0] text-[#1a5744] text-xs font-semibold px-3 py-1 rounded-full">
                          {LEVEL_LABELS[course.level] || course.level}
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          course.status === 'published'
                            ? 'bg-[#a4c639]/20 text-[#2d7a5f]'
                            : 'bg-[#e8e4d0] text-[#1a5744]/60'
                        }`}>
                          {course.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-[#1a5744] tracking-tight leading-none">
                        ${course.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#1a5744]/40 mt-1">
                        {course.enrolled_count} estudiantes
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#e8e4d0]">
                    <button
                      onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#a4c639] text-white
                                 rounded-xl text-sm font-semibold hover:bg-[#2d7a5f] transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>

                    <button
                      onClick={() => router.push(`/admin/courses/${course.id}/content`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#1a5744] text-white
                                 rounded-xl text-sm font-semibold hover:bg-[#2d7a5f] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Contenido
                    </button>

                    <button
                      onClick={() => toggleStatus(course)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#e8e4d0] text-[#1a5744]
                                 rounded-xl text-sm font-semibold hover:bg-[#d4d0bc] transition-colors"
                    >
                      {course.status === 'published' ? (
                        <><EyeOff className="w-3.5 h-3.5" /><span>Ocultar</span></>
                      ) : (
                        <><Eye className="w-3.5 h-3.5" /><span>Publicar</span></>
                      )}
                    </button>

                    <button
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#e8e4d0] text-[#1a5744]
                                 rounded-xl text-sm font-semibold hover:bg-[#d4d0bc] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver
                    </button>

                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600
                                 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors sm:ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
