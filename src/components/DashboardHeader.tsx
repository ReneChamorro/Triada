'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Menu, X } from 'lucide-react'

interface DashboardHeaderProps {
  profile: any
}

export default function DashboardHeader({ profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  // Close on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    // Use setTimeout to avoid the toggle click itself from closing the menu
    const id = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsVisible(false)
        } else {
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
    setMobileMenuOpen(false)
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

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-md bg-[#2d7a5f]/10 text-[#2d7a5f] font-medium transition-all"
            >
              Mi Dashboard
            </Link>
            <Link 
              href="/courses" 
              className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-all"
            >
              Explorar Cursos
            </Link>
            {(profile?.role === 'admin' || profile?.role === 'teacher') && (
              <Link 
                href="/admin" 
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition-all"
              >
                Admin
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-all"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium transition-all border border-gray-200"
            >
              Cerrar sesión
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            <Link 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-md bg-[#2d7a5f]/10 text-[#2d7a5f] font-medium"
            >
              Mi Dashboard
            </Link>
            <Link 
              href="/courses" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
            >
              Explorar Cursos
            </Link>
            {(profile?.role === 'admin' || profile?.role === 'teacher') && (
              <Link 
                href="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
              >
                Admin
              </Link>
            )}
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-md text-gray-700 hover:bg-gray-100 font-medium"
            >
              <Settings className="h-5 w-5" />
              Configuración
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-md text-red-600 hover:bg-red-50 font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
