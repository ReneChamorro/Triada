import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GraduationCap, BookOpen, Users, DollarSign, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
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

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  // Fetch stats
  const { count: coursesCount } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })

  const { count: usersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: purchasesCount } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: pendingZelleCount } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('payment_method', 'zelle')
    .eq('status', 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">Triada Admin</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mi Dashboard
              </Link>
              <Link 
                href="/my-courses" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Mis Cursos
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona cursos, usuarios y pagos
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Cursos</p>
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
                <p className="text-sm text-gray-600 mb-1">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{usersCount || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ventas Totales</p>
                <p className="text-3xl font-bold text-gray-900">{purchasesCount || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Zelle Pendientes</p>
                <p className="text-3xl font-bold text-red-600">{pendingZelleCount || 0}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin/courses"
            className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow text-center"
          >
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestionar Cursos
            </h3>
            <p className="text-sm text-gray-600">
              Crear, editar y eliminar cursos
            </p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow text-center"
          >
            <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestionar Usuarios
            </h3>
            <p className="text-sm text-gray-600">
              Ver y administrar usuarios
            </p>
          </Link>

          <Link
            href="/admin/payments"
            className="bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow text-center"
          >
            <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestionar Pagos
            </h3>
            <p className="text-sm text-gray-600">
              Ver pagos y aprobar Zelle
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
