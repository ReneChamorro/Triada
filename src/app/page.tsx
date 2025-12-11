'use client'

import Link from 'next/link'
import { BookOpen, GraduationCap, Users, Award, ArrowRight, PlayCircle, CheckCircle2, Shield, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import AboutModal from '@/components/AboutModal'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courses, setCourses] = useState<any[]>([])

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient()
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(6)
      
      if (data) setCourses(data)
    }
    fetchCourses()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <AboutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <AboutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Top Bar */}
      <div className="bg-[#1a5744] text-white py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm">
            <span>Educación de calidad para profesionales</span>
            <Link href="/login" className="hover:underline">Mi Cuenta</Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3">
              <GraduationCap className="h-10 w-10 text-[#2d7a5f]" />
              <div>
                <span className="text-2xl font-bold text-[#1a5744] block">TRIADA</span>
                <span className="text-xs text-gray-600">Global, Docencia e Investigación</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/courses" 
                className="text-gray-700 hover:text-[#2d7a5f] font-medium transition-colors"
              >
                Cursos
              </Link>
              <Link 
                href="/courses" 
                className="text-gray-700 hover:text-[#2d7a5f] font-medium transition-colors"
              >
                Programas
              </Link>
              <Link 
                href="#about" 
                className="text-gray-700 hover:text-[#2d7a5f] font-medium transition-colors"
              >
                Nosotros
              </Link>
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-[#2d7a5f] font-medium transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/register" 
                className="bg-[#2d7a5f] text-white hover:bg-[#1a5744] px-6 py-2.5 rounded-md font-medium transition-colors"
              >
                Comenzar
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#1a5744] via-[#2d7a5f] to-[#1a5744] pt-20 pb-32 overflow-hidden">
        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path 
              fill="#a4c639" 
              fillOpacity="1" 
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight uppercase">
            Transforma tu Carrera Profesional,<br />
            Aprende con los Mejores
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-16 max-w-3xl mx-auto">
            Accede a cursos de alta calidad diseñados por expertos. Aprende a tu ritmo y obtén certificación reconocida internacionalmente.
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="bg-[#e8e4d0] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-full h-40 bg-white rounded-xl mb-6 flex items-center justify-center">
                <Award className="h-20 w-20 text-[#2d7a5f]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a5744] mb-3">
                Certificación Internacional
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Obtén certificados reconocidos que impulsan tu carrera profesional en cualquier parte del mundo
              </p>
            </div>

            {/* Card 2 - Highlighted */}
            <div className="bg-[#a4c639] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow transform md:-translate-y-4">
              <div className="w-full h-40 bg-white rounded-xl mb-6 flex items-center justify-center">
                <Users className="h-20 w-20 text-[#2d7a5f]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a5744] mb-3">
                Instructores Expertos
              </h3>
              <p className="text-[#1a5744] text-sm leading-relaxed">
                Aprende de profesionales con años de experiencia en el campo y metodologías probadas
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#e8e4d0] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-full h-40 bg-white rounded-xl mb-6 flex items-center justify-center">
                <BookOpen className="h-20 w-20 text-[#2d7a5f]" />
              </div>
              <h3 className="text-xl font-bold text-[#1a5744] mb-3">
                Aprende a tu Ritmo
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                Acceso 24/7 a todo el contenido desde cualquier dispositivo, donde quieras y cuando quieras
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative bg-gradient-to-br from-[#1a5744] via-[#2d7a5f] to-[#1a5744] py-20 overflow-hidden">
        {/* Decorative Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 320" className="w-full h-auto">
            <path 
              fill="#a4c639" 
              fillOpacity="1" 
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image/Placeholder */}
            <div className="order-2 md:order-1">
              <div className="bg-[#e8e4d0] rounded-3xl border-8 border-[#e8e4d0] shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <GraduationCap className="h-32 w-32 text-[#2d7a5f]" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Sobre Nosotros
              </h2>
              <div className="space-y-4 text-white/90 text-lg leading-relaxed mb-8">
                <p>
                  <span className="font-bold text-white">Triada Global</span> es una plataforma educativa dedicada a la excelencia académica. Ofrecemos programas de capacitación profesional diseñados por expertos en diversas áreas del conocimiento.
                </p>
                <p>
                  Nuestra misión es transformar la educación mediante metodologías innovadoras que permiten a profesionales de todo el mundo acceder a contenido de alta calidad, desarrollar nuevas habilidades y alcanzar sus metas profesionales.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-block bg-[#a4c639] text-[#1a5744] hover:bg-[#8db030] px-8 py-3 rounded-full text-lg font-bold transition-colors shadow-lg cursor-pointer"
              >
                Ver Más
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#1a5744] mb-4">¿Por qué elegir Triada?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ofrecemos una experiencia de aprendizaje diseñada para profesionales que buscan excelencia
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-[#e8e4d0] rounded-xl hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2d7a5f] rounded-full mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a5744] mb-3">Certificación Internacional</h3>
              <p className="text-gray-700">
                Obtén certificados reconocidos que impulsan tu carrera profesional
              </p>
            </div>
            <div className="text-center p-8 bg-[#e8e4d0] rounded-xl hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2d7a5f] rounded-full mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a5744] mb-3">Instructores Expertos</h3>
              <p className="text-gray-700">
                Aprende de profesionales con años de experiencia en el campo
              </p>
            </div>
            <div className="text-center p-8 bg-[#e8e4d0] rounded-xl hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2d7a5f] rounded-full mb-6">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#1a5744] mb-3">Aprende a tu Ritmo</h3>
              <p className="text-gray-700">
                Acceso 24/7 a todo el contenido desde cualquier dispositivo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-gradient-to-br from-[#e8e4d0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#1a5744] mb-4">Cursos Destacados</h2>
            <p className="text-lg text-gray-600">
              Explora nuestra selección de cursos más recientes
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {courses && courses.length > 0 ? (
              courses.slice(0, 3).map((course) => (
                <Link 
                  key={course.id} 
                  href={`/courses/${course.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  {course.thumbnail_url ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a5744] mb-3 group-hover:text-[#2d7a5f] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#2d7a5f]">
                        ${course.price}
                      </span>
                      <span className="text-[#2d7a5f] font-medium group-hover:underline flex items-center">
                        Ver más
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Mock courses for demonstration
              <>
                <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                  <div className="aspect-video bg-gradient-to-br from-[#2d7a5f] to-[#a4c639] flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a5744] mb-3 group-hover:text-[#2d7a5f] transition-colors">
                      Introducción a la Psicología Clínica
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      Aprende los fundamentos de la psicología clínica con expertos reconocidos internacionalmente
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#2d7a5f]">
                        $99
                      </span>
                      <Link href="/courses" className="text-[#2d7a5f] font-medium group-hover:underline flex items-center">
                        Ver más
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                  <div className="aspect-video bg-gradient-to-br from-[#1a5744] to-[#2d7a5f] flex items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a5744] mb-3 group-hover:text-[#2d7a5f] transition-colors">
                      Terapia Cognitivo Conductual Avanzada
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      Domina las técnicas más efectivas de TCC para casos complejos
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#2d7a5f]">
                        $149
                      </span>
                      <Link href="/courses" className="text-[#2d7a5f] font-medium group-hover:underline flex items-center">
                        Ver más
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                  <div className="aspect-video bg-gradient-to-br from-[#a4c639] to-[#2d7a5f] flex items-center justify-center">
                    <Users className="h-16 w-16 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a5744] mb-3 group-hover:text-[#2d7a5f] transition-colors">
                      Intervención en Crisis y Emergencias
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      Desarrolla habilidades para actuar efectivamente en situaciones de crisis
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#2d7a5f]">
                        $129
                      </span>
                      <Link href="/courses" className="text-[#2d7a5f] font-medium group-hover:underline flex items-center">
                        Ver más
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="text-center mt-12">
            <Link 
              href="/courses" 
              className="inline-flex items-center bg-[#2d7a5f] text-white hover:bg-[#1a5744] px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Ver Todos los Cursos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <GraduationCap className="h-8 w-8" />
              <span className="text-2xl font-bold">Triada</span>
            </div>
            <p className="text-gray-400 mb-4">
              Tu plataforma de aprendizaje online
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <Link href="/courses" className="hover:text-white">Cursos</Link>
              <Link href="/login" className="hover:text-white">Iniciar Sesión</Link>
              <Link href="/register" className="hover:text-white">Registrarse</Link>
            </div>
            <p className="text-gray-500 text-sm mt-8">
              © 2025 Triada. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
