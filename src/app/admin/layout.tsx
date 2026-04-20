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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1a5744] text-white z-50 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo + close button */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link href="/admin" className="flex items-center">
              <Image 
                src="/logos/Triada-logo-dark-mode.png" 
                alt="Triada Admin" 
                width={160} 
                height={60}
                className="h-10 lg:h-12 w-auto"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded text-white/80 hover:text-white"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#a4c639] text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              {loggingOut ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white/80" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              <span className="font-medium">{loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800">
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
