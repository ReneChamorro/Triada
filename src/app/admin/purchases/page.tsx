'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Eye, X, ImageIcon } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Purchase {
  id: string
  user_id: string
  course_id: string
  amount: number
  currency: string
  payment_method: string
  payment_id: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  receipt_image_url: string | null
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
  courses: {
    title: string
  }
}

const METHOD_LABELS: Record<string, string> = {
  zelle: 'Zelle',
  pago_movil: 'Pago Móvil',
  transferencia_usd: 'Transferencia USD',
  paypal_manual: 'PayPal',
  paypal: 'PayPal (auto)',
  stripe: 'Stripe',
  trial: 'Trial',
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [allPurchases, setAllPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPurchases()
  }, [])

  useEffect(() => {
    let filtered = allPurchases
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter)
    }
    if (methodFilter !== 'all') {
      filtered = filtered.filter(p => p.payment_method === methodFilter)
    }
    setPurchases(filtered)
  }, [filter, methodFilter, allPurchases])

  async function loadPurchases() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          profiles:user_id(full_name, email),
          courses:course_id(title)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllPurchases(data || [])
    } catch (error) {
      logger.error('Error loading purchases:', error)
      alert('Error al cargar las compras')
    } finally {
      setLoading(false)
    }
  }

  async function viewReceipt(purchase: Purchase) {
    if (!purchase.receipt_image_url) return

    try {
      const { data } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(purchase.receipt_image_url, 300) // 5 min

      if (data?.signedUrl) {
        setReceiptUrl(data.signedUrl)
        setReceiptModal(purchase.id)
      } else {
        alert('No se pudo cargar el comprobante')
      }
    } catch {
      alert('Error al cargar el comprobante')
    }
  }

  async function approvePurchase(purchase: Purchase) {
    if (!confirm('¿Aprobar esta compra y dar acceso al curso?')) return

    setProcessing(purchase.id)
    try {
      // Use RPC if available, otherwise manual
      const { error: rpcError } = await supabase.rpc('approve_purchase', {
        purchase_id: purchase.id
      })

      if (rpcError) {
        // Fallback: update purchase + grant access manually
        const { error: updateErr } = await supabase
          .from('purchases')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', purchase.id)

        if (updateErr) throw updateErr

        const { error: enrollErr } = await supabase
          .from('user_courses')
          .insert({
            user_id: purchase.user_id,
            course_id: purchase.course_id,
            payment_method: purchase.payment_method,
            amount_paid: purchase.amount,
            payment_id: purchase.payment_id,
            progress_percentage: 0,
            is_completed: false,
          })

        if (enrollErr && !enrollErr.message.includes('duplicate')) throw enrollErr
      }

      // Delete receipt from storage after approval
      if (purchase.receipt_image_url) {
        try {
          await supabase.storage.from('payment-receipts').remove([purchase.receipt_image_url])
          await supabase.from('purchases').update({ receipt_image_url: null }).eq('id', purchase.id)
        } catch {
          // Non-blocking: receipt cleanup failure shouldn't block approval
        }
      }

      // Send approval email via API
      try {
        await fetch('/api/admin/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'approval',
            purchaseId: purchase.id,
            email: purchase.profiles.email,
            studentName: purchase.profiles.full_name,
            courseName: purchase.courses.title,
            courseId: purchase.course_id,
          }),
        })
      } catch {
        // Email failure shouldn't block the approval
      }

      // Log admin action
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('audit_log').insert({
            admin_id: user.id,
            action: 'approve_purchase',
            target_type: 'purchase',
            target_id: purchase.id,
            details: { student: purchase.profiles.email, course: purchase.courses.title, amount: purchase.amount },
          })
        }
      } catch {
        // Non-blocking
      }

      alert('✅ Compra aprobada y acceso otorgado')
      loadPurchases()
    } catch (error: any) {
      logger.error('Error:', error)
      alert('Error al aprobar la compra: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  async function rejectPurchase(purchase: Purchase) {
    const reason = prompt('Razón del rechazo (requerido):')
    if (reason === null) return
    if (!reason.trim()) {
      alert('Debes ingresar una razón de rechazo')
      return
    }

    setProcessing(purchase.id)
    try {
      const { error: rpcError } = await supabase.rpc('reject_purchase', {
        purchase_id: purchase.id,
        rejection_reason: reason
      })

      if (rpcError) {
        // Fallback
        const { error: updateErr } = await supabase
          .from('purchases')
          .update({
            status: 'rejected',
            admin_notes: reason,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', purchase.id)

        if (updateErr) throw updateErr
      }

      // Schedule receipt deletion (7 days from now)
      if (purchase.receipt_image_url) {
        try {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from('purchases').update({ receipt_expires_at: expiresAt }).eq('id', purchase.id)
        } catch {
          // Non-blocking
        }
      }

      // Send rejection email
      try {
        await fetch('/api/admin/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rejection',
            purchaseId: purchase.id,
            email: purchase.profiles.email,
            studentName: purchase.profiles.full_name,
            courseName: purchase.courses.title,
            reason,
          }),
        })
      } catch {
        // Email failure shouldn't block the rejection
      }

      // Log admin action
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('audit_log').insert({
            admin_id: user.id,
            action: 'reject_purchase',
            target_type: 'purchase',
            target_id: purchase.id,
            details: { student: purchase.profiles.email, course: purchase.courses.title, reason },
          })
        }
      } catch {
        // Non-blocking
      }

      alert('❌ Compra rechazada')
      loadPurchases()
    } catch (error: any) {
      logger.error('Error:', error)
      alert('Error al rechazar la compra: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const stats = {
    pending: allPurchases.filter(p => p.status === 'pending').length,
    approved: allPurchases.filter(p => p.status === 'approved').length,
    rejected: allPurchases.filter(p => p.status === 'rejected').length,
  }

  const uniqueMethods = [...new Set(allPurchases.map(p => p.payment_method))]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a5744] mb-2">Gestión de Pagos</h1>
        <p className="text-gray-600">Revisa y aprueba compras manuales</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Aprobadas</p>
              <p className="text-3xl font-bold text-green-800">{stats.approved}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Rechazadas</p>
              <p className="text-3xl font-bold text-red-800">{stats.rejected}</p>
            </div>
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Estado:</span>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? f === 'pending' ? 'bg-yellow-100 text-yellow-800'
                    : f === 'approved' ? 'bg-green-100 text-green-800'
                    : f === 'rejected' ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : f === 'rejected' ? 'Rechazadas' : 'Todas'}
            </button>
          ))}
        </div>
        {uniqueMethods.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Método:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Todos</option>
              {uniqueMethods.map(m => (
                <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-12 text-center">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hay compras que mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comprobante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{purchase.profiles.full_name}</div>
                      <div className="text-sm text-gray-500">{purchase.profiles.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{purchase.courses.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(purchase.amount, purchase.currency)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {METHOD_LABELS[purchase.payment_method] || purchase.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{purchase.payment_id}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {purchase.receipt_image_url ? (
                        <button
                          onClick={() => viewReceipt(purchase)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <ImageIcon className="h-4 w-4" /> Ver
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800'
                          : purchase.status === 'approved' ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {purchase.status === 'pending' ? 'Pendiente' : purchase.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {purchase.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approvePurchase(purchase)}
                            disabled={processing === purchase.id}
                            className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded-md font-medium disabled:opacity-50 transition-colors"
                          >
                            {processing === purchase.id ? '...' : 'Aprobar'}
                          </button>
                          <button
                            onClick={() => rejectPurchase(purchase)}
                            disabled={processing === purchase.id}
                            className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded-md font-medium disabled:opacity-50 transition-colors"
                          >
                            {processing === purchase.id ? '...' : 'Rechazar'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {purchase.admin_notes && <span title={purchase.admin_notes}>📝</span>}
                          {' '}{purchase.status === 'approved' ? 'Procesada' : 'Cerrada'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {receiptModal && receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setReceiptModal(null); setReceiptUrl(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg text-gray-900">Comprobante de Pago</h3>
              <button onClick={() => { setReceiptModal(null); setReceiptUrl(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img src={receiptUrl} alt="Comprobante" className="w-full rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
