'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, GraduationCap, Users, Award, ArrowRight } from 'lucide-react'
import { useState, useEffect, type ReactNode } from 'react'
import { motion } from 'motion/react'

// Emil Kowalski's "strong" ease-out — built-in CSS easings lack punch.
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
import { ExpandableAboutCards } from '@/components/ExpandableAboutCards'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CourseCard from '@/components/CourseCard'
import BrandMotif from '@/components/BrandMotif'
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

// Below-the-fold reveal: opacity only, once. Hero renders immediately so the
// first paint already has its content; reduced-motion users get the same fade
// (it carries no movement).
function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [features, setFeatures] = useState<LandingFeature[]>([])
  const [aboutSection, setAboutSection] = useState<AboutSection | null>(null)

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

  // Headline = tagline with its last word highlighted (works for both
  // "Ciencia. Formación. Aplicación." and a plain space-separated string).
  const taglineWords = (aboutSection?.hero_tagline ?? 'Ciencia. Formación. Aplicación.')
    .split('.')
    .filter(Boolean)
    .map((w) => w.trim())
    .join(' ')
    .split(/\s+/)
  const tagline = {
    head: taglineWords.slice(0, -1).join(' '),
    last: `${taglineWords[taglineWords.length - 1]}.`,
  }

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage="home" />

      <main id="main">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          {/* One static lime wash behind the brand panel. */}
          <div className="absolute -top-24 -right-24 md:-top-32 md:-right-32 w-72 h-72 md:w-[36rem] md:h-[36rem] rounded-full bg-[#a4c639]/15 pointer-events-none" />

          <div
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20
                       min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)]
                       grid md:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-16 items-center"
          >
            <div>
              <p className="rise flex items-center gap-3 text-[#2d7a5f] text-xs font-bold uppercase tracking-widest mb-6">
                <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
                Educación Científica Aplicada
              </p>

              <h1
                className="rise font-serif font-semibold tracking-[-0.02em] leading-[1.08] text-[#1a5744] mb-6"
                style={{ fontSize: 'clamp(2.2rem, 5.2vw, 4.75rem)', ['--d' as string]: '60ms' }}
              >
                {tagline.head}{' '}
                <span className="underline decoration-[#a4c639] decoration-[0.07em] underline-offset-[0.16em]">
                  {tagline.last}
                </span>
              </h1>

              <p
                className="rise text-[#2d7a5f] text-lg md:text-xl max-w-xl leading-relaxed mb-9"
                style={{ ['--d' as string]: '140ms' }}
              >
                {aboutSection?.hero_subtitle ??
                  'Docencia basada en evidencia e investigación aplicada para transformar la práctica profesional'}
              </p>

              <div
                className="rise flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                style={{ ['--d' as string]: '220ms' }}
              >
                <Link
                  href="/courses"
                  className="inline-flex items-center justify-center gap-2.5 min-h-12 px-8 rounded-xl
                             bg-[#1a5744] text-white font-semibold text-sm
                             hover:bg-[#2d7a5f] active:scale-[0.97]
                             [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
                >
                  Ver Cursos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center min-h-12 px-8 rounded-xl
                             border-2 border-[#1a5744]/30 text-[#1a5744] font-semibold text-sm
                             hover:border-[#1a5744]/60 hover:bg-[#1a5744]/5 active:scale-[0.97]
                             [transition:transform_150ms_var(--ease-out),border-color_300ms_var(--ease-brand),background-color_300ms_var(--ease-brand)]"
                >
                  Crear cuenta gratis
                </Link>
              </div>
            </div>

            {/* Brand panel: logo + the growth/network line-art already used site-wide. */}
            <div className="rise relative hidden md:block" style={{ ['--d' as string]: '180ms' }} aria-hidden="true">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[1.5rem] bg-[#a4c639]" />
              <div className="relative aspect-[4/5] max-h-[34rem] w-full rounded-[1.5rem] bg-[#1a5744] overflow-hidden flex items-center justify-center">
                <BrandMotif variant="network" className="absolute inset-0 w-full h-full text-[#a4c639]/25" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#2d7a5f]/60" />
                <Image
                  src="/logos/Triada-logo-dark-mode.png"
                  alt=""
                  width={360}
                  height={120}
                  priority
                  className="relative w-3/5 h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────────── */}
        <section className="bg-white py-20 md:py-28">
          <FadeIn className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <span className="flex items-center gap-3 text-[#2d7a5f] text-xs font-bold uppercase tracking-widest mb-3">
                <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
                ¿Por qué elegirnos?
              </span>
              <h2
                className="font-serif font-semibold tracking-[-0.02em] text-[#1a5744] leading-[1.1] mb-4"
                style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
              >
                Educación de excelencia.
              </h2>
              <p className="text-base md:text-lg text-[#2d7a5f] leading-relaxed">
                Diseñado para profesionales que buscan rigor científico y aplicación práctica.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:grid-rows-2 lg:min-h-[25rem]">

              {/* A — dark green, 2 cols × 2 rows */}
              <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-[#1a5744] rounded-[1.5rem]
                              relative overflow-hidden p-8 lg:p-10 flex flex-col justify-center gap-6 min-h-[16rem] lg:min-h-0">
                <BrandMotif
                  variant="balance"
                  className="absolute -bottom-10 -right-10 w-72 h-72 text-[#a4c639]/25"
                />
                <div className="relative w-14 h-14 bg-[#a4c639] rounded-xl flex items-center justify-center">
                  {features[0]?.icon_url ? (
                    <div className="relative w-8 h-8">
                      <Image src={features[0].icon_url} alt="" fill className="object-contain" />
                    </div>
                  ) : (
                    <Award className="h-7 w-7 text-[#1a5744]" aria-hidden="true" />
                  )}
                </div>
                <div className="relative">
                  <h3 className="text-2xl md:text-3xl font-semibold text-[#e8e4d0] tracking-tight mb-4 leading-tight">
                    {features[0]?.title ?? 'Certificación Internacional'}
                  </h3>
                  <p className="text-[#e8e4d0]/90 text-base md:text-lg leading-relaxed max-w-[30rem]">
                    {features[0]?.description ??
                      'Programas con reconocimiento internacional para impulsar tu desarrollo profesional.'}
                  </p>
                </div>
              </div>

              {/* B — beige */}
              <div className="sm:col-span-2 lg:col-span-2 bg-[#e8e4d0] rounded-[1.5rem] p-7
                              flex items-center gap-5 min-h-[9.5rem]">
                <div className="w-14 h-14 bg-[#1a5744] rounded-xl flex items-center justify-center shrink-0">
                  {features[1]?.icon_url ? (
                    <div className="relative w-8 h-8">
                      <Image src={features[1].icon_url} alt="" fill className="object-contain" />
                    </div>
                  ) : (
                    <Users className="h-7 w-7 text-[#a4c639]" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1a5744] tracking-tight mb-1 leading-tight">
                    {features[1]?.title ?? 'Comunidad de Expertos'}
                  </h3>
                  <p className="text-[#1a5744] text-base leading-relaxed">
                    {features[1]?.description ?? 'Conéctate con una red de profesionales y expertos del área.'}
                  </p>
                </div>
              </div>

              {/* C — lime (near-black copy: dark green on lime is only 4.3:1) */}
              <div className="sm:col-span-2 lg:col-span-2 bg-[#a4c639] rounded-[1.5rem] p-7
                              flex items-center gap-5 min-h-[9.5rem]">
                <div className="w-14 h-14 bg-[#1a5744] rounded-xl flex items-center justify-center shrink-0">
                  {features[2]?.icon_url ? (
                    <div className="relative w-8 h-8">
                      <Image src={features[2].icon_url} alt="" fill className="object-contain" />
                    </div>
                  ) : (
                    <BookOpen className="h-7 w-7 text-[#a4c639]" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1a5744] tracking-tight mb-1 leading-tight">
                    {features[2]?.title ?? 'Contenido Basado en Evidencia'}
                  </h3>
                  <p className="text-[#1a1a1a] text-base leading-relaxed">
                    {features[2]?.description ??
                      'Todo el contenido está respaldado por la última investigación científica.'}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── ABOUT ────────────────────────────────────────────────────────── */}
        <section id="about" className="on-dark relative bg-[#1a5744] overflow-hidden py-20 md:py-28">
          <div className="absolute -top-40 right-0 w-96 h-[36rem] bg-[#2d7a5f]/40 rounded-full
                          translate-x-1/3 pointer-events-none" />

          {/* Psychology motif - growth/branching, subtle backdrop accent */}
          <BrandMotif
            variant="growth"
            className="absolute -bottom-16 -right-16 w-[26rem] h-[26rem] text-[#a4c639]/[0.09] hidden lg:block"
          />

          <FadeIn className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-12 md:gap-16 items-center">

              <div>
                <span className="flex items-center gap-3 text-[#e8e4d0] text-xs font-bold uppercase tracking-widest mb-4">
                  <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
                  Sobre Triada
                </span>
                <h2
                  className="font-serif font-semibold tracking-[-0.02em] text-[#e8e4d0] mb-6 leading-[1.1]"
                  style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)' }}
                >
                  {aboutSection?.title || 'Sobre Nosotros'}
                </h2>
                <p className="text-[#e8e4d0] text-base md:text-lg leading-relaxed max-w-xl">
                  {aboutSection?.subtitle && (
                    <span className="font-bold text-white">{aboutSection.subtitle} </span>
                  )}
                  {aboutSection?.description ||
                    'es una plataforma educativa dedicada a la excelencia académica.'}
                </p>
                {aboutSection?.description_secondary && (
                  <details className="group mt-4 max-w-xl">
                    <summary className="inline-flex items-center gap-1.5 min-h-11 cursor-pointer list-none text-sm font-semibold text-[#a4c639] hover:text-white transition-colors [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Leer más</span>
                      <span className="hidden group-open:inline">Leer menos</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-(--ease-out) group-open:rotate-90" aria-hidden="true" />
                    </summary>
                    <p className="mt-2 text-[#e8e4d0]/90 text-base leading-relaxed">
                      {aboutSection.description_secondary}
                    </p>
                  </details>
                )}
                <ExpandableAboutCards />
              </div>

              <div className="w-full max-w-sm mx-auto md:max-w-none">
                <div className="relative">
                  <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-[1.5rem] bg-[#a4c639]/60" aria-hidden="true" />
                  <div className="relative rounded-[1.5rem] overflow-hidden aspect-[4/3] flex items-center justify-center bg-[#e8e4d0]">
                    {aboutSection?.image_url ? (
                      <Image
                        src={aboutSection.image_url}
                        alt={aboutSection.title}
                        fill
                        className="object-contain p-8"
                      />
                    ) : (
                      <GraduationCap className="h-28 w-28 text-[#1a5744]" aria-hidden="true" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <ul className="grid sm:grid-cols-3 gap-6 mt-14">
              {[
                { title: 'Docencia', text: 'Programas con rigor clínico y práctica supervisada.' },
                { title: 'Investigación', text: 'Contenido respaldado por evidencia científica.' },
                { title: 'Innovación', text: 'Formación en línea a tu propio ritmo.' },
              ].map((pillar) => (
                <li key={pillar.title} className="border-t-2 border-[#a4c639] pt-4">
                  <h3 className="text-base md:text-lg font-semibold text-[#e8e4d0]">{pillar.title}</h3>
                  <p className="mt-1 text-sm md:text-base text-[#e8e4d0]/90 leading-relaxed">{pillar.text}</p>
                </li>
              ))}
            </ul>
          </FadeIn>
        </section>

        {/* ── FEATURED COURSES ─────────────────────────────────────────────── */}
        <section className="bg-[#e8e4d0] py-20 md:py-28">
          <FadeIn className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4
                            mb-10 pb-6 border-b border-[#1a5744]/15">
              <div>
                <span className="flex items-center gap-3 text-[#1a5744] text-xs font-bold uppercase tracking-widest mb-3">
                  <span className="h-0.5 w-8 bg-[#1a5744]" aria-hidden="true" />
                  Aprende con los mejores
                </span>
                <h2
                  className="font-serif font-semibold tracking-[-0.01em] text-[#1a5744] leading-[1.1]"
                  style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
                >
                  Cursos<br />Destacados.
                </h2>
              </div>
              <Link
                href="/courses"
                className="hidden md:inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-[#1a5744]
                           bg-white border border-[#1a5744]/20 px-5 rounded-xl
                           hover:border-[#1a5744]/40 hover:bg-[#1a5744]/5 active:scale-[0.97]
                           [transition:transform_150ms_var(--ease-out),border-color_300ms_var(--ease-brand),background-color_300ms_var(--ease-brand)]"
              >
                Ver todos los cursos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className={`grid gap-6 ${
              courses.length === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : courses.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {courses.length > 0 ? (
                courses.slice(0, 3).map((course) => (
                  <CourseCard
                    key={course.id}
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
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="w-16 h-16 rounded-3xl bg-[#1a5744]/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-[#1a5744]" aria-hidden="true" />
                  </div>
                  <p className="text-[#1a5744] font-semibold">No hay cursos destacados disponibles</p>
                </div>
              )}
            </div>

            <div className="text-center mt-12 md:hidden">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2.5 min-h-12 px-8 bg-[#1a5744] text-white
                           font-semibold text-sm rounded-xl
                           hover:bg-[#2d7a5f] active:scale-[0.97]
                           [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]"
              >
                Ver todos los cursos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  )
}
