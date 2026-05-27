'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, CheckCircle, XCircle, Video, Mail, Database } from 'lucide-react'
import { motion } from 'motion/react'

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin" />
      </div>
    )
  }

  const items = [
    {
      icon: Video,
      title: 'Mux Video',
      desc: config?.muxConfigured
        ? 'MUX_TOKEN_ID y MUX_TOKEN_SECRET configurados'
        : 'Variables de entorno faltantes',
      ok: config?.muxConfigured ?? false,
      warning: !config?.muxConfigured
        ? 'Agrega MUX_TOKEN_ID y MUX_TOKEN_SECRET en las variables de entorno de Vercel para habilitar la subida de videos.'
        : null,
    },
    {
      icon: Database,
      title: 'Supabase',
      desc: 'Base de datos y autenticación',
      ok: config?.supabaseConfigured ?? false,
      warning: null,
    },
    {
      icon: Mail,
      title: 'Email (Resend)',
      desc: 'Envío de correos transaccionales',
      ok: config?.emailConfigured ?? false,
      warning: !config?.emailConfigured
        ? 'Agrega RESEND_API_KEY en las variables de entorno para habilitar el envío de emails.'
        : null,
    },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-2">
          Sistema
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
          Configuración
        </h1>
        <p className="text-[#1a5744]/50 mt-1 text-sm">
          Estado de las integraciones y variables de entorno.
        </p>
      </motion.div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 + i * 0.07 }}
            className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[#e8e4d0] rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-[#1a5744]" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1a5744] text-sm">{item.title}</h2>
                  <p className="text-xs text-[#1a5744]/50 mt-0.5">{item.desc}</p>
                </div>
              </div>
              {item.ok
                ? <CheckCircle className="w-5 h-5 text-[#a4c639] flex-shrink-0" />
                : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              }
            </div>
            {item.warning && (
              <div className="mt-4 px-4 py-3 bg-[#e8e4d0] rounded-xl text-sm text-[#1a5744]/70">
                {item.warning}
              </div>
            )}
          </motion.div>
        ))}

        {config?.appUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.29 }}
            className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#e8e4d0] rounded-xl flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5 text-[#1a5744]" />
              </div>
              <div>
                <h2 className="font-bold text-[#1a5744] text-sm">URL de la aplicación</h2>
                <p className="text-xs text-[#1a5744]/50 font-mono mt-0.5">{config.appUrl}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <p className="text-xs text-[#1a5744]/30 mt-8 text-center">
        Para cambiar las variables de entorno, accede al panel de Vercel → tu proyecto → Settings → Environment Variables.
      </p>
    </div>
  )
}
