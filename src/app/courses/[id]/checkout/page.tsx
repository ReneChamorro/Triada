'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, CreditCard, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'zelle'>('stripe')

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

  const handleStripeCheckout = async () => {
    setProcessing(true)

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
        }),
      })

      const { sessionUrl, error } = await response.json()

      if (error) {
        alert(error)
        setProcessing(false)
        return
      }

      // Redirect to Stripe Checkout URL
      window.location.href = sessionUrl
    } catch (error) {
      console.error('Error:', error)
      alert('Ocurrió un error al procesar el pago')
      setProcessing(false)
    }
  }

  const handleZelleCheckout = () => {
    router.push(`/courses/${courseId}/checkout/zelle`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2d7a5f]" />
      </div>
    )
  }

  if (!course) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-[#2d7a5f]" />
              <span className="text-2xl font-bold text-[#1a5744]">Triada</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completar compra
          </h1>
          <p className="text-gray-600">
            Elige tu método de pago preferido
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Course Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>
              <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">{course.title}</h4>
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-[#2d7a5f]">
                    {formatPrice(course.price, course.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="md:col-span-2 space-y-6">
            {/* Stripe Card Payment */}
            <div
              className={`bg-white rounded-lg shadow-sm p-6 border-2 cursor-pointer transition-colors ${
                paymentMethod === 'stripe' ? 'border-blue-600' : 'border-transparent'
              }`}
              onClick={() => setPaymentMethod('stripe')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Tarjeta de Crédito/Débito</h3>
                    <CreditCard className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Pago seguro procesado por Stripe. Aceptamos todas las tarjetas principales.
                  </p>
                  {paymentMethod === 'stripe' && (
                    <button
                      onClick={handleStripeCheckout}
                      disabled={processing}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : (
                        'Pagar con Tarjeta'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Zelle Payment */}
            <div
              className={`bg-white rounded-lg shadow-sm p-6 border-2 cursor-pointer transition-colors ${
                paymentMethod === 'zelle' ? 'border-blue-600' : 'border-transparent'
              }`}
              onClick={() => setPaymentMethod('zelle')}
            >
              <div className="flex items-start">
                <input
                  type="radio"
                  checked={paymentMethod === 'zelle'}
                  onChange={() => setPaymentMethod('zelle')}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Zelle</h3>
                    <div className="text-purple-600 font-bold text-xl">Z</div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Pago instantáneo a través de Zelle. Requiere verificación manual.
                  </p>
                  {paymentMethod === 'zelle' && (
                    <button
                      onClick={handleZelleCheckout}
                      disabled={processing}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar con Zelle
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">🔒 Compra segura</p>
              <p>Tus datos de pago están protegidos y encriptados. Nunca compartimos tu información.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
