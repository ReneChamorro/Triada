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

  const { data: userCourses } = await supabase
    .from('user_courses')
    .select('*, courses!inner(*)')
    .eq('user_id', user.id)
    .eq('courses.status', 'published')
    .order('enrolled_at', { ascending: false })

  const { data: ownReviews } = await supabase
    .from('course_reviews')
    .select('course_id')
    .eq('user_id', user.id)
  const reviewedCourseIds = new Set((ownReviews ?? []).map((r) => r.course_id))

  return (
    <div className="min-h-screen bg-[#f5f3e8]">
      <Header currentPage="courses" />

      <main id="main">
        <div className="bg-[#1a5744] relative overflow-hidden">
          <div className="absolute -top-16 right-0 w-96 h-72 bg-[#2d7a5f]/55 rounded-full translate-x-1/3 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 relative">
            <p className="flex items-center gap-3 text-[#e8e4d0] text-xs font-bold uppercase tracking-widest mb-2">
              <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
              Tu biblioteca
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-[#e8e4d0] leading-[1.1]">Mis Cursos</h1>
            <p className="mt-2 text-[#e8e4d0]/90 text-sm">
              {userCourses?.length || 0} {userCourses?.length === 1 ? 'curso' : 'cursos'} en tu colección
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {userCourses && userCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 min-[1920px]:grid-cols-4 gap-6">
              {userCourses.map((uc: any) => (
                <div key={uc.id} className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden">
                  <Link
                    href={`/courses/${uc.courses.id}/learn`}
                    aria-label={`Abrir ${uc.courses.title}`}
                    className="group relative block h-48"
                  >
                    {uc.courses.image_url ? (
                      <div className="h-full bg-white flex items-center justify-center p-4">
                        <img src={uc.courses.image_url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-full bg-[#1a5744] flex items-center justify-center">
                        <GraduationCap className="h-14 w-14 text-[#a4c639]" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200">
                      <span className="bg-[#1a5744] rounded-full p-4">
                        <Play className="h-6 w-6 text-white" fill="currentColor" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                  <div className="p-5">
                    <h3 className="font-semibold text-[#1a5744] mb-1 line-clamp-2 hover:text-[#2d7a5f] transition-colors">
                      <Link href={`/courses/${uc.courses.id}/learn`}>{uc.courses.title}</Link>
                    </h3>
                    <p className="text-xs text-[#1a5744]/80 mb-4 line-clamp-2">{uc.courses.short_description}</p>

                    <div className="mb-4 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#1a5744]/80">Progreso</span>
                        <span className="font-bold text-[#1a5744]">{uc.progress_percentage}%</span>
                      </div>
                      <div
                        className="w-full bg-[#e8e4d0] rounded-full h-1.5"
                        role="progressbar"
                        aria-valuenow={uc.progress_percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Progreso del curso"
                      >
                        <div className="bg-[#2d7a5f] h-1.5 rounded-full" style={{ width: `${uc.progress_percentage}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#1a5744]/80 mb-4">
                      {uc.courses.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{uc.courses.duration_minutes} min</span>
                        </div>
                      )}
                      <span>Inscrito: {formatDate(uc.enrolled_at)}</span>
                    </div>

                    <Link
                      href={`/courses/${uc.courses.id}/learn`}
                      className="w-full bg-[#1a5744] hover:bg-[#2d7a5f] text-white px-4 min-h-11 flex items-center justify-center rounded-xl font-semibold text-sm active:scale-[0.98] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
                    >
                      {uc.progress_percentage > 0 ? 'Continuar' : 'Comenzar'}
                    </Link>
                    <Link
                      href={`/courses/${uc.courses.id}/resena`}
                      className="mt-2 w-full text-[#1a5744] border-2 border-[#1a5744]/20 hover:border-[#1a5744]/50 hover:bg-[#1a5744]/5 px-4 min-h-11 flex items-center justify-center rounded-xl font-semibold text-sm active:scale-[0.98] [transition:transform_150ms_var(--ease-out),border-color_300ms_var(--ease-brand),background-color_300ms_var(--ease-brand)]"
                    >
                      {reviewedCourseIds.has(uc.courses.id) ? 'Editar tu opinión' : 'Deja tu opinión'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-10 md:p-16 text-center">
              <div className="w-16 h-16 bg-[#1a5744]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-8 w-8 text-[#1a5744]" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1a5744] mb-3">Aún no tienes cursos</h3>
              <p className="text-[#1a5744]/85 mb-8 max-w-md mx-auto">
                Explora nuestro catálogo y comienza tu viaje de aprendizaje hoy mismo
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center min-h-12 bg-[#1a5744] hover:bg-[#2d7a5f] text-white px-8 rounded-xl font-semibold active:scale-[0.97] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
              >
                Explorar Cursos
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
