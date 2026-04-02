'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { Loader2, Upload, CheckCircle, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'

type PaymentMethod = 'zelle' | 'pago_movil' | 'transferencia_usd' | 'paypal_manual'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'zelle', label: 'Zelle', icon: '💜' },
  { value: 'pago_movil', label: 'Pago Móvil', icon: '📱' },
  { value: 'transferencia_usd', label: 'Transferencia USD', icon: '🏦' },
  { value: 'paypal_manual', label: 'PayPal', icon: '🅿️' },
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
        console.log('Error checking access:', err)
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#a4c639]" />
      </div>
    )
  }

  if (!course) return null

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Comprobante Enviado!</h2>
          <p className="text-gray-600 mb-6">
            Tu pago está pendiente de verificación. Te notificaremos por email cuando sea aprobado (usualmente dentro de 24 horas).
          </p>
          <div className="space-y-3">
            <Link
              href="/my-courses"
              className="block w-full bg-[#a4c639] text-white hover:bg-[#8ba832] px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Ir a Mis Cursos
            </Link>
            <Link
              href="/courses"
              className="block w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
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
        <p><span className="font-medium text-gray-700">Email:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_ZELLE_EMAIL || '___RELLENAR___'}</span></p>
        <p><span className="font-medium text-gray-700">Teléfono:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_ZELLE_PHONE || '___RELLENAR___'}</span></p>
      </div>
    ),
    pago_movil: (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium text-gray-700">Banco:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_PAGO_MOVIL_BANCO || '___RELLENAR___'}</span></p>
        <p><span className="font-medium text-gray-700">Cédula:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_PAGO_MOVIL_CI || '___RELLENAR___'}</span></p>
        <p><span className="font-medium text-gray-700">Teléfono:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_PAGO_MOVIL_TELEFONO || '___RELLENAR___'}</span></p>
      </div>
    ),
    transferencia_usd: (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium text-gray-700">Banco:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_TRANSFER_BANCO || '___RELLENAR___'}</span></p>
        <p><span className="font-medium text-gray-700">Cuenta:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_TRANSFER_CUENTA || '___RELLENAR___'}</span></p>
        <p><span className="font-medium text-gray-700">Beneficiario:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_TRANSFER_BENEFICIARIO || '___RELLENAR___'}</span></p>
      </div>
    ),
    paypal_manual: (
      <div className="space-y-2 text-sm">
        <p><span className="font-medium text-gray-700">Enviar a:</span> <span className="font-mono">{process.env.NEXT_PUBLIC_PAYPAL_EMAIL || '___RELLENAR___'}</span></p>
        <p className="text-gray-500">Envía como &quot;Amigos y familiares&quot; para evitar comisiones.</p>
      </div>
    ),
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <svg className="absolute bottom-0 w-full h-64 text-white opacity-20" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
        <div className="mb-6 md:mb-8 lg:mb-12 text-center md:text-left">
          <Link href="/dashboard" className="inline-flex items-center justify-center mb-4 md:mb-6">
            <Image src="/logos/Triada-logo-mono-green.png" alt="Triada Logo" width={180} height={60} priority className="h-12 md:h-14 lg:h-16 w-auto drop-shadow-md" />
          </Link>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a5744] mb-2">Completar compra</h1>
          <p className="text-sm md:text-base text-gray-700">Elige tu método de pago y sube tu comprobante</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Course Summary */}
          <div className="w-full md:col-span-1 order-2 md:order-1">
            <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 md:sticky md:top-6 border-2 border-[#a4c639]/20">
              <h3 className="font-bold text-lg md:text-xl text-[#1a5744] mb-3 md:mb-4">Resumen del curso</h3>
              {course.image_url && (
                <div className="aspect-video bg-white rounded-2xl mb-3 md:mb-4 overflow-hidden border border-gray-200">
                  <img src={course.image_url} alt={course.title} className="w-full h-full object-contain p-8" />
                </div>
              )}
              <h4 className="font-semibold text-base md:text-lg text-gray-900 mb-3 line-clamp-2">{course.title}</h4>
              {course.description && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>}
              <div className="border-t-2 border-[#F5E6D3] pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm md:text-base text-gray-700 font-medium">Total a pagar</span>
                  <span className="text-2xl md:text-3xl font-bold text-[#a4c639]">{formatPrice(course.price, course.currency)}</span>
                </div>
              </div>
              <div className="mt-4 bg-[#a4c639]/10 rounded-2xl p-3">
                <p className="text-xs text-gray-700 flex items-start">
                  <span className="text-[#a4c639] mr-2">🔒</span>
                  <span>Verificación manual. Te confirmaremos por email en 24h.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="w-full md:col-span-2 order-1 md:order-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 text-sm">{error}</div>
              )}

              {/* Step 1: Select method */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h3 className="text-lg font-bold text-[#1a5744] mb-4">1. Método de pago</h3>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        paymentMethod === m.value
                          ? 'border-[#a4c639] bg-[#a4c639]/10 ring-2 ring-[#a4c639]/20'
                          : 'border-gray-200 hover:border-[#a4c639]/50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{m.icon}</span>
                      <span className="font-semibold text-sm text-gray-900">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Payment instructions */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h3 className="text-lg font-bold text-[#1a5744] mb-2">2. Realiza tu pago</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Envía <span className="font-bold text-[#a4c639]">{formatPrice(course.price, course.currency)}</span> a:
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  {paymentInstructions[paymentMethod]}
                </div>
              </div>

              {/* Step 3: Upload receipt */}
              <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100">
                <h3 className="text-lg font-bold text-[#1a5744] mb-4">3. Sube tu comprobante</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código de referencia *
                    </label>
                    <input
                      type="text"
                      value={referenceCode}
                      onChange={(e) => setReferenceCode(e.target.value)}
                      placeholder="Ej: 1234567890"
                      maxLength={100}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#a4c639] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center justify-center hover:border-[#a4c639] transition-colors"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Haz clic para subir imagen</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG o WebP — Máx. 5MB</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Información adicional sobre tu pago..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#a4c639] focus:border-transparent resize-none"
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

              <button
                type="submit"
                disabled={processing || !receiptFile || !referenceCode.trim()}
                className="w-full bg-[#a4c639] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#8ba832] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Comprobante de Pago'
                )}
              </button>

              <div className="bg-[#F5E6D3] rounded-3xl p-6 border-2 border-[#a4c639]/30">
                <div className="flex gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-bold text-[#1a5744] mb-1">Compra 100% Segura</p>
                    <p className="text-sm text-gray-700">
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
