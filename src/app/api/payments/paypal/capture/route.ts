import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PAYPAL_API = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(request: Request) {
  try {
    const { orderId, courseId } = await request.json()

    console.log('[PayPal Capture] Starting capture process:', { orderId, courseId })

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[PayPal Capture] Authentication error:', authError)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    console.log('[PayPal Capture] User authenticated:', user.id)

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      console.error('[PayPal Capture] Course not found:', courseError)
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    console.log('[PayPal Capture] Course found:', course.title)

    // Check if user already has access
    const { data: existingEnrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existingEnrollment) {
      console.log('[PayPal Capture] User already enrolled, skipping')
      return NextResponse.json({ success: true, message: 'Ya estás inscrito' })
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    console.log('[PayPal Capture] Access token obtained')

    // Capture the PayPal order
    const captureResponse = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const captureData = await captureResponse.json()
    console.log('[PayPal Capture] Full capture response:', JSON.stringify(captureData, null, 2))
    
    console.log('[PayPal Capture] Capture response summary:', {
      status: captureData.status,
      id: captureData.id,
      has_purchase_units: !!captureData.purchase_units,
      purchase_units_length: captureData.purchase_units?.length,
      amount: captureData.purchase_units?.[0]?.amount?.value
    })

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('[PayPal Capture] Capture failed:', captureData)
      return NextResponse.json(
        { error: 'Error al capturar el pago', details: captureData },
        { status: 400 }
      )
    }

    // Validate purchase_units structure
    if (!captureData.purchase_units || 
        !Array.isArray(captureData.purchase_units) || 
        captureData.purchase_units.length === 0) {
      console.error('[PayPal Capture] Invalid purchase_units structure:', captureData)
      return NextResponse.json(
        { error: 'Respuesta inválida de PayPal: purchase_units vacío', details: captureData },
        { status: 400 }
      )
    }

    const purchaseUnit = captureData.purchase_units[0]
    
    // PayPal returns amount in payments.captures[0].amount (not directly in purchase_units)
    if (!purchaseUnit.payments || 
        !purchaseUnit.payments.captures || 
        !purchaseUnit.payments.captures[0] ||
        !purchaseUnit.payments.captures[0].amount) {
      console.error('[PayPal Capture] Invalid payments/captures structure:', purchaseUnit)
      return NextResponse.json(
        { error: 'Respuesta inválida de PayPal: estructura de pagos incorrecta', details: purchaseUnit },
        { status: 400 }
      )
    }

    const capture = purchaseUnit.payments.captures[0]
    const amountPaid = parseFloat(capture.amount.value)
    const currency = capture.amount.currency_code || 'USD'
    
    console.log('[PayPal Capture] Payment details:', {
      captureId: capture.id,
      amount: amountPaid,
      currency: currency,
      status: capture.status
    })

    // Use service client to bypass RLS for server-side inserts
    const serviceClient = createServiceClient()

    // 1. Register the purchase transaction
    const purchaseData = {
      user_id: user.id,
      course_id: courseId,
      amount: amountPaid,
      currency: currency,
      payment_method: 'paypal',
      payment_id: captureData.id,
      status: 'approved', // PayPal already approved it
      admin_notes: 'Aprobado automáticamente por PayPal',
      reviewed_at: new Date().toISOString(),
    }

    console.log('[PayPal Capture] Registering purchase transaction:', purchaseData)

    const { error: purchaseError, data: purchaseRecord } = await serviceClient
      .from('purchases')
      .insert(purchaseData)
      .select()

    if (purchaseError) {
      console.error('[PayPal Capture] Purchase registration error:', purchaseError)
      return NextResponse.json(
        { error: 'Error al registrar la compra', details: purchaseError },
        { status: 500 }
      )
    }

    console.log('[PayPal Capture] Purchase registered successfully:', purchaseRecord)

    // 2. Grant access to the course
    const enrollmentData = {
      user_id: user.id,
      course_id: courseId,
      payment_id: captureData.id,
      payment_method: 'paypal',
      amount_paid: amountPaid,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_completed: false,
    }

    console.log('[PayPal Capture] Inserting enrollment:', enrollmentData)

    const { error: enrollError, data: enrollData } = await serviceClient
      .from('user_courses')
      .insert(enrollmentData)
      .select()

    if (enrollError) {
      console.error('[PayPal Capture] Enrollment error:', enrollError)
      return NextResponse.json(
        { error: 'Error al inscribir en el curso', details: enrollError },
        { status: 500 }
      )
    }

    console.log('[PayPal Capture] Enrollment successful:', enrollData)

    return NextResponse.json({ 
      success: true,
      enrollment: enrollData[0]
    })
  } catch (error) {
    console.error('[PayPal Capture] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
