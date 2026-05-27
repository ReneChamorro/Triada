'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Eye, X, ImageIcon, DollarSign } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { motion } from 'motion/react'

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
  profiles: { full_name: string; email: string }
  courses: { title: string }
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

  useEffect(() => { loadPurchases() }, [])

  useEffect(() => {
    let filtered = allPurchases
    if (filter !== 'all') filtered = filtered.filter(p => p.status === filter)
    if (methodFilter !== 'all') filtered = filtered.filter(p => p.payment_method === methodFilter)
    setPurchases(filtered)
  }, [filter, methodFilter, allPurchases])

  async function loadPurchases() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`*, profiles:user_id(full_name, email), courses:course_id(title)`)
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
        .createSignedUrl(purchase.receipt_image_url, 300)

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
      const { error: rpcError } = await supabase.rpc('approve_purchase', { purchase_id: purchase.id })

      if (rpcError) {
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

      if (purchase.receipt_image_url) {
        try {
          await supabase.storage.from('payment-receipts').remove([purchase.receipt_image_url])
          await supabase.from('purchases').update({ receipt_image_url: null }).eq('id', purchase.id)
        } catch {
          // Non-blocking
        }
      }

      try {
        const emailRes = await fetch('/api/admin/send-email', {
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
        if (!emailRes.ok) {
          alert(`⚠️ Compra aprobada, pero el email no pudo enviarse a ${purchase.profiles.email}. Notifica al estudiante manualmente.`)
        }
      } catch {
        alert(`⚠️ Compra aprobada, pero el email no pudo enviarse a ${purchase.profiles.email}. Notifica al estudiante manualmente.`)
      }

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
    if (!reason.trim()) { alert('Debes ingresar una razón de rechazo'); return }

    setProcessing(purchase.id)
    try {
      const { error: rpcError } = await supabase.rpc('reject_purchase', {
        purchase_id: purchase.id,
        rejection_reason: reason
      })

      if (rpcError) {
        const { error: updateErr } = await supabase
          .from('purchases')
          .update({ status: 'rejected', admin_notes: reason, reviewed_at: new Date().toISOString() })
          .eq('id', purchase.id)

        if (updateErr) throw updateErr
      }

      if (purchase.receipt_image_url) {
        try {
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          await supabase.from('purchases').update({ receipt_expires_at: expiresAt }).eq('id', purchase.id)
        } catch {
          // Non-blocking
        }
      }

      try {
        const emailRes = await fetch('/api/admin/send-email', {
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
        if (!emailRes.ok) {
          alert(`⚠️ Compra rechazada, pero el email no pudo enviarse a ${purchase.profiles.email}. Notifica al estudiante manualmente.`)
        }
      } catch {
        alert(`⚠️ Compra rechazada, pero el email no pudo enviarse a ${purchase.profiles.email}. Notifica al estudiante manualmente.`)
      }

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin" />
      </div>
    )
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
          Finanzas
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
          Gestión de Pagos
        </h1>
        <p className="text-[#1a5744]/50 mt-1 text-sm">Revisa y aprueba compras manuales</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Pendientes',
            value: stats.pending,
            icon: Clock,
            card: 'bg-[#e8e4d0]',
            iconBg: 'bg-[#1a5744]',
            iconColor: 'text-[#a4c639]',
            textColor: 'text-[#1a5744]',
            delay: 0,
          },
          {
            label: 'Aprobadas',
            value: stats.approved,
            icon: CheckCircle,
            card: 'bg-[#a4c639]',
            iconBg: 'bg-[#1a5744]/15',
            iconColor: 'text-[#1a5744]',
            textColor: 'text-[#1a5744]',
            delay: 0.07,
          },
          {
            label: 'Rechazadas',
            value: stats.rejected,
            icon: XCircle,
            card: 'bg-[#1a5744]',
            iconBg: 'bg-white/10',
            iconColor: 'text-white/70',
            textColor: 'text-white',
            delay: 0.14,
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: s.delay }}
            className={`${s.card} rounded-[1.5rem] p-6 flex items-center gap-5`}
          >
            <div className={`w-14 h-14 ${s.iconBg} rounded-[18px] flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`h-7 w-7 ${s.iconColor}`} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${s.textColor} opacity-60 mb-1`}>
                {s.label}
              </p>
              <p className={`text-4xl font-black tracking-tighter leading-none ${s.textColor}`}>
                {s.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        className="bg-white rounded-[1.25rem] border border-[#e8e4d0] p-3 sm:p-4 mb-6
                   flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest mr-1">Estado</span>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f
                  ? 'bg-[#1a5744] text-white'
                  : 'bg-[#e8e4d0] text-[#1a5744]/60 hover:text-[#1a5744]'
              }`}
            >
              {f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : f === 'rejected' ? 'Rechazadas' : 'Todas'}
            </button>
          ))}
        </div>
        {uniqueMethods.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1a5744]/50 uppercase tracking-widest">Método</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#e8e4d0] rounded-xl text-sm text-[#1a5744]
                         bg-white focus:ring-2 focus:ring-[#a4c639] focus:border-transparent outline-none"
            >
              <option value="all">Todos</option>
              {uniqueMethods.map(m => (
                <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>
              ))}
            </select>
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        className="bg-white rounded-[1.5rem] border border-[#e8e4d0] overflow-hidden"
      >
        {purchases.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-[#e8e4d0] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="h-7 w-7 text-[#1a5744]/30" />
            </div>
            <p className="text-[#1a5744]/40 font-semibold text-sm">No hay compras que mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a5744]">
                  {['Usuario', 'Curso', 'Monto', 'Método', 'Referencia', 'Comprobante', 'Estado', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-white/70 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e4d0]">
                {purchases.map((purchase, i) => (
                  <motion.tr
                    key={purchase.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="hover:bg-[#f5f3e8] transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#1a5744]">{purchase.profiles.full_name}</div>
                      <div className="text-xs text-[#1a5744]/40">{purchase.profiles.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-[#1a5744]/70 max-w-xs truncate">{purchase.courses.title}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#1a5744]">{formatPrice(purchase.amount, purchase.currency)}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[#e8e4d0] text-[#1a5744]">
                        {METHOD_LABELS[purchase.payment_method] || purchase.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono bg-[#e8e4d0] text-[#1a5744] px-2 py-1 rounded-lg">
                        {purchase.payment_id}
                      </code>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {purchase.receipt_image_url ? (
                        <button
                          onClick={() => viewReceipt(purchase)}
                          className="flex items-center gap-1 text-sm text-[#2d7a5f] hover:text-[#1a5744] font-semibold transition-colors"
                        >
                          <ImageIcon className="h-4 w-4" /> Ver
                        </button>
                      ) : (
                        <span className="text-xs text-[#1a5744]/25">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        purchase.status === 'pending'
                          ? 'bg-[#e8e4d0] text-[#1a5744]'
                          : purchase.status === 'approved'
                          ? 'bg-[#a4c639]/20 text-[#2d7a5f]'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {purchase.status === 'pending' ? 'Pendiente'
                          : purchase.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-[#1a5744]/45">
                      {new Date(purchase.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      {purchase.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approvePurchase(purchase)}
                            disabled={processing === purchase.id}
                            className="bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-3 py-1.5 rounded-lg
                                       text-xs font-bold disabled:opacity-50 transition-colors"
                          >
                            {processing === purchase.id ? '…' : 'Aprobar'}
                          </button>
                          <button
                            onClick={() => rejectPurchase(purchase)}
                            disabled={processing === purchase.id}
                            className="bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 rounded-lg
                                       text-xs font-bold disabled:opacity-50 transition-colors"
                          >
                            {processing === purchase.id ? '…' : 'Rechazar'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#1a5744]/30 text-xs">
                          {purchase.admin_notes && <span title={purchase.admin_notes}>📝 </span>}
                          {purchase.status === 'approved' ? 'Procesada' : 'Cerrada'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Receipt Modal */}
      {receiptModal && receiptUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => { setReceiptModal(null); setReceiptUrl(null) }}
        >
          <div
            className="bg-white rounded-[1.5rem] shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[#e8e4d0]">
              <h3 className="font-black text-[#1a5744] tracking-tight">Comprobante de Pago</h3>
              <button
                onClick={() => { setReceiptModal(null); setReceiptUrl(null) }}
                className="text-[#1a5744]/40 hover:text-[#1a5744] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <img src={receiptUrl} alt="Comprobante" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
