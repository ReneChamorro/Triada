'use client'
import { logger } from '@/lib/logger'

import React, { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { BookOpen, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface CourseCardProps {
  id: string | number
  title: string
  description: string
  price: number
  currency?: string
  thumbnail_url?: string | null
  Icon?: React.ComponentType<{ className?: string }>
  category?: string | null
  short_description?: string | null
  duration_minutes?: number | null
}

const primaryBtn =
  'w-full bg-[#1a5744] text-white hover:bg-[#2d7a5f] active:scale-[0.98] px-6 min-h-12 flex items-center justify-center rounded-xl font-semibold text-center [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]'

export default function CourseCard({
  id: courseId,
  title,
  description,
  price,
  currency = 'USD',
  thumbnail_url,
  Icon,
  category,
  short_description,
  duration_minutes,
}: CourseCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()
  const titleId = useId()

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        // authError here is expected when the user has no session — don't throw
        if (!authError) {
          setUser(currentUser)
          if (currentUser) {
            const { data: userCourse } = await supabase
              .from('user_courses')
              .select('id')
              .eq('user_id', currentUser.id)
              .eq('course_id', courseId)
              .maybeSingle()
            setHasAccess(!!userCourse)
          }
        }
      } catch (error) {
        logger.error('Auth check failed:', error)
        setUser(null)
        setHasAccess(false)
      } finally {
        setAuthChecked(true)
      }
    }
    if (isOpen) checkAuth()
  }, [isOpen, courseId])

  // Modal: lock page scroll, close on Escape, move focus in and hand it back.
  useEffect(() => {
    if (isOpen) {
      const card = cardRef.current
      document.body.style.overflow = 'hidden'
      closeRef.current?.focus()
      function onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') setIsOpen(false)
      }
      window.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = 'auto'
        window.removeEventListener('keydown', onKeyDown)
        card?.focus()
      }
    }
  }, [isOpen])

  useOutsideClick(ref, () => setIsOpen(false))

  const fmtPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)

  return (
    <>
      {/* Card */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`Ver detalles de ${title}`}
        className="group bg-white rounded-[1.5rem] overflow-hidden border border-[#e8e4d0] cursor-pointer active:scale-[0.99] [transition:transform_200ms_var(--ease-out),box-shadow_200ms_var(--ease-out),border-color_200ms_var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:border-[#a4c639] [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_16px_32px_-14px_rgba(26,87,68,0.28)]"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
      >
        {thumbnail_url ? (
          <div className="aspect-video relative overflow-hidden bg-white">
            <img
              src={thumbnail_url}
              alt=""
              loading="lazy"
              className="w-full h-full object-contain p-8"
            />
          </div>
        ) : (
          <div className="aspect-video bg-[#1a5744] flex items-center justify-center relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#2d7a5f] rounded-full opacity-60 pointer-events-none" />
            {Icon ? <Icon className="h-14 w-14 text-[#a4c639] relative z-10" /> : <BookOpen className="h-14 w-14 text-[#a4c639] relative z-10" />}
          </div>
        )}
        <div className="p-4 md:p-6">
          <h3 className="font-serif text-lg md:text-xl font-semibold text-[#1a5744] mb-1.5 line-clamp-2">
            {title}
          </h3>
          {category && (
            <span className="inline-block text-xs font-semibold text-[#1a5744] bg-[#a4c639]/20 px-2.5 py-0.5 rounded-full mb-2 capitalize">
              {category}
            </span>
          )}
          <p className="text-sm md:text-base text-[#1a5744]/85 mb-3 md:mb-4 line-clamp-2">
            {short_description || description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl md:text-2xl font-bold text-[#1a5744]">
              {fmtPrice}
            </span>
            <span className="text-[#2d7a5f] font-semibold text-sm flex items-center gap-1">
              Ver más
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-0 grid place-items-center z-[100] p-4">
              <motion.div
                ref={ref}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                initial={{ opacity: 0, scale: 0.95, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: reduce ? 0 : 12 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="w-full max-w-2xl max-h-[90dvh] flex flex-col bg-white rounded-[1.5rem] overflow-hidden shadow-2xl"
              >
                {/* Image Header */}
                <div className="relative">
                  {thumbnail_url ? (
                    <div className="bg-white p-8 flex items-center justify-center border-b border-[#e8e4d0]">
                      <img src={thumbnail_url} alt="" className="h-32 md:h-40 object-contain" />
                    </div>
                  ) : (
                    <div className="h-40 bg-[#1a5744] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-[#2d7a5f] rounded-full opacity-60 pointer-events-none" />
                      {Icon ? <Icon className="h-14 w-14 text-[#a4c639] relative z-10" /> : <BookOpen className="h-14 w-14 text-[#a4c639] relative z-10" />}
                    </div>
                  )}
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Cerrar"
                    className="absolute top-3 right-3 bg-white hover:bg-[#e8e4d0] text-[#1a5744] rounded-full h-11 w-11 flex items-center justify-center shadow-md transition-colors duration-300 ease-(--ease-brand)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 md:p-8">
                  <h2 id={titleId} className="font-serif text-2xl md:text-3xl font-semibold text-[#1a5744] mb-2">{title}</h2>

                  {duration_minutes && (
                    <div className="flex items-center text-[#1a5744]/80 text-sm mb-4">
                      <Clock className="h-4 w-4 mr-1" aria-hidden="true" />
                      <span>{duration_minutes} minutos de contenido</span>
                    </div>
                  )}

                  <div className="prose max-w-none text-[#1a5744]/85 text-sm md:text-base mb-6">
                    {description ? (
                      description.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className="mb-3">{paragraph}</p>
                      ))
                    ) : (
                      <p>Este curso está diseñado para ayudarte a dominar nuevas habilidades y avanzar en tu carrera profesional.</p>
                    )}
                  </div>

                  <ul className="space-y-2 text-sm text-[#1a5744]/85 mb-6">
                    {['Acceso de por vida', 'Certificado de finalización', 'Contenido protegido'].map((item) => (
                      <li key={item} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-[#2d7a5f] mr-2 shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer */}
                <div className="border-t border-[#e8e4d0] bg-[#f5f3e8] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-[#1a5744]">{fmtPrice}</span>
                    <p className="text-sm text-[#1a5744]/80">Pago único · Acceso de por vida</p>
                  </div>

                  {!authChecked ? (
                    <div className="h-12 bg-[#e8e4d0] rounded-xl animate-pulse" aria-hidden="true" />
                  ) : hasAccess ? (
                    <Link href={`/courses/${courseId}/learn`} className={primaryBtn}>
                      Ir al Curso
                    </Link>
                  ) : user ? (
                    <Link href={`/courses/${courseId}/checkout`} className={primaryBtn}>
                      Comprar Ahora
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <Link href={`/register?redirect=/courses/${courseId}/checkout`} className={primaryBtn}>
                        Registrarse para Comprar
                      </Link>
                      <Link
                        href={`/login?redirect=/courses/${courseId}/checkout`}
                        className="w-full bg-white text-[#1a5744] border-2 border-[#1a5744]/30 hover:border-[#1a5744]/60 hover:bg-[#1a5744]/5 active:scale-[0.98] px-6 min-h-12 flex items-center justify-center rounded-xl font-semibold text-center [transition:transform_150ms_var(--ease-out),border-color_300ms_var(--ease-brand),background-color_300ms_var(--ease-brand)]"
                      >
                        Ya tengo cuenta
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
