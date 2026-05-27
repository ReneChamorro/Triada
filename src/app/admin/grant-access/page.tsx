'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'

export default function GrantAccessPage() {
  const router = useRouter()
  const supabase = createClient()

  const [users, setUsers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    userId: '',
    courseId: '',
    paymentMethod: 'zelle',
    amountPaid: '',
    paymentId: '',
    adminNote: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') { router.push('/admin'); return }

      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')

      if (usersData) setUsers(usersData)

      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, price')
        .order('title')

      if (coursesData) setCourses(coursesData)
    } catch (error) {
      logger.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.userId || !formData.courseId) {
      alert('Selecciona un usuario y un curso')
      return
    }

    setProcessing(true)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.userId,
          courseId: formData.courseId,
          paymentMethod: formData.paymentMethod,
          amountPaid: parseFloat(formData.amountPaid) || 0,
          paymentId: formData.paymentId || `manual_${Date.now()}`,
          adminNote: formData.adminNote
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setFormData({ userId: '', courseId: '', paymentMethod: 'zelle', amountPaid: '', paymentId: '', adminNote: '' })
        alert('✅ Acceso otorgado correctamente')
      } else {
        alert(data.error || 'Error al otorgar acceso')
      }
    } catch (error) {
      logger.error('Error:', error)
      alert('Error al procesar la solicitud')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#a4c639] border-r-transparent animate-spin" />
      </div>
    )
  }

  const inputCls = `w-full px-4 py-2.5 border border-[#e8e4d0] rounded-xl bg-white
                    text-[#1a5744] text-sm focus:ring-2 focus:ring-[#a4c639]
                    focus:border-transparent outline-none transition-all`

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <span className="text-[#a4c639] text-xs font-bold uppercase tracking-widest block mb-2">
          Acceso Manual
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-[#1a5744]">
          Otorgar Acceso
        </h1>
        <p className="text-[#1a5744]/50 mt-1 text-sm">
          Usa esta herramienta cuando un pago haya sido recibido pero el acceso no se otorgó automáticamente.
        </p>
      </motion.div>

      {/* Warning notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="flex items-start gap-3 bg-[#e8e4d0] border border-[#1a5744]/15 rounded-[1.25rem] p-4 mb-6"
      >
        <AlertTriangle className="w-4 h-4 text-[#1a5744]/60 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#1a5744]/70">
          <strong className="text-[#1a5744]">Importante:</strong> Solo usa esta función para pagos ya verificados.
          Verifica primero que el pago haya sido recibido antes de otorgar acceso.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6 sm:p-8 space-y-6"
      >
        {/* User */}
        <div>
          <label className="block text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-2">
            Usuario *
          </label>
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Selecciona un usuario</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Course */}
        <div>
          <label className="block text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-2">
            Curso *
          </label>
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Selecciona un curso</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} (${course.price})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-2">
              Método de Pago
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className={inputCls}
            >
              <option value="zelle">Zelle</option>
              <option value="pago_movil">Pago Móvil</option>
              <option value="transferencia_usd">Transferencia USD</option>
              <option value="paypal_manual">PayPal</option>
              <option value="manual">Manual/Otro</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-2">
              Monto Pagado ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
              className={inputCls}
              placeholder="10.00"
            />
          </div>
        </div>

        {/* Payment ID */}
        <div>
          <label className="block text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-2">
            ID de Transacción
          </label>
          <input
            type="text"
            value={formData.paymentId}
            onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
            className={inputCls}
            placeholder="Referencia de Zelle, Pago Móvil, Transferencia, etc."
          />
          <p className="text-xs text-[#1a5744]/40 mt-1">
            Número de referencia o identificador del pago
          </p>
        </div>

        {/* Admin Note */}
        <div>
          <label className="block text-xs font-bold text-[#1a5744] uppercase tracking-widest mb-2">
            Nota Administrativa (Opcional)
          </label>
          <textarea
            rows={3}
            value={formData.adminNote}
            onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })}
            className={`${inputCls} resize-none`}
            placeholder="Razón del acceso manual, detalles adicionales, etc."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin"
            className="px-6 py-2.5 rounded-xl border border-[#e8e4d0] text-[#1a5744]/60
                       hover:bg-[#f5f3e8] hover:text-[#1a5744] text-sm font-semibold transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={processing || !formData.userId || !formData.courseId}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#a4c639] text-white rounded-xl
                       text-sm font-bold hover:bg-[#2d7a5f] disabled:opacity-50
                       disabled:cursor-not-allowed transition-all"
          >
            {processing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Procesando...</span></>
            ) : success ? (
              <><CheckCircle className="w-4 h-4" /><span>Otorgado</span></>
            ) : (
              <><UserPlus className="w-4 h-4" /><span>Otorgar Acceso</span></>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
