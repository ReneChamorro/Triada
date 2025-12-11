import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.userId
        const courseId = session.metadata?.courseId

        if (!userId || !courseId) {
          console.error('Missing metadata in checkout session')
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
        }

        // Update purchase status
        const { error: updateError } = await supabase
          .from('purchases')
          .update({
            status: 'completed',
            payment_id: session.payment_intent as string,
          })
          .eq('payment_id', session.id)
          .eq('user_id', userId)

        if (updateError) {
          console.error('Error updating purchase:', updateError)
        }

        // Grant course access
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('payment_id', session.payment_intent as string)
          .single()

        await supabase.from('user_courses').insert({
          user_id: userId,
          course_id: courseId,
          purchase_id: purchase?.id,
        })

        console.log(`✅ Access granted: User ${userId} → Course ${courseId}`)
        break
      }

      case 'checkout.session.expired':
      case 'payment_intent.payment_failed': {
        const session = event.data.object as any
        const sessionId = session.id

        // Update purchase status to failed
        await supabase
          .from('purchases')
          .update({ status: 'failed' })
          .eq('payment_id', sessionId)

        console.log(`❌ Payment failed for session ${sessionId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
