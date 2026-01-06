'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  level: string;
  status: string;
  enrolled_count: number;
  image_url: string | null;
  created_at: string;
}

export default function CoursesPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    loadCourses();
  }, [filter]);

  async function loadCourses() {
    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCourse(id: string) {
    if (!confirm('¿Estás seguro de eliminar este curso?')) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCourses(courses.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error al eliminar el curso');
    }
  }

  async function toggleStatus(course: Course) {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    
    try {
      const { error } = await supabase
        .from('courses')
        .update({ status: newStatus })
        .eq('id', course.id);

      if (error) throw error;

      setCourses(courses.map(c => 
        c.id === course.id ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'web_development': 'Desarrollo Web',
      'mobile_development': 'Desarrollo Móvil',
      'data_science': 'Ciencia de Datos',
      'design': 'Diseño',
      'marketing': 'Marketing',
      'business': 'Negocios',
      'other': 'Otro'
    };
    return labels[category] || category;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      'beginner': 'Principiante',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado'
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1a5744]">Cursos</h1>
          <p className="text-gray-600 mt-2">Administra los cursos de la plataforma</p>
        </div>
        <button
          onClick={() => router.push('/admin/courses/new')}
          className="flex items-center space-x-2 bg-[#a4c639] text-white px-6 py-3 rounded-lg hover:bg-[#2d7a5f] transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Curso</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-[#a4c639] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Todos ({courses.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'published'
              ? 'bg-[#a4c639] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Publicados
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'draft'
              ? 'bg-[#a4c639] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Borradores
        </button>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No hay cursos {filter !== 'all' && `en estado ${filter}`}
          </h3>
          <p className="text-gray-500 mb-6">
            Comienza creando tu primer curso
          </p>
          <button
            onClick={() => router.push('/admin/courses/new')}
            className="bg-[#a4c639] text-white px-6 py-3 rounded-lg hover:bg-[#2d7a5f] transition-colors"
          >
            Crear Curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-48 h-48 bg-gray-200 flex-shrink-0">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#1a5744] mb-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-2 mb-3">
                        {course.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="bg-[#e8e4d0] text-[#1a5744] px-3 py-1 rounded-full">
                          {getCategoryLabel(course.category)}
                        </span>
                        <span className="bg-[#e8e4d0] text-[#1a5744] px-3 py-1 rounded-full">
                          {getLevelLabel(course.level)}
                        </span>
                        <span className={`px-3 py-1 rounded-full ${
                          course.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {course.status === 'published' ? 'Publicado' : 'Borrador'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1a5744]">
                        ${course.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {course.enrolled_count} estudiantes
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#a4c639] text-white rounded-lg hover:bg-[#2d7a5f] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    
                    <button
                      onClick={() => toggleStatus(course)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {course.status === 'published' ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>Publicar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => router.push(`/courses/${course.slug}`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver</span>
                    </button>

                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
