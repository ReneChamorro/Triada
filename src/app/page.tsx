'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, GraduationCap, Users, Award, ArrowRight, CheckCircle2, Star, Sparkles, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { ExpandableAboutCards } from '@/components/ExpandableAboutCards'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CourseCard from '@/components/CourseCard'
import { createClient } from '@/lib/supabase/client'

interface Course {
  id: string
  title: string
  description: string | null
  short_description: string | null
  price: number
  currency: string
  image_url: string | null
  category: string | null
  duration_minutes: number | null
  status: string
  is_featured: boolean
}

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
  const [courses, setCourses] = useState<Course[]>([])
  const [features, setFeatures] = useState<LandingFeature[]>([])
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null)

  // Scroll-based parallax for hero
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // InView refs for sections
  const featuresRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const coursesRef = useRef<HTMLDivElement>(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' })
  const aboutInView = useInView(aboutRef, { once: true, margin: '-80px' })
  const coursesInView = useInView(coursesRef, { once: true, margin: '-80px' })

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
      {/* Main Navigation */}
      <Header currentPage="home" />

      {/* ── Hero Section ─────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-hero-gradient min-h-[90vh] flex items-center"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#a4c639]/10 animate-blob" />
          <div className="absolute top-20 -right-20 w-[400px] h-[400px] rounded-full bg-[#2d7a5f]/8 animate-blob-2" />
          <div className="absolute -bottom-20 left-1/3 w-[350px] h-[350px] rounded-full bg-[#e8e4d0]/60 animate-blob-3" />
          {/* Dot grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#a4c639" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28"
        >
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#2d7a5f]/10 border border-[#2d7a5f]/20 text-[#2d7a5f] text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#a4c639]" />
              Plataforma Educativa Profesional
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#2d7a5f] mb-6 leading-[1.08] tracking-tight"
            >
              Transforma tu{' '}
              <span className="relative inline-block">
                <span className="text-gradient-green">Carrera</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.55 }}
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-[#a4c639] rounded-full origin-left"
                />
              </span>
              <br className="hidden sm:block" />
              {' '}Profesional
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="text-lg md:text-xl text-[#2d7a5f]/70 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Accede a cursos de alta calidad diseñados por expertos. Aprende a tu ritmo y obtén certificación reconocida internacionalmente.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.34 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
            >
              <Link
                href="/courses"
                className="group flex items-center gap-2 px-8 py-3.5 bg-[#a4c639] text-white font-semibold rounded-xl shadow-lg shadow-[#a4c639]/35 hover:bg-[#2d7a5f] hover:shadow-[#2d7a5f]/30 transition-all duration-200"
              >
                Ver Cursos
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-8 py-3.5 bg-white text-[#2d7a5f] font-semibold rounded-xl border-2 border-[#2d7a5f]/25 hover:border-[#2d7a5f]/50 hover:bg-[#2d7a5f]/5 transition-all duration-200"
              >
                Crear cuenta gratis
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
            >
              {[
                { icon: CheckCircle2, label: 'Certificación Internacional' },
                { icon: Star, label: 'Expertos Certificados' },
                { icon: GraduationCap, label: 'A tu propio ritmo' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-[#a4c639]" />
                  {label}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-[#2d7a5f]/50"
        >
          <span className="text-xs font-medium tracking-widest uppercase">Explorar</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Section ─────────────────────────── */}
      <section className="bg-[#e8e4d0] py-20 md:py-28">
        <div ref={featuresRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-3">
              ¿Por qué elegirnos?
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2d7a5f]">
              Educación de excelencia a tu alcance
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 32 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: index * 0.12 }}
                className={`group relative rounded-2xl p-7 card-hover overflow-hidden ${
                  feature.is_highlighted
                    ? 'bg-gradient-to-br from-[#a4c639] to-[#2d7a5f] text-white shadow-xl shadow-[#a4c639]/30 ring-2 ring-[#a4c639]/50'
                    : 'bg-white shadow-md shadow-black/5 ring-1 ring-black/5'
                }`}
              >
                {/* Highlight glow blob */}
                {feature.is_highlighted && (
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#a4c639]/20 blur-2xl" />
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl mb-5 flex items-center justify-center overflow-hidden ${
                  feature.is_highlighted ? 'bg-white/15' : 'bg-[#e8e4d0]'
                }`}>
                  {feature.icon_url ? (
                    <div className="relative w-10 h-10">
                      <Image src={feature.icon_url} alt={feature.title} fill className="object-contain" />
                    </div>
                  ) : (
                    index === 0
                      ? <Award className={`h-7 w-7 ${feature.is_highlighted ? 'text-[#a4c639]' : 'text-[#2d7a5f]'}`} />
                      : index === 1
                      ? <Users className={`h-7 w-7 ${feature.is_highlighted ? 'text-[#a4c639]' : 'text-[#2d7a5f]'}`} />
                      : <BookOpen className={`h-7 w-7 ${feature.is_highlighted ? 'text-[#a4c639]' : 'text-[#2d7a5f]'}`} />
                  )}
                </div>

                <h3 className={`text-lg font-bold mb-2 ${feature.is_highlighted ? 'text-white' : 'text-[#2d7a5f]'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm leading-relaxed ${feature.is_highlighted ? 'text-white/85' : 'text-gray-600'}`}>
                  {feature.description}
                </p>

                {feature.is_highlighted && (
                  <span className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-[#a4c639] bg-[#a4c639]/15 px-2 py-0.5 rounded-full">
                    Destacado
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Us Section ─────────────────────────── */}
      <section className="relative bg-[#2d7a5f] overflow-hidden py-20 md:py-28">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg className="w-full h-full"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/></svg>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#a4c639]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-[#a4c639]/20 blur-3xl pointer-events-none" />

        <div ref={aboutRef} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={aboutInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65 }}
              className="order-2 md:order-1"
            >
              <div className="relative">
                <div className="absolute -inset-3 rounded-3xl bg-[#a4c639]/20 blur-xl" />
                <div className="relative rounded-3xl overflow-hidden ring-4 ring-[#a4c639]/40 aspect-square flex items-center justify-center bg-[#a4c639]/20">
                  {aboutSection?.image_url ? (
                    <Image
                      src={aboutSection.image_url}
                      alt={aboutSection.title}
                      fill
                      className="object-contain p-8"
                    />
                  ) : (
                    <GraduationCap className="h-28 w-28 text-[#a4c639]" />
                  )}
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 bg-[#a4c639] text-white font-bold text-sm px-4 py-2 rounded-xl shadow-lg">
                  Docencia · Investigación · Innovación
                </div>
              </div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={aboutInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="order-1 md:order-2"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-4">
                Sobre Triada
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                {aboutSection?.title || 'Sobre Nosotros'}
              </h2>
              <div className="space-y-4 text-white/80 text-lg leading-relaxed mb-8">
                <p>
                  {aboutSection?.subtitle && (
                    <span className="font-semibold text-[#a4c639]">{aboutSection.subtitle} </span>
                  )}
                  {aboutSection?.description || 'es una plataforma educativa dedicada a la excelencia académica.'}
                </p>
                {aboutSection?.description_secondary && (
                  <p>{aboutSection.description_secondary}</p>
                )}
              </div>
              <ExpandableAboutCards />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured Courses ─────────────────────────── */}
      <section className="bg-white py-20 md:py-28">
        <div ref={coursesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={coursesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-3">
              Aprende con los mejores
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#2d7a5f] mb-4">
              Cursos Destacados
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Explora nuestra selección de cursos más recientes
            </p>
          </motion.div>

          <div className={`grid gap-6 md:gap-8 ${
            courses.length === 1
              ? 'grid-cols-1 max-w-md mx-auto'
              : courses.length === 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}>
            {courses && courses.length > 0 ? (
              courses.slice(0, 3).map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={coursesInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <CourseCard
                    id={course.id}
                    title={course.title}
                    description={course.description || course.short_description || ''}
                    short_description={course.short_description}
                    price={course.price}
                    currency={course.currency}
                    thumbnail_url={course.image_url}
                    Icon={BookOpen}
                    category={course.category}
                    duration_minutes={course.duration_minutes}
                  />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#e8e4d0] flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-[#2d7a5f]" />
                </div>
                <p className="text-gray-500">No hay cursos destacados disponibles</p>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={coursesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-center mt-14"
          >
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[#a4c639] text-white font-semibold rounded-xl shadow-lg shadow-[#a4c639]/30 hover:bg-[#2d7a5f] transition-all duration-200"
            >
              Ver Todos los Cursos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
