'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Eye, DollarSign, User, BookOpen } from 'lucide-react'
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
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
  courses: {
    title: string
  }
}

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPurchases()
  }, [filter])

  async function loadPurchases() {
    setLoading(true)
    try {
      let query = supabase
        .from('purchases')
        .select(`
          *,
          profiles:user_id(full_name, email),
          courses:course_id(title)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error loading purchases:', error)
      alert('Error al cargar las compras')
    } finally {
      setLoading(false)
    }
  }

  async function approvePurchase(purchaseId: string) {
    if (!confirm('¿Aprobar esta compra y dar acceso al curso?')) return

    setProcessing(purchaseId)
    try {
      const { error } = await supabase.rpc('approve_purchase', {
        purchase_id: purchaseId
      })

      if (error) throw error

      alert('✅ Compra aprobada y acceso otorgado')
      loadPurchases()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al aprobar la compra: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  async function rejectPurchase(purchaseId: string) {
    const reason = prompt('Razón del rechazo (opcional):')
    if (reason === null) return // User cancelled

    setProcessing(purchaseId)
    try {
      const { error } = await supabase.rpc('reject_purchase', {
        purchase_id: purchaseId,
        rejection_reason: reason || null
      })

      if (error) throw error

      alert('❌ Compra rechazada')
      loadPurchases()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al rechazar la compra: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  const stats = {
    pending: purchases.filter(p => p.status === 'pending').length,
    approved: purchases.filter(p => p.status === 'approved').length,
    rejected: purchases.filter(p => p.status === 'rejected').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a4c639]"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a5744] mb-2">
          Gestión de Pagos
        </h1>
        <p className="text-gray-600">
          Revisa y aprueba compras con Zelle u otros métodos manuales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
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
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Aprobadas
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Rechazadas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-12 text-center">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No hay compras {filter !== 'all' ? filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas' : ''} en este momento
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.profiles.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.profiles.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {purchase.courses.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(purchase.amount, purchase.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {purchase.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {purchase.payment_id}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {purchase.status === 'pending' && (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pendiente
                        </span>
                      )}
                      {purchase.status === 'approved' && (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          Aprobada
                        </span>
                      )}
                      {purchase.status === 'rejected' && (
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                          Rechazada
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {purchase.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => approvePurchase(purchase.id)}
                            disabled={processing === purchase.id}
                            className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processing === purchase.id ? '...' : 'Aprobar'}
                          </button>
                          <button
                            onClick={() => rejectPurchase(purchase.id)}
                            disabled={processing === purchase.id}
                            className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {processing === purchase.id ? '...' : 'Rechazar'}
                          </button>
                        </div>
                      )}
                      {purchase.status !== 'pending' && (
                        <span className="text-gray-400 text-xs">
                          {purchase.status === 'approved' ? 'Procesada' : 'Cerrada'}
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
    </div>
  )
}
