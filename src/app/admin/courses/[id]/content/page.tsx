'use client'
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  Video,
  FileText,
  File,
  GripVertical,
  Save,
  X,
  Upload
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  position: number;
  is_published: boolean;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: 'video' | 'pdf' | 'text';
  video_url: string | null;
  pdf_url: string | null;
  text_content: string | null;
  duration_minutes: number;
  position: number;
  is_free_preview: boolean;
  is_published: boolean;
}

export default function CourseContentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    try {
      // Load course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseData) setCourse(courseData);

      // Load modules with lessons
      const { data: modulesData } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position');

      if (modulesData) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module) => {
            const { data: lessons } = await supabase
              .from('course_lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('position');
            
            return {
              ...module,
              lessons: lessons || []
            };
          })
        );
        setModules(modulesWithLessons);
      }
    } catch (error) {
      logger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const openModuleModal = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setModuleForm({
        title: module.title,
        description: module.description,
      });
    } else {
      setEditingModule(null);
      setModuleForm({ title: '', description: '' });
    }
    setShowModuleModal(true);
  };

  const openLessonModal = (moduleId: string, lesson?: Lesson) => {
    if (lesson) {
      router.push(`/admin/courses/${courseId}/lessons/${lesson.id}`);
    } else {
      router.push(`/admin/courses/${courseId}/lessons/new?moduleId=${moduleId}`);
    }
  };

  const saveModule = async () => {
    try {
      if (editingModule) {
        // Update
        await supabase
          .from('course_modules')
          .update({
            title: moduleForm.title,
            description: moduleForm.description,
          })
          .eq('id', editingModule.id);
      } else {
        // Create
        const maxPosition = modules.length > 0 
          ? Math.max(...modules.map(m => m.position))
          : -1;
        
        await supabase
          .from('course_modules')
          .insert({
            course_id: courseId,
            title: moduleForm.title,
            description: moduleForm.description,
            position: maxPosition + 1,
          });
      }
      
      setShowModuleModal(false);
      loadData();
    } catch (error) {
      logger.error('Error saving module:', error);
      alert('Error al guardar el módulo');
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;
    
    try {
      await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);
      
      loadData();
    } catch (error) {
      logger.error('Error deleting module:', error);
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('¿Eliminar esta lección?')) return;
    
    try {
      await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);
      
      loadData();
    } catch (error) {
      logger.error('Error deleting lesson:', error);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <File className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => router.push('/admin/courses')}
          className="flex items-center space-x-2 text-gray-600 hover:text-[#1a5744] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a Cursos</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744]">Contenido del Curso</h1>
        <p className="text-gray-600 mt-2">{course?.title}</p>
      </div>

      {/* Add Module Button */}
      <button
        onClick={() => openModuleModal()}
        className="flex items-center space-x-2 bg-[#a4c639] text-white px-6 py-3 rounded-lg hover:bg-[#2d7a5f] transition-colors mb-6"
      >
        <Plus className="w-5 h-5" />
        <span>Agregar Módulo</span>
      </button>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((module, moduleIndex) => (
          <div key={module.id} className="bg-white rounded-lg shadow">
            {/* Module Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedModules.has(module.id) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <GripVertical className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <h3 className="font-bold text-[#1a5744]">
                    Módulo {moduleIndex + 1}: {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-sm text-gray-600">{module.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {module.lessons.length} {module.lessons.length === 1 ? 'lección' : 'lecciones'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openLessonModal(module.id)}
                  className="p-2 text-[#a4c639] hover:bg-[#e8e4d0] rounded"
                  title="Agregar lección"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openModuleModal(module)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteModule(module.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lessons */}
            {expandedModules.has(module.id) && (
              <div className="p-4 space-y-2">
                {module.lessons.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    No hay lecciones. Haz clic en + para agregar una.
                  </p>
                ) : (
                  module.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        {getContentIcon(lesson.content_type)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {lessonIndex + 1}. {lesson.title}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="capitalize">{lesson.content_type}</span>
                            {lesson.duration_minutes > 0 && (
                              <span>• {lesson.duration_minutes} min</span>
                            )}
                            {lesson.is_free_preview && (
                              <span className="text-green-600">• Vista previa gratuita</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openLessonModal(module.id, lesson)}
                          className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No hay módulos creados</p>
            <p className="text-sm text-gray-500">
              Comienza agregando un módulo para estructurar tu curso
            </p>
          </div>
        )}
      </div>

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1a5744]">
                {editingModule ? 'Editar Módulo' : 'Nuevo Módulo'}
              </h2>
              <button
                onClick={() => setShowModuleModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                  Título del Módulo *
                </label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                  placeholder="Ej: Introducción al curso"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                  placeholder="Descripción opcional del módulo"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModuleModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveModule}
                disabled={!moduleForm.title}
                className="flex items-center space-x-2 px-6 py-2 bg-[#a4c639] text-white rounded-lg hover:bg-[#2d7a5f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
