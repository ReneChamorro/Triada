'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function CourseLearningPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [courseId, setCourseId] = useState('')
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [watermarkText, setWatermarkText] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)

      const supabase = createClient()

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?redirect=/courses/${resolvedParams.id}/learn`)
        return
      }
      setUser(user)

      // Fetch user profile for watermark
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name, lastname')
        .eq('id', user.id)
        .single()

      if (profile) {
        setWatermarkText(`${profile.email} • ${profile.name || ''} ${profile.lastname || ''}`.trim())
      }

      // Check if user has access to this course
      const { data: userCourse } = await supabase
        .from('user_courses')
        .select('id, last_accessed_at')
        .eq('user_id', user.id)
        .eq('course_id', resolvedParams.id)
        .single()

      if (!userCourse) {
        router.push(`/courses/${resolvedParams.id}`)
        return
      }

      setHasAccess(true)

      // Update last accessed timestamp
      await supabase
        .from('user_courses')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', userCourse.id)

      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      setCourse(courseData)
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Disable common keyboard shortcuts for screenshots/recording
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Screen, F12, Ctrl+Shift+I, Ctrl+S, etc.
      if (
        e.key === 'PrintScreen' ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 's') ||
        (e.metaKey && e.shiftKey && e.key === '3') || // Mac screenshot
        (e.metaKey && e.shiftKey && e.key === '4') || // Mac screenshot
        (e.metaKey && e.shiftKey && e.key === '5')  // Mac screenshot
      ) {
        e.preventDefault()
        return false
      }
    }

    // Detect DevTools
    const detectDevTools = () => {
      const threshold = 160
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        // DevTools detected - could blur content or show warning
        document.body.style.filter = 'blur(5px)'
      } else {
        document.body.style.filter = 'none'
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    const devToolsInterval = setInterval(detectDevTools, 1000)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      clearInterval(devToolsInterval)
      document.body.style.filter = 'none'
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!hasAccess || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes acceso a este curso</p>
          <Link href="/courses" className="text-blue-600 hover:underline">
            Ver cursos disponibles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/my-courses" className="flex items-center space-x-2 text-white">
              <GraduationCap className="h-6 w-6" />
              <span className="font-bold">Triada</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">{course.title}</span>
              <Link 
                href="/my-courses" 
                className="text-gray-300 hover:text-white text-sm"
              >
                Mis Cursos
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
          {course.description && (
            <p className="text-gray-300">{course.description}</p>
          )}
        </div>

        {/* Video Player with Protection */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ userSelect: 'none' }}>
          {course.video_url ? (
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                style={{ userSelect: 'none', pointerEvents: 'auto' }}
              >
                <source src={course.video_url} type="video/mp4" />
                Tu navegador no soporta la reproducción de video.
              </video>

              {/* Watermark Overlay */}
              {watermarkText && (
                <>
                  <div 
                    className="absolute top-4 right-4 text-white/40 text-xs font-mono pointer-events-none"
                    style={{ userSelect: 'none' }}
                  >
                    {watermarkText}
                  </div>
                  <div 
                    className="absolute bottom-4 left-4 text-white/30 text-xs font-mono pointer-events-none"
                    style={{ userSelect: 'none' }}
                  >
                    {watermarkText}
                  </div>
                  {/* Center watermark - more subtle */}
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/20 text-sm font-mono pointer-events-none rotate-[-15deg]"
                    style={{ userSelect: 'none' }}
                  >
                    {watermarkText}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="aspect-video flex items-center justify-center bg-gray-800">
              <div className="text-center text-gray-400">
                <p className="mb-2">No hay video disponible para este curso</p>
                <p className="text-sm">Contacta al administrador para más información</p>
              </div>
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Información del Curso</h2>
            {course.duration_minutes && (
              <span className="text-gray-400 text-sm">
                Duración: {course.duration_minutes} minutos
              </span>
            )}
          </div>
          
          <div className="prose prose-invert max-w-none">
            {course.description ? (
              <p className="text-gray-300">{course.description}</p>
            ) : (
              <p className="text-gray-400">Disfruta de este contenido exclusivo</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-start space-x-2 text-sm text-gray-400">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-300 mb-1">Contenido Protegido</p>
                <p>
                  Este contenido está protegido contra captura de pantalla y grabación.
                  El uso no autorizado está prohibido y puede resultar en la suspensión de tu cuenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
