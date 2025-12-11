import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GraduationCap, BookOpen, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
                Explorar Cursos
              </Link>
              <Link 
                href="/my-courses" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mis Cursos
              </Link>
              {profile?.is_admin && (
                <Link 
                  href="/admin" 
                  className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </Link>
              )}
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hola, {profile?.name || 'Estudiante'}! 👋
          </h1>
          <p className="text-gray-600">
            Bienvenido a tu panel de aprendizaje
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mis Cursos</p>
                <p className="text-3xl font-bold text-gray-900">{coursesCount || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Miembro desde</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(profile?.created_at || '').toLocaleDateString('es-ES', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cursos Recientes</h2>
            <Link 
              href="/my-courses" 
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Ver todos →
            </Link>
          </div>

          {userCourses && userCourses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {userCourses.map((uc: any) => (
                <Link
                  key={uc.id}
                  href={`/courses/${uc.courses.id}/learn`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-500" />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {uc.courses.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {uc.courses.short_description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600 font-medium">
                        Continuar →
                      </span>
                      <span className="text-xs text-gray-500">
                        {uc.progress_percentage}% completado
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aún no tienes cursos
              </h3>
              <p className="text-gray-600 mb-6">
                Explora nuestro catálogo y comienza tu viaje de aprendizaje
              </p>
              <Link
                href="/courses"
                className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
              >
                Explorar Cursos
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
