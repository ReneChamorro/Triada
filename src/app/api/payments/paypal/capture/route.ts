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
    const { orderId, courseId } = await request.json()

    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()

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

    if (!captureResponse.ok || captureData.status !== 'COMPLETED') {
      console.error('PayPal capture error:', captureData)
      return NextResponse.json(
        { error: 'Error al capturar el pago' },
        { status: 400 }
      )
    }

    // Grant access to the course
    const { error: enrollError } = await supabase.from('user_courses').insert({
      user_id: user.id,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
    })

    if (enrollError) {
      console.error('Enrollment error:', enrollError)
      return NextResponse.json(
        { error: 'Error al inscribir en el curso' },
        { status: 500 }
      )
    }

    // Record the payment
    await supabase.from('payments').insert({
      user_id: user.id,
      course_id: courseId,
      amount: parseFloat(captureData.purchase_units[0].amount.value),
      currency: captureData.purchase_units[0].amount.currency_code,
      payment_method: 'paypal',
      payment_status: 'completed',
      transaction_id: captureData.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
