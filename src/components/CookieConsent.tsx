'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700">
            Utilizamos cookies esenciales para el funcionamiento del sitio y la autenticación de usuarios. 
            No utilizamos cookies de seguimiento ni publicidad.{' '}
            <Link href="/privacidad" className="text-[#2d7a5f] underline hover:text-[#1a5744]">
              Más información
            </Link>
          </p>
        </div>
        <button
          onClick={accept}
          className="shrink-0 bg-[#a4c639] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2d7a5f] transition-colors text-sm"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
