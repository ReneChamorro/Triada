
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Menu,
  X,
  PlayCircle,
  FileText,
  Download,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';

interface Module {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: 'video' | 'pdf' | 'text';
  video_url: string | null;
  youtube_video_id: string | null;
  pdf_url: string | null;
  text_content: string | null;
  duration_minutes: number;
  position: number;
  is_completed?: boolean;
}

export default function LearnCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // Track if on mobile
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAccessAndLoadData();
  }, [courseId]);

  // Auto-open sidebar on desktop, track mobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      
      if (!mobile) {
        setSidebarOpen(true); // Auto-open on desktop
      } else {
        setSidebarOpen(false); // Auto-close on mobile
      }
    };

    // Initial check
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function checkAccessAndLoadData() {
    try {
      // Check authentication
      const { data: { user: userData } } = await supabase.auth.getUser();
      
      if (!userData) {
        router.push(`/login?redirect=/courses/${courseId}/learn`);
        return;
      }

      setUser(userData);

      // Check if user has access to the course
      const { data: userCourse } = await supabase
        .from('user_courses')
        .select('*')
        .eq('user_id', userData.id)
        .eq('course_id', courseId)
        .single();

      if (!userCourse) {
        router.push(`/courses/${courseId}`);
        return;
      }

      setHasAccess(true);

      // Load course data
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
        .eq('is_published', true)
        .order('position');

      if (modulesData) {
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module) => {
            const { data: lessons } = await supabase
              .from('course_lessons')
              .select('*')
              .eq('module_id', module.id)
              .eq('is_published', true)
              .order('position');
            
            return {
              ...module,
              lessons: lessons || []
            };
          })
        );
        
        setModules(modulesWithLessons);

        // Load completed lessons from database
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', userData.id)
          .eq('course_id', courseId);

        const completed = new Set<string>();
        if (progressData) {
          progressData.forEach(p => completed.add(p.lesson_id));
        }
        setCompletedLessons(completed);

        // Resume functionality: try to load last accessed lesson
        const { data: lastLessonId } = await supabase
          .rpc('get_last_accessed_lesson', {
            p_user_id: userData.id,
            p_course_id: courseId
          });

        let lessonToSelect = null;

        if (lastLessonId) {
          // Find the last accessed lesson
          for (const module of modulesWithLessons) {
            const foundLesson = module.lessons.find((l: Lesson) => l.id === lastLessonId);
            if (foundLesson) {
              lessonToSelect = foundLesson;
              break;
            }
          }
        }

        // If no last accessed lesson, start with first lesson
        if (!lessonToSelect && modulesWithLessons.length > 0 && modulesWithLessons[0].lessons.length > 0) {
          lessonToSelect = modulesWithLessons[0].lessons[0];
        }

        if (lessonToSelect) {
          setCurrentLesson(lessonToSelect);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const selectLesson = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    // Track last accessed lesson
    if (user) {
      await supabase
        .from('lesson_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lesson.id,
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id'
        });
    }
  };

  const markAsCompleted = async () => {
    if (!currentLesson || !user) return;
    
    const newCompleted = new Set(completedLessons);
    newCompleted.add(currentLesson.id);
    setCompletedLessons(newCompleted);
    
    // Save to database
    await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: currentLesson.id,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      });
    
    // The trigger will automatically update user_courses.progress_percentage
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;

    // Find current lesson index
    let found = false;
    for (const module of modules) {
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      
      if (lessonIndex !== -1) {
        // Check if there's a next lesson in this module
        if (lessonIndex < module.lessons.length - 1) {
          setCurrentLesson(module.lessons[lessonIndex + 1]);
          found = true;
          break;
        } else {
          // Check next module
          const moduleIndex = modules.findIndex(m => m.id === module.id);
          if (moduleIndex < modules.length - 1) {
            const nextModule = modules[moduleIndex + 1];
            if (nextModule.lessons.length > 0) {
              setCurrentLesson(nextModule.lessons[0]);
              found = true;
              break;
            }
          }
        }
      }
    }

    if (found && !completedLessons.has(currentLesson.id)) {
      markAsCompleted();
    }
  };

  const goToPreviousLesson = () => {
    if (!currentLesson) return;

    for (const module of modules) {
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      
      if (lessonIndex !== -1) {
        // Check if there's a previous lesson in this module
        if (lessonIndex > 0) {
          setCurrentLesson(module.lessons[lessonIndex - 1]);
          break;
        } else {
          // Check previous module
          const moduleIndex = modules.findIndex(m => m.id === module.id);
          if (moduleIndex > 0) {
            const prevModule = modules[moduleIndex - 1];
            if (prevModule.lessons.length > 0) {
              setCurrentLesson(prevModule.lessons[prevModule.lessons.length - 1]);
              break;
            }
          }
        }
      }
    }
  };

  const canGoNext = () => {
    if (!currentLesson) return false;
    
    for (let i = 0; i < modules.length; i++) {
      const lessonIndex = modules[i].lessons.findIndex(l => l.id === currentLesson.id);
      if (lessonIndex !== -1) {
        return lessonIndex < modules[i].lessons.length - 1 || i < modules.length - 1;
      }
    }
    return false;
  };

  const canGoPrevious = () => {
    if (!currentLesson) return false;
    
    for (let i = 0; i < modules.length; i++) {
      const lessonIndex = modules[i].lessons.findIndex(l => l.id === currentLesson.id);
      if (lessonIndex !== -1) {
        return lessonIndex > 0 || i > 0;
      }
    }
    return false;
  };

  const calculateProgress = () => {
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.size / totalLessons) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5E6D3]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#F5E6D3] relative overflow-hidden">
      {/* Mobile Overlay - SOLO en mobile cuando sidebar abierto */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative lg:translate-x-0 z-30 w-80 h-full bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col border-r border-gray-200 overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-[#2d7a5f]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver al curso</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-600 hover:text-[#2d7a5f]"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <h2 className="text-[#1a5744] font-bold text-lg line-clamp-2">
            {course?.title}
          </h2>
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Progreso del curso</span>
              <span className="font-semibold text-[#2d7a5f]">{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#a4c639] h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-b border-gray-200">
              <div className="p-4 bg-gradient-to-r from-[#a4c639]/10 to-[#2d7a5f]/10">
                <h3 className="text-[#1a5744] font-semibold text-sm">
                  Módulo {moduleIndex + 1}: {module.title}
                </h3>
              </div>
              <div>
                {module.lessons.map((lesson, lessonIndex) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isCompleted = completedLessons.has(lesson.id);
                  
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => selectLesson(lesson)}
                      className={`w-full text-left p-4 flex items-start space-x-3 transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-[#a4c639] to-[#2d7a5f] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                          {lessonIndex + 1}. {lesson.title}
                        </p>
                        {lesson.duration_minutes > 0 && (
                          <p className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {lesson.duration_minutes} min
                          </p>
                        )}
                      </div>
                      {lesson.content_type === 'video' && (
                        <PlayCircle className="w-4 h-4 flex-shrink-0" />
                      )}
                      {lesson.content_type === 'pdf' && (
                        <FileText className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {modules.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              <p>Este curso aún no tiene contenido disponible.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[#2d7a5f]"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 lg:ml-0 ml-4">
            <h1 className="text-[#1a5744] font-semibold text-lg line-clamp-1">
              {currentLesson?.title || 'Selecciona una lección'}
            </h1>
          </div>
        </header>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto bg-[#F5E6D3]">
          {currentLesson ? (
            <div className="max-w-6xl mx-auto">
              {/* Video Content */}
              {currentLesson.content_type === 'video' && (currentLesson.video_url || currentLesson.youtube_video_id) && (
                <div className="relative rounded-xl overflow-hidden m-6 shadow-2xl">
                  <VideoPlayer
                    videoUrl={currentLesson.video_url}
                    youtubeVideoId={currentLesson.youtube_video_id}
                    title={currentLesson.title}
                    autoplay={true}
                  />
                </div>
              )}

              {/* PDF Content */}
              {currentLesson.content_type === 'pdf' && currentLesson.pdf_url && (
                <div className="p-8">
                  <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {currentLesson.title}
                      </h2>
                      <a
                        href={currentLesson.pdf_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#a4c639] to-[#2d7a5f] text-white rounded-lg hover:shadow-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar PDF</span>
                      </a>
                    </div>
                    <iframe
                      src={currentLesson.pdf_url}
                      className="w-full h-[800px] border-2 border-gray-200 rounded"
                      title={currentLesson.title}
                    />
                  </div>
                </div>
              )}

              {/* Text Content */}
              {currentLesson.content_type === 'text' && (
                <div className="p-8">
                  <div className="bg-white rounded-xl p-8 max-w-4xl mx-auto shadow-2xl">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {currentLesson.title}
                    </h2>
                    {currentLesson.description && (
                      <p className="text-gray-600 mb-6">{currentLesson.description}</p>
                    )}
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-800">
                        {currentLesson.text_content}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Description */}
              {currentLesson.description && currentLesson.content_type !== 'text' && (
                <div className="p-8">
                  <div className="max-w-4xl mx-auto bg-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-[#1a5744] text-xl font-semibold mb-3">
                      Sobre esta lección
                    </h3>
                    <p className="text-gray-700">{currentLesson.description}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-600">
                <p className="text-xl mb-2 font-semibold text-[#1a5744]">Selecciona una lección para comenzar</p>
                <p className="text-sm">Usa el menú lateral para navegar por el contenido</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        {currentLesson && (
          <footer className="bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <button
                onClick={goToPreviousLesson}
                disabled={!canGoPrevious()}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-100 text-[#2d7a5f] border-2 border-gray-200 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Anterior</span>
              </button>

              <button
                onClick={markAsCompleted}
                className={`px-6 py-3 rounded-lg transition-all font-semibold ${
                  completedLessons.has(currentLesson.id)
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gradient-to-r from-[#a4c639] to-[#2d7a5f] text-white hover:shadow-lg'
                }`}
              >
                {completedLessons.has(currentLesson.id) ? (
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Completada</span>
                  </span>
                ) : (
                  'Marcar como completada'
                )}
              </button>

              <button
                onClick={goToNextLesson}
                disabled={!canGoNext()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#a4c639] to-[#2d7a5f] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
