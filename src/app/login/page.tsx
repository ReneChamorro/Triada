'use client'
import { logger } from '@/lib/logger'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GraduationCap, BookOpen, Award, Loader2, Eye, EyeOff } from 'lucide-react'

function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Correo o contrasena incorrectos. Por favor verifica tus datos.',
    'Email not confirmed': 'Por favor verifica tu correo electronico antes de iniciar sesion.',
    'User not found': 'Correo o contrasena incorrectos. Por favor verifica tus datos.',
    'Invalid email': 'El formato del correo electronico no es valido.',
    'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
  }
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value
  }
  return 'Ocurrio un error. Por favor intenta nuevamente.'
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect')
  const redirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    })
    if (error) setError(getAuthErrorMessage(error.message))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(getAuthErrorMessage(error.message)); setLoading(false); return }
      if (!authData.user) { setError('Error al iniciar sesion'); setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single()
      logger.log('Login - User role:', profile?.role)
      if (profile?.role === 'admin' || profile?.role === 'teacher') {
        window.location.href = '/admin'
      } else {
        window.location.href = redirect
      }
    } catch (err) {
      logger.error('Login error:', err)
      setError('Error al iniciar sesion')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a5744] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute -top-16 right-0 w-96 h-72 bg-[#2d7a5f]/55 rounded-full translate-x-1/3 pointer-events-none" />

        <div className="relative z-10">
          <Link href="/">
            <Image src="/logos/Triada-logo-dark-mode.png" alt="Triada" width={180} height={60} className="h-12 w-auto" />
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="flex items-center gap-3 text-[#e8e4d0] text-xs font-bold uppercase tracking-widest mb-4">
              <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
              Plataforma Educativa
            </p>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Bienvenido<br/>de nuevo
            </h2>
            <p className="mt-3 text-white/90 text-lg">Continua donde lo dejaste y sigue creciendo profesionalmente.</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: <BookOpen className="h-5 w-5 text-[#a4c639]" />, text: 'Accede a todos tus cursos' },
              { icon: <Award className="h-5 w-5 text-[#a4c639]" />, text: 'Sigue tu progreso' },
              { icon: <GraduationCap className="h-5 w-5 text-[#a4c639]" />, text: 'Obtén certificaciones' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/90 text-sm">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">{item.icon}</div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/80 text-xs">© 2026 Triada Global. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/"><Image src="/logos/Triada-logo-mono-green.png" alt="Triada" width={180} height={60} className="h-12 w-auto mx-auto" /></Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#2d7a5f] mb-2">Iniciar sesion</h1>
            <p className="text-gray-500">Ingresa tus datos para continuar</p>
          </div>

          {/* Google */}
          <button type="button" onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[#a4c639] hover:bg-[#a4c639]/5 transition-all mb-6">
            <GoogleIcon />Continuar con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-500">O con correo</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Correo Electronico</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f3e8] border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#a4c639] focus:bg-white focus:outline-none transition-all"
                placeholder="tu@email.com" />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">Contrasena</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#f5f3e8] border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#a4c639] focus:bg-white focus:outline-none transition-all"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600 transition-colors" tabIndex={-1} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1a5744] hover:bg-[#2d7a5f] text-white py-3.5 rounded-xl font-bold text-base hover:shadow-[#2d7a5f]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Ingresando...' : 'Iniciar sesion'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href={`/register${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`} className="font-semibold text-[#2d7a5f] hover:text-[#1a5744] transition-colors">
              Registrate gratis
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-600 transition-colors">← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#2d7a5f]" />}>
      <LoginForm />
    </Suspense>
  )
}
