'use client'
import { logger } from '@/lib/logger'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
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
    iconBg: 'bg-[#1a5744]/15',
    iconColor: 'text-[#1a5744]',
    textColor: 'text-[#1a5744]',
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
        <div className="w-10 h-10 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-2">
          Panel de Control
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
          Dashboard
        </h1>
      </div>

      {/* â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#1a5744] rounded-[1.5rem] p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 bg-[#a4c639] rounded-[20px] flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-8 w-8 text-[#1a5744]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#e8e4d0]/60 uppercase tracking-widest mb-1">
              Total Cursos
            </p>
            <p className="text-4xl font-black text-[#e8e4d0] tracking-tighter leading-none">
              {stats.totalCourses}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-[#a4c639] rounded-[1.5rem] p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 bg-[#1a5744]/15 rounded-[20px] flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-8 w-8 text-[#1a5744]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1a5744]/60 uppercase tracking-widest mb-1">
              Ingresos Totales
            </p>
            <p className="text-4xl font-black text-[#1a5744] tracking-tighter leading-none">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>

      {/* â”€â”€ Quick Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mb-8">
        <h2 className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
              whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
              onClick={() => router.push(action.href)}
              className={`${action.bg} rounded-[1.5rem] p-5 text-left group transition-shadow hover:shadow-lg`}
            >
              <div className={`w-11 h-11 ${action.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <action.icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <p className={`text-sm font-black ${action.textColor} tracking-tight mb-0.5`}>
                {action.label}
              </p>
              <p className={`text-xs ${action.textColor} opacity-50 leading-tight`}>
                {action.desc}
              </p>
              <ArrowRight className={`h-3.5 w-3.5 ${action.textColor} opacity-30 mt-2
                group-hover:translate-x-0.5 group-hover:opacity-60 transition-all`} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Recent Courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <h2 className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest mb-4">
          Cursos Recientes
        </h2>

        <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden">
          {recentCourses.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-[#a4c639]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-[#a4c639]" />
              </div>
              <p className="text-[#1a5744]/38 font-bold mb-4 text-sm">No hay cursos creados aún</p>
              <button
                onClick={() => router.push('/admin/courses/new')}
                className="bg-[#a4c639] text-white px-6 py-2.5 rounded-full text-sm font-bold
                           hover:bg-[#2d7a5f] transition-colors"
              >
                Crear Primer Curso
              </button>
            </div>
          ) : (
            recentCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15 + i * 0.06 }}
                onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                className={`flex items-center justify-between px-6 py-4 cursor-pointer
                  hover:bg-[#f5f3e8] transition-colors group
                  ${i < recentCourses.length - 1 ? 'border-b border-[#e8e4d0]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#a4c639]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-[#a4c639]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a5744] group-hover:text-[#2d7a5f] transition-colors leading-tight">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(course.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Estudiantes</p>
                    <p className="text-sm font-black text-[#1a5744]">{course.enrolled_count}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#a4c639]
                                         group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


