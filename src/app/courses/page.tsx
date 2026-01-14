'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, BookOpen, ArrowRight } from 'lucide-react'
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
      <section className="bg-[#e8e4d0] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1a5744] mb-4">
            Catálogo de Cursos
          </h1>
          <p className="text-xl text-[#1a5744]/80 max-w-2xl mx-auto">
            Encuentra el curso perfecto para tu desarrollo profesional
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white border-b py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#2d7a5f] focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-64 pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#2d7a5f] focus:outline-none appearance-none bg-white cursor-pointer"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-12 bg-gradient-to-br from-[#e8e4d0]/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#2d7a5f] border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Cargando cursos...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <Link 
                  key={course.id} 
                  href={`/courses/${course.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  {course.image_url ? (
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={course.image_url} 
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
