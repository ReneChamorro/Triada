'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const INACTIVITY_LIMIT = 30 * 60 * 1000   // 30 minutes
const WARNING_BEFORE = 2 * 60 * 1000       // Show warning 2 min before

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login?reason=timeout'
  }, [])

  const resetTimers = useCallback(() => {
    setShowWarning(false)

    if (warningRef.current) clearTimeout(warningRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    warningRef.current = setTimeout(() => {
      setShowWarning(true)
    }, INACTIVITY_LIMIT - WARNING_BEFORE)

    timeoutRef.current = setTimeout(() => {
      signOut()
    }, INACTIVITY_LIMIT)
  }, [signOut])

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))
    resetTimers()

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers))
      if (warningRef.current) clearTimeout(warningRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [resetTimers])

  const dismissWarning = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  return { showWarning, dismissWarning }
}
