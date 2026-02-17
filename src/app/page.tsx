'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, GraduationCap, Users, Award, ArrowRight, PlayCircle, CheckCircle2, Shield, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import AboutModal from '@/components/AboutModal'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CourseCard from '@/components/CourseCard'
import { createClient } from '@/lib/supabase/client'

interface LandingFeature {
  id: string
  title: string
  description: string
  icon_url: string | null
  position: number
  is_highlighted: boolean
}

interface AboutSection {
  title: string
  subtitle: string | null
  description: string
  description_secondary: string | null
  image_url: string | null
  button_text: string
}

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [features, setFeatures] = useState<LandingFeature[]>([])
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      
      // Fetch featured courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (coursesData) setCourses(coursesData)

      // Fetch landing features
      const { data: featuresData } = await supabase
        .from('landing_features')
        .select('*')
        .order('position')
      
      if (featuresData) setFeatures(featuresData)

      // Fetch about section
      const { data: aboutData } = await supabase
        .from('landing_about')
        .select('*')
        .single()
      
      if (aboutData) setAboutSection(aboutData)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <AboutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Main Navigation */}
      <Header currentPage="home" />

      {/* Hero Section */}
      <section className="relative bg-[#e8e4d0] pt-16 pb-0 overflow-hidden">
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 pb-32">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a5744] mb-6 leading-tight uppercase">
            Transforma tu Carrera Profesional,<br />
            Aprende con los Mejores
          </h1>
          <p className="text-lg md:text-xl text-[#1a5744]/80 mb-16 max-w-3xl mx-auto">
            Accede a cursos de alta calidad diseñados por expertos. Aprende a tu ritmo y obtén certificación reconocida internacionalmente.
          </p>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                className={`${
                  feature.is_highlighted
                    ? 'bg-[#a4c639] transform md:-translate-y-4'
                    : 'bg-[#e8e4d0]'
                } rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all`}
              >
                <div className="w-full h-40 bg-white rounded-xl mb-6 flex items-center justify-center overflow-hidden">
                  {feature.icon_url ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={feature.icon_url}
                        alt={feature.title}
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  ) : (
                    // Fallback icons
                    index === 0 ? <Award className="h-20 w-20 text-[#2d7a5f]" /> :
                    index === 1 ? <Users className="h-20 w-20 text-[#2d7a5f]" /> :
                    <BookOpen className="h-20 w-20 text-[#2d7a5f]" />
                  )}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  feature.is_highlighted ? 'text-[#1a5744]' : 'text-[#1a5744]'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  feature.is_highlighted ? 'text-[#1a5744]' : 'text-gray-700'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="relative bg-[#a4c639] py-20 overflow-hidden -mt-1 pb-0">
        {/* Decorative Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0 -mb-1">
          <svg viewBox="0 0 1440 320" className="w-full h-auto block">
            <path 
              fill="#e8e4d0" 
              fillOpacity="1" 
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pb-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Image/Placeholder */}
            <div className="order-2 md:order-1">
              <div className="bg-[#e8e4d0] rounded-3xl border-8 border-[#e8e4d0] shadow-2xl overflow-hidden aspect-square flex items-center justify-center">
                {aboutSection?.image_url ? (
                  <div className="relative w-full h-full p-8">
                    <Image
                      src={aboutSection.image_url}
                      alt={aboutSection.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <GraduationCap className="h-32 w-32 text-[#2d7a5f]" />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {aboutSection?.title || 'Sobre Nosotros'}
              </h2>
              <div className="space-y-4 text-white/90 text-lg leading-relaxed mb-8">
                <p>
                  {aboutSection?.subtitle && (
                    <span className="font-bold text-[#1a5744]">{aboutSection.subtitle} </span>
                  )}
                  {aboutSection?.description || 'es una plataforma educativa dedicada a la excelencia académica.'}
                </p>
                {aboutSection?.description_secondary && (
                  <p>{aboutSection.description_secondary}</p>
                )}
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-block bg-[#e8e4d0] text-[#1a5744] hover:bg-white px-8 py-3 rounded-full text-lg font-bold transition-colors shadow-lg cursor-pointer"
              >
                {aboutSection?.button_text || 'Ver Más'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="bg-[#e8e4d0] pt-0 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#1a5744] mb-4">Cursos Destacados</h2>
            <p className="text-lg text-gray-600">
              Explora nuestra selección de cursos más recientes
            </p>
          </div>
          <div className={`grid gap-8 ${courses.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : courses.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
            {courses && courses.length > 0 ? (
              courses.slice(0, 3).map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description || course.short_description || ''}
                  price={course.price}
                  thumbnail_url={course.image_url}
                  Icon={BookOpen}
                  category={course.category}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No hay cursos destacados disponibles</p>
              </div>
            )}
          </div>
          <div className="text-center mt-12">
            <Link 
              href="/courses" 
              className="inline-flex items-center bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              Ver Todos los Cursos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
