'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  DollarSign
} from 'lucide-react';

interface DashboardStats {
  totalCourses: number;
  totalRevenue: number;
}

interface RecentCourse {
  id: string;
  title: string;
  enrolled_count: number;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalRevenue: 0,
  });
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Check if user is admin or teacher
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      console.log('Admin check - Profile:', profile);
      console.log('Admin check - Role:', profile?.role);
      console.log('Admin check - Is admin?', profile?.role === 'admin');
      console.log('Admin check - Is teacher?', profile?.role === 'teacher');

      // Only allow admin and teacher roles
      const allowedRoles = ['admin', 'teacher'];
      if (!profile || !allowedRoles.includes(profile.role)) {
        console.log('Access denied - redirecting to home');
        router.push('/');
        return;
      }

      console.log('Access granted - loading dashboard');
      // Load dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  }

  async function loadDashboardData() {
    try {
      // Get total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Get total revenue
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('courses(price)')
        .eq('payment_status', 'completed');

      const totalRevenue = enrollments?.reduce((sum: number, enrollment: any) => {
        return sum + (enrollment.courses?.price || 0);
      }, 0) || 0;

      // Get recent courses
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, enrolled_count, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalCourses: coursesCount || 0,
        totalRevenue: totalRevenue,
      });

      setRecentCourses(courses || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a5744]">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido al panel de administración</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Courses */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-l-4 border-[#a4c639] hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Cursos</p>
              <p className="text-3xl font-bold text-[#1a5744] mt-2">{stats.totalCourses}</p>
            </div>
            <div className="bg-[#a4c639]/10 p-3 rounded-full">
              <BookOpen className="w-8 h-8 text-[#a4c639]" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ingresos Totales</p>
              <p className="text-3xl font-bold text-[#1a5744] mt-2">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#a4c639] rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold mb-2 text-gray-900">Crear Nuevo Curso</h3>
          <p className="mb-4 text-gray-800">Agrega un nuevo curso a la plataforma</p>
          <button
            onClick={() => router.push('/admin/courses/new')}
            className="bg-[#F5E6D3] text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-[#e8d4bb] transition-colors"
          >
            Crear Curso
          </button>
        </div>

        <div className="bg-[#F5E6D3] rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold mb-2 text-gray-900">Gestionar Usuarios</h3>
          <p className="mb-4 text-gray-800">Ver y administrar estudiantes</p>
          <button
            onClick={() => router.push('/admin/usuarios')}
            className="bg-[#a4c639] text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-[#8ba832] transition-colors"
          >
            Ver Usuarios
          </button>
        </div>

        <div className="bg-[#1a5744] rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold mb-2 text-white">Landing Page</h3>
          <p className="mb-4 text-white/90">Editar página principal</p>
          <button
            onClick={() => router.push('/admin/landing')}
            className="bg-[#a4c639] text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-[#8ba832] transition-colors"
          >
            Configurar
          </button>
        </div>

        <div className="bg-orange-500 rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <h3 className="text-xl font-bold mb-2 text-white">Otorgar Acceso</h3>
          <p className="mb-4 text-white/90">Acceso manual a cursos</p>
          <button
            onClick={() => router.push('/admin/grant-access')}
            className="bg-white text-orange-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Gestionar
          </button>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#1a5744]">Cursos Recientes</h2>
        </div>
        <div className="p-6">
          {recentCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay cursos creados aún</p>
              <button
                onClick={() => router.push('/admin/courses/new')}
                className="bg-[#a4c639] text-white px-6 py-2 rounded-lg hover:bg-[#2d7a5f] transition-colors"
              >
                Crear Primer Curso
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#a4c639] transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#a4c639]/10 p-2 rounded-lg">
                      <BookOpen className="w-5 h-5 text-[#a4c639]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1a5744]">{course.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(course.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Estudiantes</p>
                      <p className="font-semibold text-[#1a5744]">{course.enrolled_count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
