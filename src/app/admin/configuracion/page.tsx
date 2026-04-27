'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, CheckCircle, XCircle, Video, Mail, Database } from 'lucide-react'

interface ConfigStatus {
  muxConfigured: boolean
  supabaseConfigured: boolean
  emailConfigured: boolean
  appUrl: string | null
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ConfigStatus | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    checkAccess()
  }, [])

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'teacher'].includes(profile.role)) {
        router.push('/')
        return
      }

      // Fetch config status from API
      const res = await fetch('/api/admin/config-status')
      if (res.ok) {
        setConfig(await res.json())
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    )
  }

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <XCircle className="w-5 h-5 text-red-500" />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744] flex items-center gap-3">
          <Settings className="w-8 h-8" />
          Configuración
        </h1>
        <p className="text-gray-600 mt-2">
          Estado de las integraciones y variables de entorno de la aplicación.
        </p>
      </div>

      <div className="space-y-4">
        {/* Mux */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Video className="w-6 h-6 text-[#1a5744]" />
              <div>
                <h2 className="font-semibold text-gray-900">Mux Video</h2>
                <p className="text-sm text-gray-500">
                  Streaming y subida de videos ({config?.muxConfigured ? 'MUX_TOKEN_ID y MUX_TOKEN_SECRET configurados' : 'Variables de entorno faltantes'})
                </p>
              </div>
            </div>
            <StatusIcon ok={config?.muxConfigured ?? false} />
          </div>
          {!config?.muxConfigured && (
            <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-700">
              Agrega <code className="font-mono bg-red-100 px-1 rounded">MUX_TOKEN_ID</code> y{' '}
              <code className="font-mono bg-red-100 px-1 rounded">MUX_TOKEN_SECRET</code> en las
              variables de entorno de Vercel para habilitar la subida de videos.
            </div>
          )}
        </div>

        {/* Supabase */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-[#1a5744]" />
              <div>
                <h2 className="font-semibold text-gray-900">Supabase</h2>
                <p className="text-sm text-gray-500">
                  Base de datos y autenticación
                </p>
              </div>
            </div>
            <StatusIcon ok={config?.supabaseConfigured ?? false} />
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-[#1a5744]" />
              <div>
                <h2 className="font-semibold text-gray-900">Email (Resend)</h2>
                <p className="text-sm text-gray-500">
                  Envío de correos transaccionales
                </p>
              </div>
            </div>
            <StatusIcon ok={config?.emailConfigured ?? false} />
          </div>
          {!config?.emailConfigured && (
            <div className="mt-4 p-3 bg-yellow-50 rounded text-sm text-yellow-700">
              Agrega <code className="font-mono bg-yellow-100 px-1 rounded">RESEND_API_KEY</code> en
              las variables de entorno para habilitar el envío de emails.
            </div>
          )}
        </div>

        {/* App URL */}
        {config?.appUrl && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#1a5744]" />
              <div>
                <h2 className="font-semibold text-gray-900">URL de la aplicación</h2>
                <p className="text-sm text-gray-500 font-mono">{config.appUrl}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Para cambiar las variables de entorno, accede al panel de Vercel → tu proyecto → Settings → Environment Variables.
      </p>
    </div>
  )
}
