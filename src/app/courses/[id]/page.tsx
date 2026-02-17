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
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="courses" />

      {/* Course Header */}
      <div className="bg-gradient-to-r from-[#2d7a5f] to-[#a4c639] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              {course.title}
            </h1>
            {course.short_description && (
              <p className="text-base md:text-xl text-blue-100 mb-4 md:mb-6">
                {course.short_description}
              </p>
            )}
            {course.duration_minutes && (
              <div className="flex items-center text-blue-100 text-sm md:text-base">
                <Clock className="h-5 w-5 mr-2" />
                <span>{course.duration_minutes} minutos de contenido</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 lg:p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Acerca de este curso</h2>
              {course.description ? (
                <div className="prose max-w-none text-gray-700 text-sm md:text-base">
                  {course.description.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">
                  Este curso está diseñado para ayudarte a dominar nuevas habilidades
                  y avanzar en tu carrera profesional.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 lg:sticky lg:top-6">
              <div className="aspect-video bg-white rounded-lg mb-4 overflow-hidden border border-gray-200">
                {course.image_url ? (
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-contain p-8"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              
              <div className="mb-4 md:mb-6">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(course.price, course.currency)}
                </div>
                <p className="text-sm text-gray-600">Pago único • Acceso de por vida</p>
              </div>

              {hasAccess ? (
                <Link
                  href={`/courses/${course.id}/learn`}
                  className="w-full bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-lg font-semibold text-center block mb-4"
                >
                  Ir al Curso
                </Link>
              ) : user ? (
                <Link
                  href={`/courses/${course.id}/checkout`}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold text-center block mb-4"
                >
                  Comprar Ahora
                </Link>
              ) : (
                <div className="space-y-3">
                  <Link
                    href={`/register?redirect=/courses/${course.id}`}
                    className="w-full bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-6 py-3 rounded-lg font-semibold text-center block"
                  >
                    Registrarse para Comprar
                  </Link>
                  <Link
                    href={`/login?redirect=/courses/${course.id}`}
                    className="w-full bg-white text-[#2d7a5f] border-2 border-[#2d7a5f] hover:bg-[#e8e4d0] px-6 py-3 rounded-lg font-semibold text-center block"
                  >
                    Ya tengo cuenta
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-6 border-t space-y-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Acceso de por vida</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Certificado de finalización</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span>Contenido protegido</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
