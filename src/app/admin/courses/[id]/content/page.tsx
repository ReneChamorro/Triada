'use client';

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
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content_type: 'video' as 'video' | 'pdf' | 'text',
    video_url: '',
    pdf_url: '',
    text_content: '',
    duration_minutes: 0,
    is_free_preview: false,
  });

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPDF, setUploadingPDF] = useState(false);

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
      console.error('Error loading data:', error);
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
    setSelectedModuleId(moduleId);
    if (lesson) {
      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        description: lesson.description || '',
        content_type: lesson.content_type,
        video_url: lesson.video_url || '',
        pdf_url: lesson.pdf_url || '',
        text_content: lesson.text_content || '',
        duration_minutes: lesson.duration_minutes || 0,
        is_free_preview: lesson.is_free_preview,
      });
    } else {
      setEditingLesson(null);
      setLessonForm({
        title: '',
        description: '',
        content_type: 'video',
        video_url: '',
        pdf_url: '',
        text_content: '',
        duration_minutes: 0,
        is_free_preview: false,
      });
    }
    setShowLessonModal(true);
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
      console.error('Error saving module:', error);
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
      console.error('Error deleting module:', error);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: 'video' | 'pdf'
  ): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${courseId}/${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('lesson-content')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('lesson-content')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const url = await handleFileUpload(file, 'video');
      setLessonForm({ ...lessonForm, video_url: url });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error al subir el video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPDF(true);
    try {
      const url = await handleFileUpload(file, 'pdf');
      setLessonForm({ ...lessonForm, pdf_url: url });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error al subir el PDF');
    } finally {
      setUploadingPDF(false);
    }
  };

  const saveLesson = async () => {
    try {
      const lessonData = {
        title: lessonForm.title,
        description: lessonForm.description,
        content_type: lessonForm.content_type,
        video_url: lessonForm.content_type === 'video' ? lessonForm.video_url : null,
        pdf_url: lessonForm.content_type === 'pdf' ? lessonForm.pdf_url : null,
        text_content: lessonForm.content_type === 'text' ? lessonForm.text_content : null,
        duration_minutes: lessonForm.duration_minutes,
        is_free_preview: lessonForm.is_free_preview,
      };

      if (editingLesson) {
        // Update
        await supabase
          .from('course_lessons')
          .update(lessonData)
          .eq('id', editingLesson.id);
      } else {
        // Create
        const module = modules.find(m => m.id === selectedModuleId);
        const maxPosition = module && module.lessons.length > 0
          ? Math.max(...module.lessons.map(l => l.position))
          : -1;
        
        await supabase
          .from('course_lessons')
          .insert({
            ...lessonData,
            module_id: selectedModuleId,
            position: maxPosition + 1,
          });
      }
      
      setShowLessonModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Error al guardar la lección');
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
      console.error('Error deleting lesson:', error);
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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/courses')}
          className="flex items-center space-x-2 text-gray-600 hover:text-[#1a5744] mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a Cursos</span>
        </button>
        <h1 className="text-3xl font-bold text-[#1a5744]">Contenido del Curso</h1>
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

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1a5744]">
                {editingLesson ? 'Editar Lección' : 'Nueva Lección'}
              </h2>
              <button
                onClick={() => setShowLessonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                  Título de la Lección *
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                  placeholder="Ej: Conceptos básicos"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                    Tipo de Contenido *
                  </label>
                  <select
                    value={lessonForm.content_type}
                    onChange={(e) => setLessonForm({ ...lessonForm, content_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="text">Texto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lessonForm.duration_minutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Content Type Fields */}
              {lessonForm.content_type === 'video' && (
                <div>
                  <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                    Video
                  </label>
                  {lessonForm.video_url ? (
                    <div className="space-y-2">
                      <video
                        src={lessonForm.video_url}
                        controls
                        className="w-full rounded-lg"
                      />
                      <button
                        onClick={() => setLessonForm({ ...lessonForm, video_url: '' })}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Eliminar video
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors">
                      {uploadingVideo ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a4c639]"></div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-gray-600">Subir video</span>
                          <span className="text-sm text-gray-400">MP4, MOV hasta 500MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        disabled={uploadingVideo}
                      />
                    </label>
                  )}
                </div>
              )}

              {lessonForm.content_type === 'pdf' && (
                <div>
                  <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                    PDF
                  </label>
                  {lessonForm.pdf_url ? (
                    <div className="space-y-2">
                      <a
                        href={lessonForm.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-[#a4c639] hover:underline"
                      >
                        <File className="w-5 h-5" />
                        <span>Ver PDF</span>
                      </a>
                      <button
                        onClick={() => setLessonForm({ ...lessonForm, pdf_url: '' })}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Eliminar PDF
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#a4c639] transition-colors">
                      {uploadingPDF ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a4c639]"></div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-gray-600">Subir PDF</span>
                          <span className="text-sm text-gray-400">PDF hasta 50MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePDFUpload}
                        className="hidden"
                        disabled={uploadingPDF}
                      />
                    </label>
                  )}
                </div>
              )}

              {lessonForm.content_type === 'text' && (
                <div>
                  <label className="block text-sm font-semibold text-[#1a5744] mb-2">
                    Contenido de Texto
                  </label>
                  <textarea
                    rows={8}
                    value={lessonForm.text_content}
                    onChange={(e) => setLessonForm({ ...lessonForm, text_content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent font-mono text-sm"
                    placeholder="Escribe el contenido de la lección..."
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_free_preview"
                  checked={lessonForm.is_free_preview}
                  onChange={(e) => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked })}
                  className="w-4 h-4 text-[#a4c639] border-gray-300 rounded focus:ring-[#a4c639]"
                />
                <label htmlFor="is_free_preview" className="text-sm text-gray-700">
                  Vista previa gratuita (visible sin comprar el curso)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLessonModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveLesson}
                disabled={!lessonForm.title || uploadingVideo || uploadingPDF}
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
