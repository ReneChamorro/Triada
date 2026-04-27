'use client'

import CourseProgressBar from '@/components/CourseProgressBar'
import { logger } from '@/lib/logger'

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
  mux_playback_id: string | null;
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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAccessAndLoadData();
  }, [courseId]);

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
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
        .eq('status', 'published')
        .single();

      if (!courseData) {
        // Course is draft or deleted — redirect away
        router.push('/my-courses');
        return;
      }
      
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

        // Collect all lesson IDs for this course
        const allLessonIds = modulesWithLessons.flatMap(m => m.lessons.map((l: Lesson) => l.id));

        // Load completed lessons from database (filtered by this course's lessons)
        const { data: progressData } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed_at')
          .eq('user_id', userData.id)
          .in('lesson_id', allLessonIds)
          .not('completed_at', 'is', null);

        const completed = new Set<string>();
        if (progressData) {
          progressData.forEach(p => completed.add(p.lesson_id));
        }
        setCompletedLessons(completed);

        // Resume functionality: try to load last accessed lesson (filtered by this course)
        const { data: lastAccessedData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', userData.id)
          .in('lesson_id', allLessonIds)
          .not('last_accessed_at', 'is', null)
          .order('last_accessed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let lessonToSelect = null;

        if (lastAccessedData?.lesson_id) {
          // Find the last accessed lesson
          for (const module of modulesWithLessons) {
            const foundLesson = module.lessons.find((l: Lesson) => l.id === lastAccessedData.lesson_id);
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
      logger.error('Error loading data:', error);
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
    const { error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        lesson_id: currentLesson.id,
        completed: true,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,lesson_id'
      });
    
    if (error) {
      logger.error('Error saving progress:', error);
      // Revert optimistic update
      newCompleted.delete(currentLesson.id);
      setCompletedLessons(new Set(newCompleted));
      return;
    }

    // Update course progress percentage
    const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const progressPercentage = totalLessons > 0 ? Math.round((newCompleted.size / totalLessons) * 100) : 0;
    
    await supabase
      .from('user_courses')
      .update({ progress_percentage: progressPercentage })
      .eq('user_id', user.id)
      .eq('course_id', courseId);
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
      <div className="flex items-center justify-center min-h-screen bg-[#f9f8f4]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-screen bg-[#f9f8f4] relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative lg:translate-x-0 z-30 w-80 h-full bg-[#2d7a5f] shadow-xl transition-transform duration-300 ease-in-out flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <Link href="/courses" className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a cursos</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-white font-bold text-sm line-clamp-2 mb-3">{course?.title}</h2>
          <CourseProgressBar percentage={calculateProgress()} variant="dark" />
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto">
          {modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-b border-white/10">
              <div className="px-4 py-3 bg-black/20">
                <h3 className="text-white/70 font-semibold text-xs uppercase tracking-widest">
                  Módulo {moduleIndex + 1}: {module.title}
                </h3>
              </div>
              <div>
                {module.lessons.map((lesson, lessonIndex) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const isCompleted = completedLessons.has(lesson.id);
                  return (
                    <button key={lesson.id} onClick={() => selectLesson(lesson)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all ${
                        isActive ? 'bg-[#a4c639]/20 border-l-2 border-[#a4c639]' : 'hover:bg-white/10 border-l-2 border-transparent'
                      }`}>
                      <div className="shrink-0 mt-0.5">
                        {isCompleted
                          ? <CheckCircle className="w-4 h-4 text-[#a4c639]" />
                          : <Circle className="w-4 h-4 text-white/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium leading-snug ${
                          isActive ? 'text-[#a4c639]' : 'text-white/80'
                        }`}>
                          {lessonIndex + 1}. {lesson.title}
                        </p>
                        {lesson.duration_minutes > 0 && (
                          <p className="text-xs text-white/40 mt-0.5">{lesson.duration_minutes} min</p>
                        )}
                      </div>
                      {lesson.content_type === 'video' && <PlayCircle className="w-3.5 h-3.5 shrink-0 text-white/30" />}
                      {lesson.content_type === 'pdf' && <FileText className="w-3.5 h-3.5 shrink-0 text-white/30" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {modules.length === 0 && (
            <div className="p-8 text-center text-white/50 text-sm">
              <p>Este curso aún no tiene contenido disponible.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#2d7a5f]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 lg:ml-0 ml-4">
            <h1 className="text-[#2d7a5f] font-bold text-sm line-clamp-1">
              {currentLesson?.title || 'Selecciona una lección'}
            </h1>
          </div>
        </header>

        {/* Lesson Content */}
        <div className="flex-1 overflow-y-auto bg-[#f9f8f4]">
          {currentLesson ? (
            <div className="max-w-6xl mx-auto">
              {/* Video Content */}
              {currentLesson.content_type === 'video' && (currentLesson.mux_playback_id || currentLesson.video_url || currentLesson.youtube_video_id) && (
                <div className="relative rounded-xl overflow-hidden m-2 sm:m-4 lg:m-6 shadow-xl">
                  <VideoPlayer
                    muxPlaybackId={currentLesson.mux_playback_id}
                    viewerUserId={user?.id}
                    videoUrl={currentLesson.video_url}
                    youtubeVideoId={currentLesson.youtube_video_id}
                    title={currentLesson.title}
                    autoplay={true}
                  />
                </div>
              )}

              {/* PDF Content */}
              {currentLesson.content_type === 'pdf' && currentLesson.pdf_url && (
                <div className="p-3 sm:p-6 lg:p-8">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                      <h2 className="text-xl font-bold text-[#2d7a5f]">{currentLesson.title}</h2>
                      <a href={currentLesson.pdf_url} download target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-[#a4c639] hover:bg-[#2d7a5f] text-white rounded-xl text-sm font-semibold transition-all">
                        <Download className="w-4 h-4" />
                        <span>Descargar PDF</span>
                      </a>
                    </div>
                    <iframe src={currentLesson.pdf_url} className="w-full h-[800px] border border-gray-100 rounded-xl" title={currentLesson.title} />
                  </div>
                </div>
              )}

              {/* Text Content */}
              {currentLesson.content_type === 'text' && (
                <div className="p-3 sm:p-6 lg:p-8">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto shadow-sm">
                    <h2 className="text-2xl font-extrabold text-[#2d7a5f] mb-4">{currentLesson.title}</h2>
                    {currentLesson.description && <p className="text-gray-500 mb-6 text-sm">{currentLesson.description}</p>}
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">{currentLesson.text_content}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Lesson Description */}
              {currentLesson.description && currentLesson.content_type !== 'text' && (
                <div className="p-3 sm:p-6 lg:p-8 pt-0">
                  <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1 h-4 rounded-full bg-[#a4c639] inline-block" />
                      <h3 className="text-[#2d7a5f] font-bold text-sm">Sobre esta lección</h3>
                    </div>
                    <p className="text-gray-600 text-sm">{currentLesson.description}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#a4c639]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PlayCircle className="w-8 h-8 text-[#a4c639]" />
                </div>
                <p className="text-[#2d7a5f] font-bold mb-1">Selecciona una lección</p>
                <p className="text-gray-400 text-sm">Usa el menú lateral para navegar</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        {currentLesson && (
          <footer className="bg-white border-t border-gray-100 px-4 py-3 shadow-sm shrink-0">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
              <button onClick={goToPreviousLesson} disabled={!canGoPrevious()}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-100 text-[#2d7a5f] rounded-xl hover:bg-gray-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button onClick={markAsCompleted}
                className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl transition-all font-semibold text-sm ${
                  completedLessons.has(currentLesson.id)
                    ? 'bg-[#2d7a5f] text-white'
                    : 'bg-[#a4c639] hover:bg-[#2d7a5f] text-white shadow-sm shadow-[#a4c639]/30'
                }`}>
                {completedLessons.has(currentLesson.id) ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Completada</span>
                    <span className="sm:hidden">Hecho</span>
                  </span>
                ) : (
                  <span>
                    <span className="hidden sm:inline">Marcar como completada</span>
                    <span className="sm:hidden">Completar</span>
                  </span>
                )}
              </button>

              <button onClick={goToNextLesson} disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-[#a4c639] hover:bg-[#2d7a5f] text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm">
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </main>
    </div>
  );
}
