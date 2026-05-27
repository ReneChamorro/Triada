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

      {/* â”€â”€ HERO BANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-[#1a5744] relative overflow-hidden">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #a4c639 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* Oval accents */}
        <div className="absolute -top-16 right-0 w-96 h-72 bg-[#2d7a5f]/55 rounded-full translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-44 h-32 bg-[#a4c639]/8 rounded-full translate-y-1/2 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <p className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest mb-3">
            Tu espacio de aprendizaje
          </p>
          <h1
            className="font-black tracking-tighter text-[#e8e4d0] leading-[0.88] mb-3"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
          >
            Hola, <span className="text-[#a4c639]">{firstName}</span>
          </h1>
          <p className="text-[#e8e4d0]/45 text-base">
            Continúa donde lo dejaste y sigue creciendo.
          </p>
        </div>
      </div>

      {/* â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Stats row â€” 3 cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10 md:mb-14">

          {/* Cursos inscritos */}
          <div className="bg-white rounded-[1.5rem] p-6 border border-[#e8e4d0] shadow-sm
                          flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
            <div className="w-14 h-14 bg-[#a4c639] rounded-[18px] flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#1a5744] tracking-tighter leading-none">
                {coursesCount || 0}
              </p>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-1">
                Cursos inscritos
              </p>
            </div>
          </div>

          {/* Progreso medio */}
          <div className="bg-[#1a5744] rounded-[1.5rem] p-6 shadow-sm
                          flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
            <div className="w-14 h-14 bg-[#a4c639] rounded-[18px] flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-7 w-7 text-[#1a5744]" />
            </div>
            <div>
              <p className="text-3xl font-black text-[#e8e4d0] tracking-tighter leading-none">
                {totalProgress}%
              </p>
              <p className="text-xs font-semibold text-[#e8e4d0]/60 uppercase tracking-widest mt-1">
                Progreso medio
              </p>
            </div>
          </div>

          {/* Email / cuenta */}
          <div className="bg-[#e8e4d0] rounded-[1.5rem] p-6 shadow-sm
                          flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
            <div className="w-14 h-14 bg-[#2d7a5f] rounded-[18px] flex items-center justify-center flex-shrink-0">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#1a5744] tracking-tight truncate leading-none">
                {user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-[#1a5744]/50 truncate mt-1">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4
                        mb-6 pb-5 border-b-2 border-[#1a5744]/6">
          <div>
            <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-1">
              Tu progreso
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#1a5744] tracking-tighter">
              Tus Cursos
            </h2>
          </div>
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 bg-[#a4c639] hover:bg-[#2d7a5f]
                       text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors"
          >
            Explorar más
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Course cards */}
        {userCourses && userCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {(userCourses as any[]).map((uc) => (
              <Link
                key={uc.id}
                href={`/courses/${uc.courses.id}/learn`}
                className="group bg-white rounded-[1.5rem] overflow-hidden border border-[#e8e4d0]
                           shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                {uc.courses.image_url ? (
                  <div className="h-40 bg-white flex items-center justify-center border-b border-[#e8e4d0]">
                    <img
                      src={uc.courses.image_url}
                      alt={uc.courses.title}
                      className="max-h-full max-w-full object-contain p-4 md:p-6"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-[#1a5744] flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-[#a4c639]/50" />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-base font-black text-[#1a5744] mb-3
                                 group-hover:text-[#2d7a5f] transition-colors
                                 line-clamp-2 tracking-tight leading-tight">
                    {uc.courses.title}
                  </h3>
                  <CourseProgressBar percentage={uc.progress_percentage || 0} />
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-2">
                    {uc.progress_percentage || 0}% completado
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-[#e8e4d0] p-16 text-center">
            <div className="w-20 h-20 bg-[#a4c639]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-10 w-10 text-[#a4c639]" />
            </div>
            <h3 className="text-2xl font-black text-[#1a5744] tracking-tight mb-3">
              Aún no tienes cursos
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
              Explora nuestro catálogo y comienza tu viaje de aprendizaje
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#a4c639] hover:bg-[#2d7a5f]
                         text-white px-8 py-3.5 rounded-full font-bold transition-colors"
            >
              Explorar Cursos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

