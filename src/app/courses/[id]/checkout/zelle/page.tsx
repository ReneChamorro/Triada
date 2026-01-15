'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Copy, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/Header'

export default function ZelleCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [courseId, setCourseId] = useState('')
  const [course, setCourse] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [notes, setNotes] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const supabase = createClient()

    try {
      // Create purchase record with pending status
      const { error } = await supabase.from('purchases').insert({
        user_id: user.id,
        course_id: courseId,
        amount: course.price,
        currency: course.currency,
        payment_method: 'zelle',
        payment_id: confirmationCode,
        status: 'pending',
        admin_notes: notes,
      })

      if (error) throw error

      setSubmitted(true)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al enviar la solicitud: ' + error.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!course) return null

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Solicitud Enviada!
          </h2>
          <p className="text-gray-600 mb-6">
            Tu pago está pendiente de verificación. Te notificaremos por email cuando sea aprobado (usualmente dentro de 24 horas).
          </p>
          <div className="space-y-3">
            <Link
              href="/my-courses"
              className="block w-full bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
            >
              Ir a Mis Cursos
            </Link>
            <Link
              href="/courses"
              className="block w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg font-semibold"
            >
              Ver Más Cursos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            href={`/courses/${courseId}/checkout`}
            className="text-blue-600 hover:underline text-sm mb-2 inline-block"
          >
            ← Volver a métodos de pago
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pago con Zelle
          </h1>
          <p className="text-gray-600">
            Sigue las instrucciones para completar tu compra
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Instrucciones de Pago</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 mb-1">Monto a pagar</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPrice(course.price, course.currency)}
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">1. Abre tu app de Zelle</p>
                <p className="text-sm text-gray-600">
                  Usa tu aplicación bancaria o la app de Zelle
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">2. Envía el pago a:</p>
                <div className="bg-gray-50 rounded p-3 font-mono text-sm">
                  <p className="mb-1">
                    <span className="text-gray-600">Email:</span>{' '}
                    <span className="font-semibold">{process.env.NEXT_PUBLIC_ZELLE_EMAIL || 'tu-email@ejemplo.com'}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Teléfono:</span>{' '}
                    <span className="font-semibold">{process.env.NEXT_PUBLIC_ZELLE_PHONE || '+1234567890'}</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-2">3. En el concepto incluye:</p>
                <p className="text-sm text-gray-600">
                  Tu email ({user?.email}) y el nombre del curso
                </p>
              </div>

              <div>
                <p className="font-medium mb-2">4. Completa el formulario</p>
                <p className="text-sm text-gray-600">
                  Ingresa tu código de confirmación de Zelle
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-yellow-900 mb-1">⏱️ Tiempo de verificación</p>
              <p className="text-yellow-800">
                Verificaremos tu pago manualmente en un plazo de 24 horas. Recibirás un email cuando se apruebe.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Confirmar Pago</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Confirmación de Zelle *
                </label>
                <input
                  type="text"
                  required
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: ZX123456789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Encontrarás este código en tu confirmación de Zelle
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Cualquier información adicional sobre tu pago..."
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Resumen de Compra</h3>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">{course.title}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(course.price, course.currency)}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !confirmationCode}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Enviar para Verificación
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
