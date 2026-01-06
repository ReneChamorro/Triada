'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  currentPage?: 'home' | 'courses'
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // Scrolling down
          setIsVisible(false)
        } else {
          // Scrolling up
          setIsVisible(true)
        }
        setLastScrollY(window.scrollY)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar)
      return () => {
        window.removeEventListener('scroll', controlNavbar)
      }
    }
  }, [lastScrollY])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className={`bg-white sticky top-0 z-50 shadow-sm transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-3">
            <GraduationCap className="h-10 w-10 text-[#2d7a5f]" />
            <div>
              <span className="text-2xl font-bold text-[#1a5744] block">TRIADA</span>
              <span className="text-xs text-gray-600">Global, Docencia e Investigación</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                currentPage === 'home' 
                  ? 'bg-[#2d7a5f]/10 text-[#2d7a5f]' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Inicio
            </Link>
            <Link 
              href="/courses" 
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                currentPage === 'courses' 
                  ? 'bg-[#2d7a5f]/10 text-[#2d7a5f]' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cursos
            </Link>
            
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link 
                      href="/dashboard" 
                      className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-all"
                    >
                      Mi Dashboard
                    </Link>
                    {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                      <Link 
                        href="/admin" 
                        className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-all"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium transition-all border border-gray-200"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/register" 
                      className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-all border border-gray-200"
                    >
                      Registrarse
                    </Link>
                    <Link 
                      href="/login" 
                      className="px-6 py-2 rounded-md bg-[#a4c639] text-white hover:bg-[#2d7a5f] font-medium transition-all shadow-sm"
                    >
                      Iniciar Sesión
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
