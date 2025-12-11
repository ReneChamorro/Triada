'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, BookOpen, GraduationCap, ArrowRight } from 'lucide-react'
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

  // Mock courses for demonstration
  const mockCourses = [
    {
      id: 1,
      title: 'Introducción a la Psicología Clínica',
      description: 'Aprende los fundamentos de la psicología clínica con expertos reconocidos internacionalmente',
      price: 99,
      category: 'psychology',
      thumbnail_url: null,
    },
    {
      id: 2,
      title: 'Terapia Cognitivo Conductual Avanzada',
      description: 'Domina las técnicas más efectivas de TCC para casos complejos',
      price: 149,
      category: 'therapy',
      thumbnail_url: null,
    },
    {
      id: 3,
      title: 'Intervención en Crisis y Emergencias',
      description: 'Desarrolla habilidades para actuar efectivamente en situaciones de crisis',
      price: 129,
      category: 'intervention',
      thumbnail_url: null,
    },
    {
      id: 4,
      title: 'Metodología de Investigación en Psicología',
      description: 'Aprende a diseñar y ejecutar investigaciones de calidad en el campo de la psicología',
      price: 119,
      category: 'research',
      thumbnail_url: null,
    },
    {
      id: 5,
      title: 'Psicología Infantil y del Adolescente',
      description: 'Especialízate en el desarrollo y tratamiento de niños y adolescentes',
      price: 139,
      category: 'psychology',
      thumbnail_url: null,
    },
    {
      id: 6,
      title: 'Terapia Familiar Sistémica',
      description: 'Aprende a trabajar con sistemas familiares desde un enfoque sistémico',
      price: 159,
      category: 'therapy',
      thumbnail_url: null,
    },
  ]

  useEffect(() => {
    async function fetchCourses() {
      const supabase = createClient()
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      
      if (data && data.length > 0) {
        setCourses(data)
        setFilteredCourses(data)
      } else {
        setCourses(mockCourses)
        setFilteredCourses(mockCourses)
      }
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
                href="/" 
                className="text-gray-700 hover:text-[#2d7a5f] font-medium transition-colors"
              >
                Inicio
              </Link>
              <Link 
                href="/courses" 
                className="text-[#2d7a5f] font-medium"
              >
                Cursos
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
      <section className="bg-gradient-to-br from-[#1a5744] to-[#2d7a5f] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Catálogo de Cursos
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
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
      <footer className="bg-[#1a5744] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-[#a4c639]" />
                <span className="text-xl font-bold">TRIADA</span>
              </div>
              <p className="text-[#e8e4d0] text-sm">
                Global, Docencia e Investigación. Transformando profesionales a través de la educación.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#a4c639]">Cursos</h4>
              <ul className="space-y-2 text-sm text-[#e8e4d0]">
                <li><Link href="/courses" className="hover:text-white transition-colors">Ver Todos</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">Programas</Link></li>
                <li><Link href="/courses" className="hover:text-white transition-colors">Certificaciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#a4c639]">Empresa</h4>
              <ul className="space-y-2 text-sm text-[#e8e4d0]">
                <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#a4c639]">Legal</h4>
              <ul className="space-y-2 text-sm text-[#e8e4d0]">
                <li><Link href="#" className="hover:text-white transition-colors">Términos</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacidad</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#2d7a5f] pt-8 text-center text-sm text-[#e8e4d0]">
            <p>&copy; 2025 Triada Global. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
