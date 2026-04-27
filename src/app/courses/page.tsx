'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, BookOpen, Sparkles, SlidersHorizontal } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CourseCard from '@/components/CourseCard'
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

      {/* Hero Section */}
      <section className="relative bg-[#2d7a5f] py-16 md:py-24 overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#a4c639]/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#a4c639]/15 rounded-full blur-3xl animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl animate-blob-3" />

        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#a4c639]/20 border border-[#a4c639]/40 text-[#a4c639] text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Formación Profesional Especializada
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight"
          >
            Catálogo de{' '}
            <span className="text-[#a4c639] relative">
              Cursos
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
                className="absolute left-0 -bottom-1 h-1 w-full bg-[#a4c639]/50 rounded-full origin-left block"
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
          >
            Encuentra el curso perfecto para tu desarrollo profesional
          </motion.p>


        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white border-b border-gray-100 py-6 md:py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search bar */}
          <div className="relative max-w-2xl mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2d7a5f]/50 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-[#f5f3e8] border-2 border-transparent rounded-xl text-[#2d7a5f] placeholder-[#2d7a5f]/40 font-medium focus:border-[#a4c639] focus:bg-white focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Pill category filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#2d7a5f]/50 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtrar
            </span>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-200 cursor-pointer ${
                  selectedCategory === category.id
                    ? 'bg-[#a4c639] border-[#a4c639] text-white shadow-md shadow-[#a4c639]/30'
                    : 'bg-white border-gray-200 text-[#2d7a5f] hover:border-[#a4c639] hover:text-[#a4c639]'
                }`}
              >
                {category.name}
              </button>
            ))}

            {/* Results count */}
            <span className="ml-auto text-sm text-gray-400 font-medium">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
            </span>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-8 md:py-12 bg-gradient-to-br from-[#e8e4d0]/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12 md:py-20">
              <div className="inline-block h-10 w-10 md:h-12 md:w-12 animate-spin rounded-full border-4 border-solid border-[#2d7a5f] border-r-transparent"></div>
              <p className="mt-4 text-gray-600 text-sm md:text-base">Cargando cursos...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
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
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No se encontraron cursos
              </h3>
              <p className="text-gray-500">
                Intenta con otros términos de búsqueda o categoría
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
