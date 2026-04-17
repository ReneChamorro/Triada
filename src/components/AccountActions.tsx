'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface AccountActionsProps {
  userEmail: string
}

export default function AccountActions({ userEmail }: AccountActionsProps) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      const res = await fetch('/api/account/export')
      if (!res.ok) {
        throw new Error('Error al exportar datos')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `triada-datos-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setError('No se pudieron exportar los datos. Intenta de nuevo.')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== 'ELIMINAR') return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'ELIMINAR' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar cuenta')
      }
      router.push('/login?reason=deleted')
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar la cuenta. Intenta de nuevo.')
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Export Data */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-[#1a5744] mb-2">Exportar Mis Datos</h2>
        <p className="text-sm text-gray-600 mb-4">
          Descarga una copia de todos tus datos personales almacenados en la plataforma: 
          perfil, cursos, progreso y compras.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-[#2d7a5f] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#1a5744] transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? 'Exportando...' : 'Descargar mis datos'}
        </button>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-red-100">
        <h2 className="text-xl font-bold text-red-600 mb-2">Eliminar Cuenta</h2>
        <p className="text-sm text-gray-600 mb-4">
          Esta acción es irreversible. Se eliminarán permanentemente todos tus datos: 
          perfil, cursos, progreso, compras y comprobantes de pago.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar mi cuenta
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Estás seguro?</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
              No podrás recuperar tu cuenta ni tus cursos comprados.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escribe <span className="font-bold text-red-600">ELIMINAR</span> para confirmar:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              placeholder="ELIMINAR"
              autoComplete="off"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmation !== 'ELIMINAR' || deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? 'Eliminando...' : 'Eliminar cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
