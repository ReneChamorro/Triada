import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GraduationCap, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'

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
    .eq('is_published', true)
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
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Triada</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                href="/courses" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Cursos
              </Link>
              {user ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/my-courses" 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Mis Cursos
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Course Header */}
      <div className="bg-gradient-to-r from-[#2d7a5f] to-[#a4c639] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {course.title}
            </h1>
            {course.short_description && (
              <p className="text-xl text-blue-100 mb-6">
                {course.short_description}
              </p>
            )}
            {course.duration_minutes && (
              <div className="flex items-center text-blue-100">
                <Clock className="h-5 w-5 mr-2" />
                <span>{course.duration_minutes} minutos de contenido</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-4">Acerca de este curso</h2>
              {course.description ? (
                <div className="prose max-w-none text-gray-700">
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

              <div className="mt-8 pt-8 border-t">
                <h3 className="text-xl font-bold mb-4">Lo que aprenderás</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Conceptos fundamentales y avanzados del tema</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Ejercicios prácticos y proyectos reales</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Técnicas y mejores prácticas de la industria</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Acceso de por vida al contenido del curso</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4" />
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
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
