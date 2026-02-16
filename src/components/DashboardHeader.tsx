'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  profile: any
}

export default function DashboardHeader({ profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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
          <Link href="/" className="flex items-center">
            <Image 
              src="/logos/Triada-logo-mono-green.png" 
              alt="Triada Logo" 
              width={180} 
              height={60}
              priority
              className="h-12 w-auto"
            />
          </Link>

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
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-gray-700 hover:bg-red-50 hover:text-red-600 font-medium transition-all border border-gray-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
