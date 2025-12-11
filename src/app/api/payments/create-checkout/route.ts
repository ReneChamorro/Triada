import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const { courseId } = await request.json()

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Check if user already owns the course
    const { data: existingAccess } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single()

    if (existingAccess) {
      return NextResponse.json(
        { error: 'Ya tienes acceso a este curso' },
        { status: 400 }
      )
    }

    // Fetch course details
    const { data: course } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_published', true)
      .single()

    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      )
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: course.currency.toLowerCase() || 'usd',
            unit_amount: Math.round(course.price * 100), // Convert to cents
            product_data: {
              name: course.title,
              description: course.short_description || 'Curso online',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/learn?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/checkout?payment=cancelled`,
      customer_email: user.email || undefined,
      metadata: {
        userId: user.id,
        courseId: course.id,
        userEmail: user.email || '',
      },
    })

    // Create pending purchase record
    await supabase.from('purchases').insert({
      user_id: user.id,
      course_id: course.id,
      amount: course.price,
      currency: course.currency,
      payment_method: 'stripe',
      payment_id: session.id,
      status: 'pending',
    })

    return NextResponse.json({ sessionUrl: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear sesión de pago' },
      { status: 500 }
    )
  }
}
