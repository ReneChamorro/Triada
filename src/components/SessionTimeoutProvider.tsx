'use client'

import { useSessionTimeout } from '@/lib/useSessionTimeout'

export default function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const { showWarning, dismissWarning } = useSessionTimeout()

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sesión por expirar</h3>
            <p className="text-gray-600 text-sm mb-4">
              Tu sesión expirará en 2 minutos por inactividad.
            </p>
            <button
              onClick={dismissWarning}
              className="w-full bg-[#a4c639] text-white py-2.5 rounded-lg font-semibold hover:bg-[#8ba832] transition-colors"
            >
              Continuar sesión
            </button>
          </div>
        </div>
      )}
    </>
  )
}
