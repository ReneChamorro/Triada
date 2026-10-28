'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Menu, X, ChevronRight, LayoutDashboard, LogOut, Settings, BookOpen, Home, Info, Mail } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  currentPage?: 'home' | 'courses'
}

// Drawer curve (iOS-like, from Ionic): fast start, soft landing.
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1]

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const reduce = useReducedMotion()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const drawerCloseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profileData) setProfile(profileData)
      }
      setLoading(false)
    }
    loadUser()
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Drawer: lock page scroll, close on Escape, move focus in and hand it back.
  useEffect(() => {
    if (!mobileMenuOpen) return
    const button = menuButtonRef.current
    document.body.style.overflow = 'hidden'
    drawerCloseRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
      button?.focus()
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks: { href: string; label: string; page?: 'home' | 'courses'; Icon: typeof Home }[] = [
    { href: '/', label: 'Inicio', page: 'home', Icon: Home },
    { href: '/#about', label: 'Sobre nosotros', Icon: Info },
    { href: '/courses', label: 'Cursos', page: 'courses', Icon: BookOpen },
    { href: 'mailto:info@triadaglobal.com', label: 'Contacto', Icon: Mail },
  ]

  const textLink =
    'flex items-center gap-1.5 px-4 min-h-11 rounded-lg text-sm font-medium text-[#1a5744] hover:bg-[#1a5744]/10 transition-colors'

  return (
    <>
      <a href="#main" className="skip-link">Saltar al contenido</a>

      <header
        className={`sticky top-0 z-50 bg-white md:bg-[#e8e4d0] border-b transition-[border-color] duration-300 ${
          scrolled ? 'border-[#1a5744]/20' : 'border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            <Link href="/" className="flex items-center shrink-0" aria-label="Triada, inicio">
              <Image
                src="/logos/Triada-logo-mono-green.png"
                alt=""
                width={180}
                height={60}
                priority
                className="h-10 md:h-12 w-auto"
              />
            </Link>

            <nav aria-label="Principal" className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, page }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={page && currentPage === page ? 'page' : undefined}
                  className={`relative px-4 min-h-11 inline-flex items-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                    page && currentPage === page
                      ? 'text-[#1a5744] font-semibold'
                      : 'text-[#1a5744]/85 hover:text-[#1a5744] hover:bg-[#1a5744]/10'
                  }`}
                >
                  {label}
                  {page && currentPage === page && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-[#1a5744]"
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              {!loading && (
                user ? (
                  <div className="flex items-center gap-1.5">
                    <Link href="/dashboard" className={textLink}>
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      Mi Dashboard
                    </Link>
                    {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                      <Link href="/admin" className={textLink}>
                        <Settings className="h-4 w-4" aria-hidden="true" />
                        Admin
                      </Link>
                    )}
                    <div className="w-px h-5 bg-[#1a5744]/25 mx-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-4 min-h-11 rounded-lg text-sm font-medium text-[#1a5744] hover:text-red-700 hover:bg-red-50 border border-[#1a5744]/30 hover:border-red-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Salir
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="inline-flex items-center px-4 min-h-11 rounded-lg text-sm font-semibold text-[#1a5744] hover:bg-[#1a5744]/10 active:scale-[0.97] [transition:transform_150ms_var(--ease-out),background-color_200ms]"
                    >
                      Iniciar Sesion
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center px-5 min-h-11 rounded-lg text-sm font-semibold bg-[#1a5744] text-white hover:bg-[#2d7a5f] active:scale-[0.97] [transition:transform_150ms_var(--ease-out),background-color_200ms]"
                    >
                      Registrarse
                    </Link>
                  </div>
                )
              )}
            </div>

            <button
              ref={menuButtonRef}
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-xl text-[#1a5744] hover:bg-[#1a5744]/10 transition-colors"
              aria-label="Abrir menú"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer"
              type="button"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.aside
              key="drawer"
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menú"
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: 0.25, ease: EASE_DRAWER }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-50 w-[min(18rem,85vw)] bg-white shadow-2xl overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            >
              <div className="flex items-center justify-between pl-6 pr-3 h-16 border-b border-gray-100">
                <Image
                  src="/logos/Triada-logo-mono-green.png"
                  alt="Triada"
                  width={180}
                  height={60}
                  className="h-9 w-auto"
                />
                <button
                  ref={drawerCloseRef}
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-11 w-11 inline-flex items-center justify-center rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  aria-label="Cerrar menú"
                  type="button"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Principal" className="p-5 space-y-1">
                {navLinks.map(({ href, label, page, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={page && currentPage === page ? 'page' : undefined}
                    className={`flex items-center justify-between px-4 min-h-12 rounded-xl font-medium transition-colors ${
                      page && currentPage === page
                        ? 'bg-[#e8e4d0] text-[#1a5744]'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[#2d7a5f]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {label}
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 ${page && currentPage === page ? 'opacity-100' : 'opacity-40'}`}
                      aria-hidden="true"
                    />
                  </Link>
                ))}

                <div className="my-4 border-t border-gray-100" />

                {!loading && (
                  user ? (
                    <div className="space-y-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 min-h-12 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#2d7a5f] font-medium transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                        Mi Dashboard
                      </Link>
                      {(profile?.role === 'admin' || profile?.role === 'teacher') && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 min-h-12 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#2d7a5f] font-medium transition-colors"
                        >
                          <Settings className="h-4 w-4" aria-hidden="true" />
                          Admin
                        </Link>
                      )}
                      <button
                        onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                        className="w-full flex items-center gap-3 px-4 min-h-12 rounded-xl text-red-700 hover:bg-red-50 font-medium transition-colors"
                        type="button"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Cerrar sesion
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center min-h-12 rounded-xl bg-[#1a5744] text-white font-semibold hover:bg-[#2d7a5f] transition-colors"
                      >
                        Registrarse
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center min-h-12 rounded-xl border border-[#1a5744]/30 font-medium text-[#1a5744] hover:bg-[#1a5744]/5 transition-colors"
                      >
                        Iniciar Sesion
                      </Link>
                    </div>
                  )
                )}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
