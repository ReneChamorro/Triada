'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, ChevronRight, GraduationCap, LayoutDashboard, LogOut, Settings, BookOpen } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { createClient } from '@/lib/supabase/client'

interface DashboardHeaderProps {
  profile: any
}

export default function DashboardHeader({ profile }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close drawer on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleLogout = async () => {
    setMobileMenuOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Mi Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: '/courses', label: 'Explorar Cursos', icon: <BookOpen className="h-4 w-4" /> },
  ]

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl shadow-md shadow-black/5 border-b border-gray-100/80'
            : 'bg-white/98'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                <Image
                  src="/logos/Triada-logo-mono-green.png"
                  alt="Triada Logo"
                  width={180}
                  height={60}
                  priority
                  className="h-10 md:h-12 w-auto"
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-[#2d7a5f]'
                        : 'text-gray-600 hover:text-[#2d7a5f] hover:bg-[#2d7a5f]/5'
                    }`}
                  >
                    {icon}
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="dash-nav-underline"
                        className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-[#a4c639]"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-1.5">
              {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#2d7a5f] hover:bg-[#2d7a5f]/5 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/dashboard/settings'
                    ? 'text-[#2d7a5f] bg-[#2d7a5f]/5'
                    : 'text-gray-600 hover:text-[#2d7a5f] hover:bg-[#2d7a5f]/5'
                }`}
                title="Configuración"
              >
                <Settings className="h-4 w-4" />
                Configuración
              </Link>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
              type="button"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#a4c639] flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-bold text-[#2d7a5f] text-sm">TRIADA</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-1">
                {navLinks.map(({ href, label, icon }, i) => {
                  const isActive = pathname === href
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.05 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all ${
                          isActive
                            ? 'bg-[#2d7a5f]/10 text-[#2d7a5f]'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-[#2d7a5f]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {icon}
                          {label}
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`} />
                      </Link>
                    </motion.div>
                  )
                })}

                <div className="my-4 border-t border-gray-100" />

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 }}
                  className="space-y-1"
                >
                  {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#2d7a5f] font-medium transition-all"
                    >
                      <Settings className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      pathname === '/dashboard/settings'
                        ? 'bg-[#2d7a5f]/10 text-[#2d7a5f]'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#2d7a5f]'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
