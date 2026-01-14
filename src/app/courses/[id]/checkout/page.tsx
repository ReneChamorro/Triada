'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [courseId, setCourseId] = useState('')
  const [course, setCourse] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'zelle'>('paypal')

  useEffect(() => {
    const fetchData = async () => {
      const resolvedParams = await params
      setCourseId(resolvedParams.id)

      const supabase = createClient()

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/login?redirect=/courses/${resolvedParams.id}/checkout`)
        return
      }
      setUser(user)

      // Check if user already has access
      const { data: userCourse } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', resolvedParams.id)
        .single()

      if (userCourse) {
        router.push(`/courses/${resolvedParams.id}/learn`)
        return
      }

      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('is_published', true)
        .single()

      if (!courseData) {
        router.push('/courses')
        return
      }

      setCourse(courseData)
      setLoading(false)
    }

    fetchData()
  }, [params, router])

  const handleZelleCheckout = () => {
    router.push(`/courses/${courseId}/checkout/zelle`)
  }

  const handlePayPalSuccess = async (orderId: string) => {
    setProcessing(true)
    try {
      const response = await fetch('/api/payments/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, courseId }),
      })

      const { success, error } = await response.json()

      if (success) {
        router.push(`/courses/${courseId}/learn?payment=success`)
      } else {
        alert(error || 'Error al procesar el pago con PayPal')
        setProcessing(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Ocurrió un error al procesar el pago')
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

  if (!course) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] relative overflow-hidden">
      {/* Fondo con ondas decorativas */}
      <div className="absolute inset-0 z-0">
        <svg
          className="absolute bottom-0 w-full h-64 text-white opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header con logo */}
        <div className="mb-8 md:mb-12">
          <Link href="/dashboard" className="inline-flex items-center justify-center mb-6">
            <Image
              src="/logos/Triada-logo-mono-green.png"
              alt="Triada Logo"
              width={180}
              height={60}
              priority
              className="h-14 md:h-16 w-auto drop-shadow-md"
            />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a5744] mb-2">
            Completar compra
          </h1>
          <p className="text-gray-700">
            Elige tu método de pago preferido
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Course Summary - Diseño burbuja */}
          <div className="md:col-span-1 order-2 md:order-1">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:sticky md:top-6 border-2 border-[#a4c639]/20">
              <h3 className="font-bold text-xl text-[#1a5744] mb-4">Resumen del curso</h3>
              
              {course.image_url && (
                <div className="aspect-video bg-gradient-to-br from-[#a4c639] to-[#1a5744] rounded-2xl mb-4 overflow-hidden">
                  <img 
                    src={course.image_url} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <h4 className="font-semibold text-lg text-gray-900 mb-4 line-clamp-2">
                {course.title}
              </h4>
              
              {course.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>
              )}
              
              <div className="border-t-2 border-[#F5E6D3] pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total a pagar</span>
                  <span className="text-3xl font-bold text-[#a4c639]">
                    {formatPrice(course.price, course.currency)}
                  </span>
                </div>
              </div>

              <div className="mt-6 bg-[#a4c639]/10 rounded-2xl p-4">
                <p className="text-xs text-gray-700 flex items-start">
                  <span className="text-[#a4c639] mr-2">🔒</span>
                  <span>Pago 100% seguro y encriptado. Acceso inmediato al curso.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="md:col-span-2 space-y-4 md:space-y-6 order-1 md:order-2">
            {/* PayPal Payment */}
            <div
              className={`bg-white rounded-3xl shadow-xl p-6 border-2 cursor-pointer transition-all ${
                paymentMethod === 'paypal' 
                  ? 'border-[#a4c639] ring-4 ring-[#a4c639]/20' 
                  : 'border-gray-200 hover:border-[#a4c639]/50'
              }`}
              onClick={() => setPaymentMethod('paypal')}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="mt-1 w-5 h-5 text-[#a4c639] focus:ring-[#a4c639]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-[#1a5744]">PayPal</h3>
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="#003087">
                      <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 0 1-.794.679H7.723a.483.483 0 0 1-.477-.558L9.24 11.35h2.613c4.264 0 7.563-1.73 8.214-6.872zM9.203 4.25h5.866c1.917 0 3.63.298 4.914 1.007 1.3.717 2.213 1.858 2.594 3.512.118.512.177 1.053.177 1.613v.058c0 3.25-2.018 5.81-5.668 6.486a9.95 9.95 0 0 1-2.018.184H12.18c-.512 0-.95.388-1.007.898l-.986 6.25a.668.668 0 0 1-.66.565H6.152a.334.334 0 0 1-.33-.387l2.362-14.967a1.002 1.002 0 0 1 .988-.844z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Pago rápido y seguro con tu cuenta PayPal o tarjeta de crédito/débito.
                  </p>
                  {paymentMethod === 'paypal' && (
                    <div className="w-full">
                      <PayPalScriptProvider options={{ 
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                        currency: course.currency || 'USD'
                      }}>
                        <PayPalButtons
                          style={{ 
                            layout: 'vertical',
                            color: 'gold',
                            shape: 'rect',
                            label: 'pay'
                          }}
                          disabled={processing}
                          createOrder={async () => {
                            const response = await fetch('/api/payments/paypal/create', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ courseId }),
                            })
                            const { orderId } = await response.json()
                            return orderId
                          }}
                          onApprove={async (data) => {
                            await handlePayPalSuccess(data.orderID!)
                          }}
                          onError={(err) => {
                            console.error('PayPal error:', err)
                            alert('Error al procesar el pago con PayPal')
                          }}
                        />
                      </PayPalScriptProvider>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Zelle Payment */}
            <div
              className={`bg-white rounded-3xl shadow-xl p-6 border-2 cursor-pointer transition-all ${
                paymentMethod === 'zelle' 
                  ? 'border-[#a4c639] ring-4 ring-[#a4c639]/20' 
                  : 'border-gray-200 hover:border-[#a4c639]/50'
              }`}
              onClick={() => setPaymentMethod('zelle')}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  checked={paymentMethod === 'zelle'}
                  onChange={() => setPaymentMethod('zelle')}
                  className="mt-1 w-5 h-5 text-[#a4c639] focus:ring-[#a4c639]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-[#1a5744]">Zelle</h3>
                    <div className="bg-[#6d1ed4] text-white rounded-xl px-3 py-1 font-bold text-lg">
                      Z
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Transferencia instantánea vía Zelle. Requiere verificación manual (24-48 horas).
                  </p>
                  {paymentMethod === 'zelle' && (
                    <button
                      onClick={handleZelleCheckout}
                      disabled={processing}
                      className="w-full bg-[#1a5744] text-white py-3 md:py-4 rounded-2xl font-bold text-lg hover:bg-[#134233] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                      Continuar con Zelle
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nota de seguridad */}
            <div className="bg-[#F5E6D3] rounded-3xl p-6 border-2 border-[#a4c639]/30">
              <div className="flex gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-bold text-[#1a5744] mb-1">Compra 100% Segura</p>
                  <p className="text-sm text-gray-700">
                    Todos tus datos están protegidos con encriptación SSL de nivel bancario. 
                    Nunca almacenamos información de tarjetas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
