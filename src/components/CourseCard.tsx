'use client'
import { logger } from '@/lib/logger'

import React, { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        setUser(currentUser)

        if (currentUser) {
          const { data: userCourse, error: courseError } = await supabase
            .from('user_courses')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('course_id', courseId)
            .maybeSingle()
          if (courseError) throw courseError
          setHasAccess(!!userCourse)
        }
      } catch (error) {
        logger.error('Auth check failed:', error)
        setUser(null)
        setHasAccess(false)      } finally {
        setAuthChecked(true)
      }
    }
    if (isOpen) checkAuth()
  }, [isOpen, courseId])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      function onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') setIsOpen(false)
      }
      window.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = 'auto'
        window.removeEventListener('keydown', onKeyDown)
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
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-xl hover:ring-[#a4c639]/30 card-hover cursor-pointer transition-all duration-300 border-t-[3px] border-[#a4c639]/40 hover:border-[#a4c639]" onClick={() => setIsOpen(true)}>
        {thumbnail_url ? (
          <div className="aspect-video relative overflow-hidden bg-white">
            <img
              src={thumbnail_url}
              alt={title}
              className="w-full h-full object-contain p-8"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[#a4c639] to-[#2d7a5f] flex items-center justify-center">
            {Icon ? <Icon className="h-16 w-16 text-white" /> : <BookOpen className="h-16 w-16 text-white" />}
          </div>
        )}
        <div className="p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-[#2d7a5f] mb-1.5 group-hover:text-[#a4c639] transition-colors line-clamp-2">
            {title}
          </h3>
          {category && (
            <span className="inline-block text-xs font-semibold text-[#a4c639] bg-[#a4c639]/10 px-2.5 py-0.5 rounded-full mb-2 capitalize">
              {category}
            </span>
          )}
          <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 line-clamp-2">
            {short_description || description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl md:text-2xl font-bold text-[#a4c639]">
              {fmtPrice}
            </span>
            <span className="text-[#a4c639] font-medium group-hover:underline flex items-center">
              Ver más
              <ArrowRight className="ml-1 h-4 w-4" />
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-0 grid place-items-center z-[100] p-4">
              <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl"
              >
                {/* Image Header */}
                <div className="relative">
                  {thumbnail_url ? (
                    <div className="bg-white p-8 flex items-center justify-center border-b">
                      <img src={thumbnail_url} alt={title} className="h-32 md:h-40 object-contain" />
                    </div>
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-[#a4c639] to-[#2d7a5f] flex items-center justify-center">
                      {Icon ? <Icon className="h-16 w-16 text-white" /> : <BookOpen className="h-16 w-16 text-white" />}
                    </div>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full h-8 w-8 flex items-center justify-center shadow-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6l-12 12" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-[#2d7a5f] mb-2">{title}</h2>

                  {duration_minutes && (
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{duration_minutes} minutos de contenido</span>
                    </div>
                  )}

                  <div className="prose max-w-none text-gray-700 text-sm md:text-base mb-6">
                    {description ? (
                      description.split('\n').map((paragraph: string, index: number) => (
                        <p key={index} className="mb-3">{paragraph}</p>
                      ))
                    ) : (
                      <p>Este curso está diseñado para ayudarte a dominar nuevas habilidades y avanzar en tu carrera profesional.</p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#a4c639] mr-2 flex-shrink-0" />
                      <span>Acceso de por vida</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#a4c639] mr-2 flex-shrink-0" />
                      <span>Certificado de finalización</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-[#a4c639] mr-2 flex-shrink-0" />
                      <span>Contenido protegido</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#e8e4d0] bg-[#e8e4d0]/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">{fmtPrice}</span>
                      <p className="text-sm text-gray-500">Pago único • Acceso de por vida</p>
                    </div>
                  </div>

                  {!authChecked ? (
                    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                  ) : hasAccess ? (
                    <Link
                      href={`/courses/${courseId}/learn`}
                      className="w-full bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-6 py-3 rounded-xl font-semibold text-center block transition-colors"
                    >
                      Ir al Curso
                    </Link>
                  ) : user ? (
                    <Link
                      href={`/courses/${courseId}/checkout`}
                      className="w-full bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-6 py-3 rounded-lg font-semibold text-center block transition-colors"
                    >
                      Comprar Ahora
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        href={`/register?redirect=/courses/${courseId}/checkout`}
                        className="w-full bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-6 py-3 rounded-lg font-semibold text-center block transition-colors"
                      >
                        Registrarse para Comprar
                      </Link>
                      <Link
                        href={`/login?redirect=/courses/${courseId}/checkout`}
                        className="w-full bg-white text-[#2d7a5f] border-2 border-[#2d7a5f] hover:bg-[#e8e4d0] px-6 py-3 rounded-lg font-semibold text-center block transition-colors"
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
