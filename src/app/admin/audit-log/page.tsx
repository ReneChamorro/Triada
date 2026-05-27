'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Filter } from 'lucide-react'
import { motion } from 'motion/react'

interface AuditEntry {
  id: string
  admin_id: string
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, any>
  created_at: string
  profiles: { full_name: string; email: string } | null
}

const ACTION_LABELS: Record<string, string> = {
  approve_purchase: 'Aprobó compra',
  reject_purchase: 'Rechazó compra',
  grant_access: 'Otorgó acceso',
  change_role: 'Cambió rol',
  delete_course: 'Eliminó curso',
  toggle_publish: 'Cambió publicación',
  delete_account: 'Eliminó cuenta',
}

const ACTION_COLORS: Record<string, string> = {
  approve_purchase: 'bg-[#a4c639]/20 text-[#2d7a5f] font-semibold',
  reject_purchase: 'bg-red-100 text-red-700 font-semibold',
  grant_access: 'bg-[#1a5744] text-white font-semibold',
  change_role: 'bg-[#e8e4d0] text-[#1a5744] font-semibold',
  delete_course: 'bg-red-100 text-red-700 font-semibold',
  toggle_publish: 'bg-[#a4c639]/10 text-[#1a5744] font-semibold',
  delete_account: 'bg-red-100 text-red-700 font-semibold',
}

export default function AuditLogPage() {
  const supabase = createClient()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    loadEntries()
  }, [actionFilter])

  async function loadEntries() {
    setLoading(true)
    let query = supabase
      .from('audit_log')
      .select('*, profiles!audit_log_admin_id_fkey(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (actionFilter) {
      query = query.eq('action', actionFilter)
    }

    const { data } = await query
    setEntries((data as AuditEntry[]) || [])
    setLoading(false)
  }

  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-2">
          Seguridad
        </span>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
            Log de Auditoría
          </h1>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#1a5744]/40" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-sm border border-[#e8e4d0] rounded-xl px-3 py-2
                         bg-white text-[#1a5744] focus:ring-2 focus:ring-[#a4c639]
                         focus:border-transparent outline-none"
            >
              <option value="">Todas las acciones</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1a5744]">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-white/70 uppercase tracking-widest">
                  Fecha
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-white/70 uppercase tracking-widest">
                  Admin
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-white/70 uppercase tracking-widest">
                  Acción
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-white/70 uppercase tracking-widest">
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e4d0]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="w-8 h-8 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin mx-auto" />
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 px-6">
                    <div className="w-14 h-14 bg-[#e8e4d0] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-7 w-7 text-[#1a5744]/30" />
                    </div>
                    <p className="text-[#1a5744]/40 font-semibold text-sm">
                      No hay registros de auditoría
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="hover:bg-[#f5f3e8] transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-[#1a5744]/60 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <div className="font-semibold text-[#1a5744]">
                        {entry.profiles?.full_name || 'Desconocido'}
                      </div>
                      <div className="text-xs text-[#1a5744]/40">
                        {entry.profiles?.email || ''}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                        ACTION_COLORS[entry.action] || 'bg-[#e8e4d0] text-[#1a5744] font-semibold'
                      }`}>
                        {ACTION_LABELS[entry.action] || entry.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#1a5744]/60 max-w-xs">
                      {entry.details && Object.keys(entry.details).length > 0 ? (
                        <div className="space-y-0.5">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <div key={key} className="truncate">
                              <span className="text-[#1a5744]/35">{key}:</span>{' '}
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#1a5744]/25">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
