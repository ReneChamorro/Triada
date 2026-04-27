'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Download, Trash2, AlertTriangle, Loader2, Lock, Eye, EyeOff, Check, Mail } from 'lucide-react'
import { passwordSchema } from '@/lib/validations'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AccountActionsProps {
  userEmail: string
  hasPasswordAuth: boolean
}

export default function AccountActions({ userEmail, hasPasswordAuth }: AccountActionsProps) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [sendingResetLink, setSendingResetLink] = useState(false)
  const [resetLinkSent, setResetLinkSent] = useState(false)

  const handleSendPasswordSetupLink = async () => {
    setSendingResetLink(true)
    setPasswordError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard/settings`,
      })
      if (error) throw error
      setResetLinkSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el correo'
      setPasswordError(message)
    } finally {
      setSendingResetLink(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    const pwValidation = passwordSchema.safeParse(newPassword)
    if (!pwValidation.success) {
      setPasswordError(pwValidation.error.issues[0]?.message || 'Contraseña inválida')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return
    }
    if (!currentPassword) {
      setPasswordError('Ingresa tu contraseña actual')
      return
    }

    setChangingPassword(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      })
      if (signInError) {
        setPasswordError('La contraseña actual es incorrecta')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setPasswordError(updateError.message)
        return
      }
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cambiar la contraseña'
      setPasswordError(message)
    } finally {
      setChangingPassword(false)
    }
  }

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar la cuenta. Intenta de nuevo.'
      setError(message)
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
        <h2 className="text-xl font-bold text-[#1a5744] mb-2">
          {hasPasswordAuth ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
        </h2>

        {!hasPasswordAuth ? (
          /* Google OAuth user — no inline form, send reset link instead */
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Tu cuenta está vinculada a Google. Para establecer una contraseña y poder
              iniciar sesión también con tu correo, te enviaremos un enlace seguro a{' '}
              <span className="font-semibold text-gray-800">{userEmail}</span>.
            </p>
            {resetLinkSent ? (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <Check className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">¡Correo enviado!</p>
                  <p className="mt-0.5 text-green-600">
                    Revisa tu bandeja de entrada en <span className="font-medium">{userEmail}</span> y sigue
                    las instrucciones para establecer tu contraseña.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSendPasswordSetupLink}
                disabled={sendingResetLink}
                className="flex items-center gap-2 bg-[#2d7a5f] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#1a5744] transition-colors disabled:opacity-50"
              >
                {sendingResetLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {sendingResetLink ? 'Enviando...' : 'Enviar enlace al correo'}
              </button>
            )}
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          </div>
        ) : (
          /* Email+password user — inline form */
          <>
            <p className="text-sm text-gray-600 mb-4">
              Actualiza tu contraseña de acceso. Debe tener al menos 6 caracteres.
            </p>
            <div className="space-y-3 max-w-sm">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
                    placeholder="Contraseña actual"
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
                    placeholder="Nueva contraseña"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); setPasswordSuccess(false) }}
                    placeholder="Confirmar nueva contraseña"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#a4c639] focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  Contraseña actualizada correctamente
                </div>
              )}
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 bg-[#2d7a5f] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#1a5744] transition-colors disabled:opacity-50"
              >
                {changingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {changingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </>
        )}
      </div>

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
