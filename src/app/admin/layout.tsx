'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Users, Settings, LogOut, DollarSign, Shield, Menu, X } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Cursos', href: '/admin/courses', icon: BookOpen },
    { name: 'Pagos', href: '/admin/purchases', icon: DollarSign },
    { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
    { name: 'Auditoría', href: '/admin/audit-log', icon: Shield },
    { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
  ]

  // Close sidebar on Escape key
  useEffect(() => {
    if (!sidebarOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [sidebarOpen])

  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Missing Supabase env vars')
      }
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      console.error('[Admin] Logout error:', err instanceof Error ? err.message : err)
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f3e8]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1a5744] z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 flex flex-col`}>

        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #a4c639 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Logo */}
        <div className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-white/8">
          <Link href="/admin" className="flex items-center">
            <Image
              src="/logos/Triada-logo-dark-mode.png"
              alt="Triada Admin"
              width={160}
              height={60}
              className="h-9 lg:h-10 w-auto"
            />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Label */}
        <div className="relative z-10 px-6 pt-5 pb-2">
          <span className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest opacity-60">
            Navegación
          </span>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 px-3 pb-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-[#a4c639] text-[#1a5744] shadow-sm'
                    : 'text-white/65 hover:bg-white/8 hover:text-white'
                }`}
              >
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-[#1a5744]' : ''}`} />
                <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-[#1a5744]' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="relative z-10 px-3 py-4 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl
                       text-white/50 hover:bg-white/8 hover:text-white transition-all"
          >
            {loggingOut ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/50 border-r-transparent animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="text-sm font-bold tracking-tight">
              {loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#e8e4d0] sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#1a5744]/60 hover:bg-[#e8e4d0] hover:text-[#1a5744] transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base font-black tracking-tight text-[#1a5744]">
              {navigation.find(item => item.href === pathname)?.name || 'Panel de Administración'}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

