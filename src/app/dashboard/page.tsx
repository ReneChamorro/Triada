import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Mail, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/StatsCard'
import Footer from '@/components/Footer'
import DashboardHeader from '@/components/DashboardHeader'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: userCourses, count: coursesCount } = await supabase
    .from('user_courses')
    .select('*, courses(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      {/* Navigation */}
      <DashboardHeader profile={profile} />

      {/* Hero banner */}
      <div className="bg-[#2d7a5f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a4c639]/15 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
          <p className="text-[#a4c639] text-sm font-semibold uppercase tracking-widest mb-2">Tu espacio de aprendizaje</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
            Hola, <span className="text-[#a4c639]">{profile?.full_name?.split(' ')[0] || 'Estudiante'}</span> 👋
          </h1>
          <p className="mt-2 text-white/60 text-base md:text-lg">Continúa donde lo dejaste y sigue creciendo.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-14">
          <StatsCard
            icon={BookOpen}
            title="Mis Cursos"
            value={coursesCount || 0}
            subtitle="Cursos inscritos"
            bgColor="bg-[#a4c639]"
          />
          <StatsCard
            icon={Mail}
            title="Email"
            value={user.email?.split('@')[0] || 'Usuario'}
            subtitle={user.email || ''}
            bgColor="bg-[#2d7a5f]"
          />
          <StatsCard
            icon={Calendar}
            title="Miembro desde"
            value={new Date(profile?.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
            subtitle="Fecha de registro"
            bgColor="bg-[#1a5744]"
          />
        </div>

        {/* Cursos Section */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#a4c639] mb-1">Tu progreso</p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#2d7a5f]">Tus Cursos</h2>
            </div>
            <Link 
              href="/courses" 
              className="w-full sm:w-auto text-center bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-sm shadow-[#a4c639]/30 text-sm"
            >
              Explorar más cursos
            </Link>
          </div>

          {userCourses && userCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {userCourses.map((uc: any) => (
                <Link
                  key={uc.id}
                  href={`/courses/${uc.courses.id}/learn`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md card-hover transition-all"
                >
                  {uc.courses.image_url ? (
                    <div className="h-40 md:h-48 relative overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={uc.courses.image_url}
                        alt={uc.courses.title}
                        className="max-h-full max-w-full object-contain p-4 md:p-6"
                      />
                    </div>
                  ) : (
                    <div className="h-40 md:h-48 bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center">
                      <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-bold text-[#2d7a5f] mb-2 group-hover:text-[#a4c639] transition-colors line-clamp-2">
                      {uc.courses.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {uc.courses.short_description || 'Continúa aprendiendo'}
                    </p>
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Progreso</span>
                        <span className="text-xs font-bold text-[#a4c639]">{uc.progress_percentage || 0}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#a4c639] rounded-full transition-all" style={{ width: `${uc.progress_percentage || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
              <div className="w-20 h-20 bg-[#a4c639]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-[#a4c639]" />
              </div>
              <h3 className="text-2xl font-extrabold text-[#2d7a5f] mb-3">
                Aún no tienes cursos
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Explora nuestro catálogo y comienza tu viaje de aprendizaje con los mejores instructores
              </p>
              <Link
                href="/courses"
                className="inline-block bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md shadow-[#a4c639]/30"
              >
                Explorar Cursos
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}
