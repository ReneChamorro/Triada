'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Upload, CheckCircle, Zap, Smartphone, Lock, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

type PaymentMethod = 'zelle' | 'pago_movil'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; Icon: React.ElementType }[] = [
  { value: 'zelle', label: 'Zelle', Icon: Zap },
  { value: 'pago_movil', label: 'Pago Móvil', Icon: Smartphone },
]

export default function CheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [course, setCourse] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('zelle')
  const [referenceCode, setReferenceCode] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Honeypot field
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return

      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?redirect=/courses/${courseId}/checkout`)
        return
      }
      setUser(user)

      try {
        const { data: userCourse } = await supabase
          .from('user_courses')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .maybeSingle()

        if (userCourse) {
          router.push(`/courses/${courseId}/learn`)
          return
        }
      } catch (err) {
        logger.log('Error checking access:', err)
      }

      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .eq('status', 'published')
        .single()

      if (error || !courseData) {
        const { data: courseDataAlt } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single()
        
        if (courseDataAlt) {
          setCourse(courseDataAlt)
        } else {
          router.push('/courses')
          return
        }
      } else {
        setCourse(courseData)
      }

      setLoading(false)
    }

    fetchData()
  }, [courseId, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se aceptan imágenes JPG, PNG o WebP')
      return
    }

    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Honeypot check
    if (honeypot) return

    if (!receiptFile) {
      setError('Sube una imagen del comprobante')
      return
    }
    if (!referenceCode.trim()) {
      setError('Ingresa el código de referencia')
      return
    }

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('courseId', courseId)
      formData.append('paymentMethod', paymentMethod)
      formData.append('referenceCode', referenceCode.trim())
      formData.append('receipt', receiptFile)
      if (notes.trim()) formData.append('notes', notes.trim())

      const response = await fetch('/api/payments/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al enviar el comprobante')
        setProcessing(false)
        return
      }

      setSubmitted(true)
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f8f4]">
        <Loader2 className="h-8 w-8 animate-spin text-[#a4c639]" />
      </div>
    )
  }

  if (!course) return null

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f9f8f4] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-[#a4c639]/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-9 w-9 text-[#a4c639]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#2d7a5f] mb-2">¡Comprobante Enviado!</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Tu pago está pendiente de verificación. Te notificaremos por email cuando sea aprobado (usualmente dentro de 24 horas).
          </p>
          <div className="space-y-3">
            <Link href="/my-courses"
              className="block w-full bg-[#a4c639] hover:bg-[#2d7a5f] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md shadow-[#a4c639]/30">
              Ir a Mis Cursos
            </Link>
            <Link href="/courses"
              className="block w-full bg-white text-[#2d7a5f] border-2 border-gray-200 hover:border-[#2d7a5f] px-6 py-3 rounded-xl font-semibold transition-all">
              Ver Más Cursos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const paymentInstructions: Record<PaymentMethod, React.ReactNode> = {
    zelle: (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium text-gray-700">Email:</span> <span className="font-mono">triadaglobal2026@gmail.com</span></p>
      </div>
    ),
    pago_movil: (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium text-gray-700">Banco:</span> <span className="font-mono">Banco Provincial</span></p>
        <p><span className="font-medium text-gray-700">Cédula:</span> <span className="font-mono">V-17.922.825</span></p>
        <p><span className="font-medium text-gray-700">Teléfono:</span> <span className="font-mono">0414-791-7048</span></p>
      </div>
    ),
  }

  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Image src="/logos/Triada-logo-mono-green.png" alt="Triada Logo" width={160} height={50} priority className="h-10 w-auto" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#a4c639]">Proceso de Pago</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-6 md:mb-10">
          <p className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest mb-1">Paso final</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#2d7a5f]">Completar compra</h1>
          <p className="text-gray-400 text-sm mt-1">Elige tu método de pago y sube tu comprobante</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Course Summary */}
          <div className="w-full lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 rounded-full bg-[#a4c639] inline-block" />
                <h3 className="font-bold text-[#2d7a5f]">Resumen del curso</h3>
              </div>
              {course.image_url && (
                <div className="aspect-video bg-[#f5f3e8] rounded-xl mb-4 overflow-hidden">
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-contain p-4" />
                </div>
              )}
              <h4 className="font-bold text-[#2d7a5f] mb-2 line-clamp-2">{course.title}</h4>
              {course.description && <p className="text-xs text-gray-400 mb-4 line-clamp-3">{course.description}</p>}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Total a pagar</span>
                  <span className="text-2xl font-extrabold text-[#a4c639]">{formatPrice(course.price, course.currency)}</span>
                </div>
              </div>
              <div className="mt-4 bg-[#a4c639]/10 rounded-xl p-3 border border-[#a4c639]/20">
                <p className="text-xs text-gray-600 flex items-start gap-2">
                  <Lock className="h-3.5 w-3.5 text-[#a4c639] shrink-0 mt-0.5" />
                  Verificación manual. Te confirmaremos por email en 24h.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="w-full lg:col-span-2 order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">{error}</div>
              )}

              {/* Step 1: Select method */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#a4c639] text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                  <h3 className="font-bold text-[#2d7a5f]">Método de pago</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        paymentMethod === m.value
                          ? 'border-[#a4c639] bg-[#a4c639]/10'
                          : 'border-gray-200 hover:border-[#a4c639]/50'
                      }`}>
                      <m.Icon className={`w-6 h-6 mb-2 ${
                        m.value === 'zelle' ? 'text-[#6b21a8]' : 'text-[#1e3a5f]'
                      }`} />
                      <span className="font-semibold text-sm text-gray-900">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Payment instructions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#a4c639] text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                  <h3 className="font-bold text-[#2d7a5f]">Realiza tu pago</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Envía <span className="font-bold text-[#a4c639]">{formatPrice(course.price, course.currency)}</span> a:
                </p>
                <div className="bg-[#f5f3e8] rounded-xl p-4 border border-gray-200">
                  {paymentInstructions[paymentMethod]}
                </div>
              </div>

              {/* Step 3: Upload receipt */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-[#a4c639] text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                  <h3 className="font-bold text-[#2d7a5f]">Sube tu comprobante</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4 flex items-start gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#2d7a5f] shrink-0 mt-0.5" />
                  Tu comprobante se almacena de forma segura y se elimina automáticamente una vez verificado tu pago.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Código de referencia *
                    </label>
                    <input
                      type="text"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="Ej: 1234567890"
                      maxLength={100}
                      required
                      className="w-full px-4 py-3 bg-[#f5f3e8] border-2 border-transparent rounded-xl focus:border-[#a4c639] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Imagen del comprobante *
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {receiptPreview ? (
                      <div className="relative">
                        <img src={receiptPreview} alt="Comprobante" className="w-full max-h-64 object-contain rounded-xl border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFile(null)
                            setReceiptPreview(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center justify-center hover:border-[#a4c639] hover:bg-[#a4c639]/5 transition-all">
                        <Upload className="h-8 w-8 text-gray-300 mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Haz clic para subir imagen</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG o WebP — Máx. 5MB</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Información adicional sobre tu pago..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-4 py-3 bg-[#f5f3e8] border-2 border-transparent rounded-xl focus:border-[#a4c639] focus:bg-white focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Honeypot */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={processing || !receiptFile || !referenceCode.trim()}
                className="w-full bg-[#a4c639] hover:bg-[#2d7a5f] text-white py-4 rounded-xl font-bold text-base transition-all shadow-md shadow-[#a4c639]/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {processing ? (<><Loader2 className="h-5 w-5 animate-spin" />Enviando...</>) : 'Enviar Comprobante de Pago'}
              </button>

              <div className="bg-[#f5f3e8] rounded-2xl p-5 border border-[#a4c639]/20">
                <div className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#a4c639] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#2d7a5f] mb-1 text-sm">Compra 100% Segura</p>
                    <p className="text-xs text-gray-500">
                      Tu comprobante será revisado por nuestro equipo. Recibirás confirmación por email en un máximo de 24 horas.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
