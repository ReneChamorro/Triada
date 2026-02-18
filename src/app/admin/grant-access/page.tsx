'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, UserPlus, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    paymentMethod: 'paypal',
    amountPaid: '',
    paymentId: '',
    adminNote: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/admin')
        return
      }

      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name')

      if (usersData) setUsers(usersData)

      // Load courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, price')
        .order('title')

      if (coursesData) setCourses(coursesData)
    } catch (error) {
      console.error('Error loading data:', error)
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
        setFormData({
          userId: '',
          courseId: '',
          paymentMethod: 'paypal',
          amountPaid: '',
          paymentId: '',
          adminNote: ''
        })
        alert('✅ Acceso otorgado correctamente')
      } else {
        alert(data.error || 'Error al otorgar acceso')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la solicitud')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#a4c639]" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center text-[#2d7a5f] hover:text-[#1a5744] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-[#1a5744]">Otorgar Acceso Manual</h1>
        <p className="text-gray-600 mt-2">
          Usa esta herramienta cuando un pago haya sido recibido pero el acceso no se otorgó automáticamente.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Importante:</strong> Solo usa esta función para pagos ya verificados. 
          Verifica primero en PayPal/Zelle que el pago haya sido recibido.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">
            Usuario *
          </label>
          <select
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
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

        {/* Course Selection */}
        <div>
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">
            Curso *
          </label>
          <select
            value={formData.courseId}
            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
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
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Método de Pago
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            >
              <option value="paypal">PayPal</option>
              <option value="zelle">Zelle</option>
              <option value="manual">Manual/Otro</option>
            </select>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-[#1a5744] mb-2">
              Monto Pagado ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
              placeholder="10.00"
            />
          </div>
        </div>

        {/* Payment ID */}
        <div>
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">
            ID de Transacción
          </label>
          <input
            type="text"
            value={formData.paymentId}
            onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            placeholder="PayPal Transaction ID, Zelle Reference, etc."
          />
          <p className="text-xs text-gray-500 mt-1">
            ID de PayPal, referencia de Zelle, o cualquier identificador del pago
          </p>
        </div>

        {/* Admin Note */}
        <div>
          <label className="block text-sm font-semibold text-[#1a5744] mb-2">
            Nota Administrativa (Opcional)
          </label>
          <textarea
            rows={3}
            value={formData.adminNote}
            onChange={(e) => setFormData({ ...formData, adminNote: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
            placeholder="Razón del acceso manual, detalles adicionales, etc."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/admin"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={processing || !formData.userId || !formData.courseId}
            className="flex items-center space-x-2 px-6 py-2 bg-[#a4c639] text-white rounded-lg hover:bg-[#2d7a5f] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Procesando...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Otorgado</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Otorgar Acceso</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
