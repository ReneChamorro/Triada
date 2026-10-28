'use client'

import { useState, useEffect } from 'react'
import { Search, BookOpen, SlidersHorizontal } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CourseCard from '@/components/CourseCard'
import BrandMotif from '@/components/BrandMotif'
import { createClient } from '@/lib/supabase/client'

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  const categories = [
    { id: 'all', name: 'Todos los Cursos' },
    { id: 'psychology', name: 'Psicología' },
    { id: 'therapy', name: 'Terapia' },
    { id: 'intervention', name: 'Intervención' },
    { id: 'research', name: 'Investigación' },
  ]

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient()

      // Fetch courses
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      setCourses(data || [])
      setFilteredCourses(data || [])
      setLoading(false)
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCourses(filtered)
  }, [searchTerm, selectedCategory, courses])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header currentPage="courses" />

      <main id="main">
        {/* Hero Section */}
        <section className="on-dark relative bg-[#1a5744] py-16 md:py-28 overflow-hidden">
          <div className="absolute -top-24 -right-20 w-96 h-72 bg-[#2d7a5f]/50 rounded-full pointer-events-none" />

          {/* Psychology motif - interconnection, subtle backdrop accent */}
          <BrandMotif
            variant="network"
            className="absolute -bottom-12 -left-12 w-72 h-72 text-[#a4c639]/[0.08] hidden lg:block"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[#e8e4d0] text-xs font-bold uppercase tracking-widest mb-6">
              Formación Profesional Especializada
            </p>

            <h1
              className="font-serif font-semibold tracking-[-0.01em] text-[#e8e4d0] mb-4 leading-[1.05]"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 4.5rem)' }}
            >
              Catálogo de <span className="text-[#a4c639]">Cursos</span>
            </h1>

            <p className="text-lg md:text-xl text-[#e8e4d0]/90 max-w-2xl mx-auto">
              Encuentra el curso perfecto para tu desarrollo profesional
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section aria-label="Buscar y filtrar cursos" className="bg-white border-b border-[#e8e4d0] py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search bar */}
            <div className="relative max-w-2xl mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2d7a5f] h-5 w-5" aria-hidden="true" />
              <input
                type="search"
                aria-label="Buscar cursos"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 min-h-12 bg-[#f5f3e8] border border-[#2d7a5f] rounded-xl text-[#1a5744] placeholder-[#1a5744]/70 font-medium focus:bg-white focus:border-[#1a5744] transition-colors duration-200 ease-(--ease-brand)"
              />
            </div>

            {/* Pill category filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#2d7a5f] mr-1">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Filtrar
              </span>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 min-h-11 rounded-full text-sm font-semibold border cursor-pointer active:scale-[0.96] [transition:transform_150ms_var(--ease-out),background-color_200ms,border-color_200ms,color_200ms] ${
                    selectedCategory === category.id
                      ? 'bg-[#1a5744] border-[#1a5744] text-white'
                      : 'bg-white border-[#1a5744]/30 text-[#1a5744]/85 hover:border-[#1a5744]/60 hover:text-[#1a5744]'
                  }`}
                >
                  {category.name}
                </button>
              ))}

              {/* Results count */}
              <span role="status" className="ml-auto text-sm text-[#2d7a5f] font-medium">
                {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
              </span>
            </div>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="py-10 md:py-14 bg-[#f5f3e8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div role="status" className="text-center py-12 md:py-20">
                <div className="inline-block h-10 w-10 md:h-12 md:w-12 animate-spin rounded-full border-4 border-solid border-[#1a5744] border-r-transparent" aria-hidden="true"></div>
                <p className="mt-4 text-[#1a5744] text-sm md:text-base">Cargando cursos...</p>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 min-[1920px]:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                {filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description || ''}
                    short_description={course.short_description}
                    price={course.price}
                    currency={course.currency}
                    thumbnail_url={course.image_url}
                    Icon={BookOpen}
                    category={course.category}
                    duration_minutes={course.duration_minutes}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-3xl bg-[#1a5744]/10 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-[#1a5744]" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-[#1a5744] mb-2">
                  No se encontraron cursos
                </h3>
                <p className="text-[#2d7a5f]">
                  Intenta con otros términos de búsqueda o categoría
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
