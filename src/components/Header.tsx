'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <>
      <nav className={`bg-white sticky top-0 z-50 shadow-sm transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link href="/" className="flex items-center">
              <Image 
                src="/logos/Triada-logo-mono-green.png" 
                alt="Triada Logo" 
                width={180} 
                height={60}
                priority
                className="h-10 md:h-12 w-auto"
              />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors z-50 relative"
              aria-label="Toggle menu"
              type="button"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Desktop Menu */}
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 right-0 left-0 bg-white shadow-lg border-t border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-6 space-y-3">
              <Link 
                href="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                  currentPage === 'home' 
                    ? 'bg-[#2d7a5f]/10 text-[#2d7a5f]' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Inicio
              </Link>
              <Link 
                href="/courses" 
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-medium transition-all ${
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
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-all"
                      >
                        Mi Dashboard
                      </Link>
                      {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                        <Link 
                          href="/admin" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-all"
                        >
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 font-medium transition-all border border-red-200"
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/register" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-all border border-gray-200 text-center"
                      >
                        Registrarse
                      </Link>
                      <Link 
                        href="/login" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-lg bg-[#a4c639] text-white hover:bg-[#2d7a5f] font-medium transition-all shadow-sm text-center"
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
      )}
    </>
  )
}
