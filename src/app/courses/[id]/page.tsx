import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, BookOpen, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/Header'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!course) {
    notFound()
  }

  // Check if user is authenticated and owns the course
  const { data: { user } } = await supabase.auth.getUser()
  let hasAccess = false

  if (user) {
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .single()

    hasAccess = !!userCourse
  }

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      <Header currentPage="courses" />

      {/* Course Hero */}
      <div className="bg-[#2d7a5f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#a4c639]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1a5744]/40 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#a4c639]/20 border border-[#a4c639]/40 text-[#a4c639] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <BookOpen className="h-3 w-3" />
              Curso Profesional
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-4 leading-tight">
              {course.title}
            </h1>
            {course.short_description && (
              <p className="text-base md:text-lg text-white/70 mb-4 md:mb-6">{course.short_description}</p>
            )}
            {course.duration_minutes && (
              <div className="flex items-center text-white/60 text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span>{course.duration_minutes} minutos de contenido</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="w-full lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#a4c639] inline-block" />
                <h2 className="text-xl md:text-2xl font-extrabold text-[#2d7a5f]">Acerca de este curso</h2>
              </div>
              {course.description ? (
                <div className="text-gray-600 text-sm md:text-base leading-relaxed space-y-4">
                  {course.description.split('\n').map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">
                  Este curso está diseñado para ayudarte a dominar nuevas habilidades
                  y avanzar en tu carrera profesional.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="w-full lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 lg:sticky lg:top-24">
              <div className="aspect-video bg-[#f5f3e8] rounded-xl mb-5 overflow-hidden">
                {course.image_url ? (
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-contain p-6" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center rounded-xl">
                    <BookOpen className="h-14 w-14 text-white opacity-50" />
                  </div>
                )}
              </div>
              
              <div className="mb-5">
                <div className="text-3xl font-extrabold text-[#2d7a5f] mb-1">
                  {formatPrice(course.price, course.currency)}
                </div>
                <p className="text-xs text-gray-400">Pago único • Acceso de por vida</p>
              </div>

              {hasAccess ? (
                <Link href={`/courses/${course.id}/learn`}
                  className="w-full bg-[#2d7a5f] hover:bg-[#1a5744] text-white px-6 py-3.5 rounded-xl font-bold text-center block mb-4 transition-all">
                  Ir al Curso →
                </Link>
              ) : user ? (
                <Link href={`/courses/${course.id}/checkout`}
                  className="w-full bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-6 py-3.5 rounded-xl font-bold text-center block mb-4 transition-all shadow-md shadow-[#a4c639]/30">
                  Comprar Ahora
                </Link>
              ) : (
                <div className="space-y-3">
                  <Link href={`/register?redirect=/courses/${course.id}`}
                    className="w-full bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-6 py-3.5 rounded-xl font-bold text-center block transition-all shadow-md shadow-[#a4c639]/30">
                    Registrarse para Comprar
                  </Link>
                  <Link href={`/login?redirect=/courses/${course.id}`}
                    className="w-full bg-white text-[#2d7a5f] border-2 border-[#2d7a5f] hover:bg-[#e8e4d0] px-6 py-3 rounded-xl font-semibold text-center block transition-all">
                    Ya tengo cuenta
                  </Link>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2.5">
                {[
                  'Acceso de por vida',
                  'Certificado de finalización',
                  'Contenido protegido',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-[#a4c639] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
