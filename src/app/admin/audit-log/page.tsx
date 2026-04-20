'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield, Filter } from 'lucide-react'

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
  approve_purchase: 'bg-green-100 text-green-800',
  reject_purchase: 'bg-red-100 text-red-800',
  grant_access: 'bg-blue-100 text-blue-800',
  change_role: 'bg-purple-100 text-purple-800',
  delete_course: 'bg-red-100 text-red-800',
  toggle_publish: 'bg-yellow-100 text-yellow-800',
  delete_account: 'bg-red-100 text-red-800',
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-[#1a5744]" />
          <h1 className="text-2xl font-bold text-gray-800">Log de Auditoría</h1>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
          >
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Acción</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-500">Cargando...</td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-500">
                  No hay registros de auditoría
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {entry.profiles?.full_name || 'Desconocido'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.profiles?.email || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                    {entry.details && Object.keys(entry.details).length > 0 ? (
                      <div className="space-y-0.5">
                        {Object.entries(entry.details).map(([key, value]) => (
                          <div key={key} className="truncate">
                            <span className="text-gray-400">{key}:</span>{' '}
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}
