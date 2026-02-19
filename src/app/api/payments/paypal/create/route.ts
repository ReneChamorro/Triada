import { createClient } from '@/lib/supabase/server'
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
    const { courseId } = await request.json()
    console.log('[PayPal Create] Starting order creation for course:', courseId)

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[PayPal Create] Auth error:', authError)
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    console.log('[PayPal Create] User authenticated:', user.id)

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      console.error('[PayPal Create] Course not found:', courseError)
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    console.log('[PayPal Create] Course found:', course.title, 'Price:', course.price)

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()
    console.log('[PayPal Create] Access token obtained')

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: courseId,
          description: course.title,
          amount: {
            currency_code: course.currency || 'USD',
            value: course.price.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Triada',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/learn?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/checkout?payment=cancelled`,
      },
    }

    console.log('[PayPal Create] Creating order with payload:', JSON.stringify(orderPayload, null, 2))

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderPayload),
    })

    const orderData = await orderResponse.json()
    console.log('[PayPal Create] Order response:', JSON.stringify(orderData, null, 2))

    if (!orderResponse.ok) {
      console.error('[PayPal Create] PayPal error:', orderData)
      return NextResponse.json(
        { error: 'Error al crear orden de PayPal' },
        { status: 500 }
      )
    }

    console.log('[PayPal Create] Order created successfully. ID:', orderData.id)
    return NextResponse.json({ orderId: orderData.id })
  } catch (error) {
    console.error('[PayPal Create] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
