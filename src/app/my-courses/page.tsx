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
    .select('*, courses(*)')
    .eq('user_id', user.id)
    .order('access_granted_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mis Cursos
          </h1>
          <p className="text-gray-600">
            {userCourses?.length || 0} {userCourses?.length === 1 ? 'curso' : 'cursos'} en tu biblioteca
          </p>
        </div>

        {userCourses && userCourses.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCourses.map((uc: any) => (
              <div
                key={uc.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
                  <Link
                    href={`/courses/${uc.courses.id}/learn`}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    <div className="bg-white/90 rounded-full p-4">
                      <Play className="h-8 w-8 text-blue-600" fill="currentColor" />
                    </div>
                  </Link>
                </div>
                <div className="p-5">
                  <Link
                    href={`/courses/${uc.courses.id}/learn`}
                    className="block mb-3"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600">
                      {uc.courses.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {uc.courses.short_description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium text-gray-900">
                        {uc.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${uc.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {uc.courses.duration_minutes && (
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>{uc.courses.duration_minutes} min</span>
                      </div>
                    )}
                    <span>
                      Adquirido: {formatDate(uc.access_granted_at)}
                    </span>
                  </div>

                  <Link
                    href={`/courses/${uc.courses.id}/learn`}
                    className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm text-center block"
                  >
                    {uc.progress_percentage > 0 ? 'Continuar' : 'Comenzar'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-16 text-center">
            <GraduationCap className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aún no tienes cursos
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explora nuestro catálogo de cursos y comienza tu viaje de aprendizaje hoy mismo
            </p>
            <Link
              href="/courses"
              className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold"
            >
              Explorar Cursos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
