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
    .order('access_granted_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-screen bg-[#e8e4d0]">
      {/* Navigation */}
      <DashboardHeader profile={profile} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a5744] mb-4">
            ¡Bienvenido, {profile?.full_name || 'Estudiante'}!
          </h1>
          <p className="text-lg text-[#1a5744]/70 mb-8">
            Continúa tu aprendizaje y alcanza tus metas profesionales
          </p>
        </div>

        {/* Stats Cards - Similar a landing */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
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
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#1a5744]">Tus Cursos</h2>
            <Link 
              href="/courses" 
              className="bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explorar más cursos
            </Link>
          </div>

          {userCourses && userCourses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {userCourses.map((uc: any) => (
                <Link
                  key={uc.id}
                  href={`/courses/${uc.courses.id}/learn`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="h-48 bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white opacity-50" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a5744] mb-3 group-hover:text-[#2d7a5f] transition-colors">
                      {uc.courses.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {uc.courses.short_description || 'Continúa aprendiendo'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#a4c639] font-semibold">
                        Continuar →
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {uc.progress_percentage || 0}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
              <BookOpen className="h-20 w-20 text-[#a4c639] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#1a5744] mb-3">
                Aún no tienes cursos
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Explora nuestro catálogo y comienza tu viaje de aprendizaje con los mejores instructores
              </p>
              <Link
                href="/courses"
                className="inline-block bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
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
