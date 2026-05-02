'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, formatZodErrors } from '@/lib/validations'
import { GraduationCap, BookOpen, Award, Loader2, Eye, EyeOff } from 'lucide-react'

function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'User already registered': 'Este correo ya esta registrado. Quieres iniciar sesion?',
    'Invalid email': 'El formato del correo electronico no es valido.',
    'Password should be at least 6 characters': 'La contrasena debe tener al menos 6 caracteres.',
    'Email rate limit exceeded': 'Demasiados intentos. Por favor intenta mas tarde.',
    'Signup requires a valid password': 'Por favor ingresa una contrasena valida.',
  }
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value
  }
  return 'Ocurrio un error al crear tu cuenta. Por favor intenta nuevamente.'
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect')
  const redirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/dashboard'

  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '', lastname: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleGoogleSignUp = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    })
    if (error) setError(getAuthErrorMessage(error.message))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const parsed = registerSchema.safeParse(formData)
    if (!parsed.success) { setError(formatZodErrors(parsed.error)); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { name: formData.name, lastname: formData.lastname },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(getAuthErrorMessage(error.message))
      setLoading(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && formData.phone) {
        await supabase.from('profiles').update({ phone: formData.phone }).eq('id', user.id)
      }
      router.push(redirect)
      router.refresh()
    }
  }

  const inputClass = "w-full px-4 py-3 bg-[#f5f3e8] border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#a4c639] focus:bg-white focus:outline-none transition-all"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5"

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#2d7a5f] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#a4c639]/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1a5744]/40 rounded-full blur-3xl animate-blob-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#a4c639]/10 rounded-full blur-2xl animate-blob-3" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10">
          <Link href="/"><Image src="/logos/Triada-logo-mono-green.png" alt="Triada" width={180} height={60} className="h-12 w-auto brightness-0 invert" /></Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#a4c639]/20 border border-[#a4c639]/40 text-[#a4c639] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <GraduationCap className="h-3.5 w-3.5" />Formacion Profesional
            </div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">Unete a<br/>Triada</h2>
            <p className="mt-3 text-white/60 text-lg">Accede a contenido educativo de alta calidad.</p>
          </div>
          <div className="space-y-4">
            {[
              { icon: <BookOpen className="h-5 w-5 text-[#a4c639]" />, text: 'Cursos especializados' },
              { icon: <Award className="h-5 w-5 text-[#a4c639]" />, text: 'Certificaciones reconocidas' },
              { icon: <GraduationCap className="h-5 w-5 text-[#a4c639]" />, text: 'Instructores expertos' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">{item.icon}</div>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">© 2026 Triada Global. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden text-center mb-8">
            <Link href="/"><Image src="/logos/Triada-logo-mono-green.png" alt="Triada" width={180} height={60} className="h-12 w-auto mx-auto" /></Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#2d7a5f] mb-2">Crear cuenta</h1>
            <p className="text-gray-500">Comienza tu viaje de aprendizaje</p>
          </div>

          <button type="button" onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-[#a4c639] hover:bg-[#a4c639]/5 transition-all mb-6">
            <GoogleIcon />Continuar con Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">O con correo</span></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className={labelClass}>Nombre</label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="lastname" className={labelClass}>Apellido</label>
                <input id="lastname" name="lastname" type="text" required value={formData.lastname} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Correo Electronico</label>
              <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="tu@email.com" />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>Telefono (opcional)</label>
              <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+1234567890" />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Contrasena</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.password} onChange={handleChange} className={`${inputClass} pr-12`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Minimo 12 caracteres, una mayuscula, un numero y un simbolo</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirmar Contrasena</label>
              <div className="relative">
                <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} className={`${inputClass} pr-12`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1} aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#a4c639] hover:bg-[#2d7a5f] text-white py-3.5 rounded-xl font-bold text-base shadow-md shadow-[#a4c639]/30 hover:shadow-[#2d7a5f]/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Ya tienes cuenta?{' '}
            <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${redirect}` : ''}`} className="font-semibold text-[#2d7a5f] hover:text-[#a4c639] transition-colors">
              Iniciar sesion
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#2d7a5f]" />}>
      <RegisterForm />
    </Suspense>
  )
}
