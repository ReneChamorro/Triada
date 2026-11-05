import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BookOpen, Mail, ArrowRight, TrendingUp, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CourseProgressBar from '@/components/CourseProgressBar'
import Footer from '@/components/Footer'
import DashboardHeader from '@/components/DashboardHeader'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: userCourses, count: coursesCount } = await supabase
    .from('user_courses')
    .select('*, courses!inner(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('courses.status', 'published')
    .order('enrolled_at', { ascending: false })
    .limit(3)

  const firstName = profile?.full_name?.split(' ')[0] || 'Estudiante'

  const totalProgress = userCourses && userCourses.length > 0
    ? Math.round(
        (userCourses as any[]).reduce((sum, uc) => sum + (uc.progress_percentage || 0), 0)
        / userCourses.length
      )
    : 0

  return (
    <div className="min-h-screen bg-[#f5f3e8]">
      <DashboardHeader profile={profile} />

      <main id="main">
        {/* Greeting */}
        <div className="bg-[#1a5744] relative overflow-hidden">
          <div className="absolute -top-16 right-0 w-96 h-72 bg-[#2d7a5f]/55 rounded-full translate-x-1/3 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
            <p className="flex items-center gap-3 text-[#e8e4d0] text-xs font-bold uppercase tracking-widest mb-3">
              <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
              Tu espacio de aprendizaje
            </p>
            <h1
              className="font-semibold tracking-[-0.02em] text-[#e8e4d0] leading-[1.1] mb-3"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}
            >
              Hola, <span className="underline decoration-[#a4c639] decoration-[0.07em] underline-offset-[0.16em]">{firstName}</span>
            </h1>
            <p className="text-[#e8e4d0]/90 text-base">
              Continúa donde lo dejaste y sigue creciendo.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10 md:mb-14">
            <div className="bg-white rounded-[1.5rem] p-6 border border-[#e8e4d0] flex items-center gap-4">
              <div className="w-14 h-14 bg-[#a4c639] rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="h-7 w-7 text-[#1a5744]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#1a5744] tracking-tight leading-none">
                  {coursesCount || 0}
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5744]/80 mt-1.5">
                  Cursos inscritos
                </p>
              </div>
            </div>

            <div className="bg-[#1a5744] rounded-[1.5rem] p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-[#a4c639] rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="h-7 w-7 text-[#1a5744]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold text-[#e8e4d0] tracking-tight leading-none">
                  {totalProgress}%
                </p>
                <p className="text-xs font-semibold text-[#e8e4d0]/90 uppercase tracking-widest mt-1.5">
                  Progreso medio
                </p>
              </div>
            </div>

            <div className="bg-[#e8e4d0] rounded-[1.5rem] p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-[#2d7a5f] rounded-xl flex items-center justify-center shrink-0">
                <Mail className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1a5744] tracking-tight truncate">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-[#1a5744]/80 truncate mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Section header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4
                          mb-6 pb-5 border-b border-[#1a5744]/15">
            <div>
              <span className="flex items-center gap-3 text-[#1a5744] text-xs font-bold uppercase tracking-widest mb-2">
                <span className="h-0.5 w-8 bg-[#1a5744]" aria-hidden="true" />
                Tu progreso
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold text-[#1a5744] tracking-[-0.02em]">
                Tus Cursos
              </h2>
            </div>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 min-h-11 bg-[#1a5744] hover:bg-[#2d7a5f]
                         text-white font-semibold text-sm px-5 rounded-xl active:scale-[0.97]
                         [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
            >
              Explorar más
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Course cards */}
          {userCourses && userCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 min-[1920px]:grid-cols-4 gap-4 md:gap-6">
              {(userCourses as any[]).map((uc) => (
                <Link
                  key={uc.id}
                  href={`/courses/${uc.courses.id}/learn`}
                  className="group bg-white rounded-[1.5rem] overflow-hidden border border-[#e8e4d0]
                             active:scale-[0.99]
                             [transition:transform_200ms_var(--ease-out),box-shadow_200ms_var(--ease-out),border-color_200ms_var(--ease-out)]
                             [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1
                             [@media(hover:hover)_and_(pointer:fine)]:hover:border-[#a4c639]
                             [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_16px_32px_-14px_rgba(26,87,68,0.28)]"
                >
                  {uc.courses.image_url ? (
                    <div className="h-40 bg-white flex items-center justify-center border-b border-[#e8e4d0]">
                      <img
                        src={uc.courses.image_url}
                        alt=""
                        loading="lazy"
                        className="max-h-full max-w-full object-contain p-4 md:p-6"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-[#1a5744] flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-[#a4c639]" aria-hidden="true" />
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className="text-base font-semibold text-[#1a5744] mb-3 line-clamp-2 tracking-tight leading-snug">
                      {uc.courses.title}
                    </h3>
                    <CourseProgressBar percentage={uc.progress_percentage || 0} />
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#1a5744]/80 mt-2">
                      {uc.progress_percentage || 0}% completado
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-10 md:p-16 text-center">
              <div className="w-16 h-16 bg-[#1a5744]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="h-8 w-8 text-[#1a5744]" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-semibold text-[#1a5744] tracking-tight mb-3">
                Aún no tienes cursos
              </h3>
              <p className="text-[#1a5744]/85 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                Explora nuestro catálogo y comienza tu viaje de aprendizaje
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 min-h-12 bg-[#1a5744] hover:bg-[#2d7a5f]
                           text-white px-8 rounded-xl font-semibold active:scale-[0.97]
                           [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
              >
                Explorar Cursos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
