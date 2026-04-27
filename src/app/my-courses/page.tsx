import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Clock, Play, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Header from '@/components/Header'

export default async function MyCoursesPage() {
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

  const { data: userCourses } = await supabase
    .from('user_courses')
    .select('*, courses!inner(*)')
    .eq('user_id', user.id)
    .eq('courses.status', 'published')
    .order('enrolled_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      <Header currentPage="courses" />

      {/* Hero banner */}
      <div className="bg-[#2d7a5f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a4c639]/15 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
          <p className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest mb-2">Tu biblioteca</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Mis Cursos</h1>
          <p className="mt-1 text-white/50 text-sm">{userCourses?.length || 0} {userCourses?.length === 1 ? 'curso' : 'cursos'} en tu colección</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {userCourses && userCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCourses.map((uc: any) => (
              <div key={uc.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden card-hover">
                <div className="relative h-48">
                  {uc.courses.image_url ? (
                    <div className="h-full bg-white flex items-center justify-center p-4">
                      <img src={uc.courses.image_url} alt={uc.courses.title} className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="h-full bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center">
                      <GraduationCap className="h-16 w-16 text-white opacity-40" />
                    </div>
                  )}
                  <Link href={`/courses/${uc.courses.id}/learn`} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-[#a4c639] rounded-full p-4 shadow-lg">
                      <Play className="h-7 w-7 text-white" fill="currentColor" />
                    </div>
                  </Link>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#2d7a5f] mb-1 line-clamp-2 hover:text-[#a4c639] transition-colors">
                    <Link href={`/courses/${uc.courses.id}/learn`}>{uc.courses.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{uc.courses.short_description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Progreso</span>
                      <span className="font-bold text-[#a4c639]">{uc.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#a4c639] h-1.5 rounded-full transition-all" style={{ width: `${uc.progress_percentage}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    {uc.courses.duration_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{uc.courses.duration_minutes} min</span>
                      </div>
                    )}
                    <span>Inscrito: {formatDate(uc.enrolled_at)}</span>
                  </div>

                  <Link href={`/courses/${uc.courses.id}/learn`}
                    className="w-full bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-4 py-2.5 rounded-xl font-semibold text-sm text-center block transition-all shadow-sm shadow-[#a4c639]/20">
                    {uc.progress_percentage > 0 ? 'Continuar' : 'Comenzar'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-[#a4c639]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-10 w-10 text-[#a4c639]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#2d7a5f] mb-3">Aún no tienes cursos</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Explora nuestro catálogo y comienza tu viaje de aprendizaje hoy mismo
            </p>
            <Link href="/courses"
              className="inline-block bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md shadow-[#a4c639]/30">
              Explorar Cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
