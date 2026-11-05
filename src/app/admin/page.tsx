'use client'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, DollarSign, ArrowRight,
  Users, LayoutDashboard, Shield,
} from 'lucide-react'

interface DashboardStats {
  totalCourses: number
  totalRevenue: number
}

interface RecentCourse {
  id: string
  title: string
  enrolled_count: number
  created_at: string
}

const QUICK_ACTIONS = [
  {
    label: 'Crear Curso',
    desc: 'Nuevo contenido a la plataforma',
    icon: BookOpen,
    href: '/admin/courses/new',
    bg: 'bg-[#e8e4d0]',
    iconBg: 'bg-[#1a5744]',
    iconColor: 'text-[#a4c639]',
    textColor: 'text-[#1a5744]',
  },
  {
    label: 'Gestionar Usuarios',
    desc: 'Ver y administrar estudiantes',
    icon: Users,
    href: '/admin/usuarios',
    bg: 'bg-[#2d7a5f]',
    iconBg: 'bg-[#a4c639]',
    iconColor: 'text-[#1a5744]',
    textColor: 'text-[#e8e4d0]',
  },
  {
    label: 'Landing Page',
    desc: 'Editar página principal',
    icon: LayoutDashboard,
    href: '/admin/landing',
    bg: 'bg-[#1a5744]',
    iconBg: 'bg-[#a4c639]',
    iconColor: 'text-[#1a5744]',
    textColor: 'text-[#e8e4d0]',
  },
  {
    label: 'Otorgar Acceso',
    desc: 'Acceso manual a cursos',
    icon: Shield,
    href: '/admin/grant-access',
    bg: 'bg-[#a4c639]',
    iconBg: 'bg-[#1a5744]',
    iconColor: 'text-[#a4c639]',
    textColor: 'text-[#1a1a1a]',
  },
]

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({ totalCourses: 0, totalRevenue: 0 })
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([])

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        router.push('/'); return
      }
      await loadDashboardData()
    } catch (error) {
      logger.error('Error checking user:', error)
      router.push('/login')
    }
  }

  async function loadDashboardData() {
    try {
      const { count: coursesCount } = await supabase
        .from('courses').select('*', { count: 'exact', head: true })

      const { data: enrollments } = await supabase
        .from('enrollments').select('courses(price)').eq('payment_status', 'completed')

      const totalRevenue = enrollments?.reduce((sum: number, e: any) =>
        sum + (e.courses?.price || 0), 0) || 0

      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, enrolled_count, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({ totalCourses: coursesCount || 0, totalRevenue })
      setRecentCourses(courses || [])
    } catch (error) {
      logger.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#1a5744] border-r-transparent animate-spin" role="status" aria-label="Cargando" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <span className="text-[#2d7a5f] text-xs font-bold uppercase tracking-widest block mb-2">
          Panel de Control
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a5744]">
          Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1a5744] rounded-[1.5rem] p-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-[#a4c639] rounded-xl flex items-center justify-center shrink-0">
            <BookOpen className="h-8 w-8 text-[#1a5744]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#e8e4d0]/90 uppercase tracking-widest mb-1">
              Total Cursos
            </p>
            <p className="text-4xl font-bold text-[#e8e4d0] tracking-tight leading-none">
              {stats.totalCourses}
            </p>
          </div>
        </div>

        <div className="bg-[#a4c639] rounded-[1.5rem] p-6 flex items-center gap-5">
          <div className="w-16 h-16 bg-[#1a5744] rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="h-8 w-8 text-[#a4c639]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1a1a1a] uppercase tracking-widest mb-1">
              Ingresos Totales
            </p>
            <p className="text-4xl font-bold text-[#1a1a1a] tracking-tight leading-none">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`${action.bg} rounded-[1.5rem] p-5 text-left active:scale-[0.98] [transition:transform_150ms_var(--ease-out),box-shadow_200ms_var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-md`}
            >
              <div className={`w-11 h-11 ${action.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} aria-hidden="true" />
              </div>
              <p className={`text-sm font-bold ${action.textColor} tracking-tight mb-0.5`}>
                {action.label}
              </p>
              <p className={`text-xs ${action.textColor} opacity-90 leading-tight`}>
                {action.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent courses */}
      <div>
        <h2 className="text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-4">
          Cursos Recientes
        </h2>

        <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden">
          {recentCourses.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-[#1a5744]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-[#1a5744]" aria-hidden="true" />
              </div>
              <p className="text-[#1a5744] font-semibold mb-4 text-sm">No hay cursos creados aún</p>
              <Link
                href="/admin/courses/new"
                className="inline-flex items-center min-h-11 bg-[#1a5744] text-white px-6 rounded-xl text-sm font-semibold
                           hover:bg-[#2d7a5f] active:scale-[0.97] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
              >
                Crear Primer Curso
              </Link>
            </div>
          ) : (
            recentCourses.map((course, i) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}/edit`}
                className={`flex items-center justify-between px-6 py-4
                  hover:bg-[#f5f3e8] transition-colors group
                  ${i < recentCourses.length - 1 ? 'border-b border-[#e8e4d0]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1a5744]/10 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-[#1a5744]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a5744] group-hover:text-[#2d7a5f] transition-colors leading-tight">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(course.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Estudiantes</p>
                    <p className="text-sm font-bold text-[#1a5744]">{course.enrolled_count}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1a5744]" aria-hidden="true" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


