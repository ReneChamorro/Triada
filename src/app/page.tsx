'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen, GraduationCap, Users, Award,
  ArrowRight, CheckCircle2, Star, ChevronDown,
} from 'lucide-react'
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
  hero_tagline: string | null
  hero_subtitle: string | null
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [features, setFeatures] = useState<LandingFeature[]>([])
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null)

  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const heroContentY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])

  const featuresRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const coursesRef = useRef<HTMLDivElement>(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' })
  const aboutInView = useInView(aboutRef, { once: true, margin: '-80px' })
  const coursesInView = useInView(coursesRef, { once: true, margin: '-80px' })

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: coursesData } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(3)
      if (coursesData) setCourses(coursesData)

      const { data: featuresData } = await supabase
        .from('landing_features')
        .select('*')
        .order('position')
      if (featuresData) setFeatures(featuresData)

      const { data: aboutData } = await supabase
        .from('landing_about')
        .select('*')
        .single()
      if (aboutData) setAboutSection(aboutData)
    }
    fetchData()
  }, [])

  const taglineParts = (aboutSection?.hero_tagline ?? 'Ciencia. Formación. Aplicación.')
    .split('.')
    .filter(Boolean)
    .map((w) => w.trim())

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="home" />

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-white min-h-[92vh] flex items-center"
      >
        {/* Background ovals â€” gentle float, no morphing */}
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-40 w-[640px] h-[420px] bg-[#a4c639]/[0.07]
                     rounded-full rotate-[-18deg] pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
          className="absolute -bottom-24 -left-32 w-[560px] h-[380px] bg-[#2d7a5f]/[0.06]
                     rounded-full rotate-[12deg] pointer-events-none"
        />

        <motion.div
          style={{ y: heroContentY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8
                     pt-12 pb-20 md:pt-16 md:pb-28 flex flex-col items-center text-center"
        >
          {/* Eyebrow â€” editorial lines, no pill */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 mb-10"
          >
            <span className="h-px w-10 bg-[#a4c639]" />
            <span className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest">
              Educación Científica Aplicada
            </span>
            <span className="h-px w-10 bg-[#a4c639]" />
          </motion.div>

          {/* Heading â€” each word staggers in independently */}
          <h1
            className="font-black tracking-tighter leading-[0.9] mb-8"
            style={{ fontSize: 'clamp(3.4rem, 8vw, 7.2rem)' }}
          >
            {taglineParts.map((part, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.15 }}
                className="block"
              >
                {i === 1 ? (
                  <span className="text-[#a4c639]">{part}.</span>
                ) : (
                  <span className="text-[#2d7a5f]">{part}.</span>
                )}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="text-[#2d7a5f]/65 text-lg md:text-xl max-w-xl leading-relaxed mb-11"
          >
            {aboutSection?.hero_subtitle ??
              'Docencia basada en evidencia e investigación aplicada para transformar la práctica profesional'}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-14"
          >
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2.5 bg-[#a4c639] text-white
                         font-bold text-sm px-8 py-3.5 rounded-full
                         hover:bg-[#2d7a5f] transition-colors duration-200
                         shadow-[0_4px_24px_0_rgba(164,198,57,0.28)]"
            >
              Ver Cursos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 border-2 border-[#2d7a5f]/18
                         text-[#2d7a5f] font-semibold text-sm px-8 py-3.5 rounded-full
                         hover:border-[#2d7a5f]/35 hover:bg-[#2d7a5f]/4 transition-all"
            >
              Crear cuenta gratis
            </Link>
          </motion.div>

          {/* Trust badges â€” inline, minimal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {[
              { Icon: CheckCircle2, label: 'Certificación Internacional' },
              { Icon: Star, label: 'Expertos Certificados' },
              { Icon: GraduationCap, label: 'A tu propio ritmo' },
            ].map(({ Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm text-[#2d7a5f]/55">
                <Icon className="h-4 w-4 text-[#a4c639]" />
                {label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5
                     text-[#2d7a5f]/30"
        >
          <span className="text-xs font-medium uppercase tracking-widest">Explorar</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* â”€â”€ FEATURES: Bento Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="bg-white py-20 md:py-28">
        <div ref={featuresRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Editorial header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between
                       mb-10 pb-6 border-b-2 border-[#1a5744]/6"
          >
            <div>
              <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-3">
                ¿Por qué elegirnos?
              </span>
              <h2 className="font-black tracking-tighter text-[#1a5744] leading-none"
                  style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
                Educación<br />de excelencia.
              </h2>
            </div>
            <p className="hidden md:block text-sm text-[#1a5744]/38 max-w-[200px] text-right leading-relaxed">
              Diseñado para profesionales que buscan rigor científico y aplicación práctica.
            </p>
          </motion.div>

          {/* Bento layout: 2-col-wide Ã— 2-row-tall card + 2 side cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                          lg:grid-rows-2 lg:h-[400px]">

            {/* CARD A â€” hero (2 cols Ã— 2 rows) */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.06 }}
              whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className="sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-[#1a5744] rounded-[2.5rem]
                         p-8 relative overflow-hidden flex flex-col justify-between
                         min-h-[260px] lg:min-h-0 group cursor-pointer"
            >
              {/* Oval accents */}
              <div className="absolute -bottom-10 -right-10 w-44 h-72 bg-[#2d7a5f] rounded-full opacity-65 pointer-events-none" />
              <div className="absolute top-6 right-10 w-16 h-28 bg-[#a4c639]/18 rounded-full pointer-events-none" />

              <div className="relative z-10">
                <div className="w-16 h-16 bg-[#a4c639] rounded-[20px] flex items-center justify-center mb-6">
                  {features[0]?.icon_url ? (
                    <div className="relative w-9 h-9">
                      <Image src={features[0].icon_url} alt={features[0].title} fill className="object-contain" />
                    </div>
                  ) : (
                    <Award className="h-8 w-8 text-[#1a5744]" />
                  )}
                </div>
                <h3 className="text-xl md:text-2xl font-black text-[#e8e4d0] tracking-tight mb-3 leading-tight">
                  {features[0]?.title ?? 'Certificación Internacional'}
                </h3>
                <p className="text-[#e8e4d0]/58 text-sm leading-relaxed max-w-[280px]">
                  {features[0]?.description ??
                    'Programas con reconocimiento internacional para impulsar tu desarrollo profesional.'}
                </p>
              </div>

              <div className="relative z-10 mt-4">
                <span className="inline-block bg-[#a4c639] text-[#1a5744] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                  Destacado
                </span>
              </div>
            </motion.div>

            {/* CARD B â€” beige wide (2 cols Ã— 1 row) */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.16 }}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className="sm:col-span-2 lg:col-span-2 bg-[#e8e4d0] rounded-[2.5rem] p-7
                         relative overflow-hidden flex items-center gap-5 min-h-[150px] cursor-pointer"
            >
              {/* Oval accent */}
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-20 h-36 bg-[#a4c639]/14 rounded-full pointer-events-none" />

              <div className="w-16 h-16 bg-[#1a5744] rounded-[20px] flex items-center justify-center flex-shrink-0">
                {features[1]?.icon_url ? (
                  <div className="relative w-9 h-9">
                    <Image src={features[1].icon_url} alt={features[1].title} fill className="object-contain" />
                  </div>
                ) : (
                  <Users className="h-8 w-8 text-[#a4c639]" />
                )}
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-[#1a5744] tracking-tight mb-1 leading-tight">
                  {features[1]?.title ?? 'Comunidad de Expertos'}
                </h3>
                <p className="text-[#1a5744]/52 text-sm leading-relaxed">
                  {features[1]?.description ?? 'Conéctate con una red de profesionales y expertos del área.'}
                </p>
              </div>
            </motion.div>

            {/* CARD C â€” lime accent (2 cols Ã— 1 row) */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.26 }}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className="sm:col-span-2 lg:col-span-2 bg-[#a4c639] rounded-[2.5rem] p-7
                         relative overflow-hidden flex items-center gap-5 min-h-[150px] cursor-pointer"
            >
              {/* Oval accent */}
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-20 h-36 bg-[#1a5744]/10 rounded-full pointer-events-none" />

              <div className="w-16 h-16 bg-[#1a5744]/18 rounded-[20px] flex items-center justify-center flex-shrink-0">
                {features[2]?.icon_url ? (
                  <div className="relative w-9 h-9">
                    <Image src={features[2].icon_url} alt={features[2].title} fill className="object-contain" />
                  </div>
                ) : (
                  <BookOpen className="h-8 w-8 text-[#1a5744]" />
                )}
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-[#1a5744] tracking-tight mb-1 leading-tight">
                  {features[2]?.title ?? 'Contenido Basado en Evidencia'}
                </h3>
                <p className="text-[#1a5744]/62 text-sm leading-relaxed">
                  {features[2]?.description ??
                    'Todo el contenido está respaldado por la última investigación científica.'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* â”€â”€ ABOUT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative bg-[#1a5744] overflow-hidden py-20 md:py-28">
        {/* Oval decorations */}
        <div className="absolute -top-40 right-0 w-96 h-[36rem] bg-[#2d7a5f]/40 rounded-full
                        translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-72 h-88 bg-[#a4c639]/8 rounded-full pointer-events-none" />

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
                <div className="relative rounded-[3rem] overflow-hidden ring-4 ring-[#a4c639]/28
                                aspect-square flex items-center justify-center bg-[#2d7a5f]/35">
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
                <div className="absolute -bottom-4 -right-4 bg-[#a4c639] text-[#1a5744] font-black
                                text-xs font-bold px-5 py-2.5 rounded-full shadow-lg uppercase tracking-widest">
                  Docencia Â· Investigación Â· Innovación
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
              <span className="inline-block text-[#a4c639] text-xs font-bold uppercase tracking-widest mb-4">
                Sobre Triada
              </span>
              <h2 className="font-black tracking-tighter text-[#e8e4d0] mb-6 leading-none"
                  style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
                {aboutSection?.title || 'Sobre Nosotros'}
              </h2>
              <div className="space-y-4 text-[#e8e4d0]/68 text-base leading-relaxed mb-8">
                <p>
                  {aboutSection?.subtitle && (
                    <span className="font-bold text-[#a4c639]">{aboutSection.subtitle} </span>
                  )}
                  {aboutSection?.description ||
                    'es una plataforma educativa dedicada a la excelencia académica.'}
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

      {/* â”€â”€ FEATURED COURSES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="bg-[#e8e4d0] py-20 md:py-28">
        <div ref={coursesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Editorial header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={coursesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between
                       mb-10 pb-6 border-b-2 border-[#1a5744]/8"
          >
            <div>
              <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-3">
                Aprende con los mejores
              </span>
              <h2 className="font-black tracking-tighter text-[#1a5744] leading-none"
                  style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
                Cursos<br />Destacados.
              </h2>
            </div>
            <Link
              href="/courses"
              className="group hidden md:inline-flex items-center gap-2 text-sm font-semibold text-[#1a5744] uppercase tracking-widest hover:text-[#2d7a5f] transition-colors"
            >
              Ver todos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <div className={`grid gap-6 ${
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
                <div className="w-16 h-16 rounded-3xl bg-[#1a5744]/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-[#1a5744]" />
                </div>
                <p className="text-[#1a5744]/45 font-semibold">No hay cursos destacados disponibles</p>
              </div>
            )}
          </div>

          {/* Mobile CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={coursesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-center mt-12 md:hidden"
          >
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#1a5744] text-[#e8e4d0]
                         font-semibold text-sm rounded-full
                         hover:bg-[#2d7a5f] transition-colors"
            >
              Ver todos los cursos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

