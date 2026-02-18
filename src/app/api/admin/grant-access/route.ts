import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, courseId, paymentMethod, amountPaid, paymentId, adminNote } = await request.json()

    const supabase = await createClient()

    // Check if requester is admin
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Check if user already has access
    const { data: existingEnrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existingEnrollment) {
      return NextResponse.json({ 
        error: 'El usuario ya tiene acceso a este curso',
        existing: true
      }, { status: 400 })
    }

    // Grant access
    const { data: enrollment, error: enrollError } = await supabase
      .from('user_courses')
      .insert({
        user_id: userId,
        course_id: courseId,
        payment_method: paymentMethod || 'manual',
        amount_paid: amountPaid || 0,
        payment_id: paymentId || `manual_${Date.now()}`,
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        is_completed: false,
      })
      .select()

    if (enrollError) {
      console.error('[Manual Grant] Error:', enrollError)
      return NextResponse.json({ 
        error: 'Error al otorgar acceso',
        details: enrollError
      }, { status: 500 })
    }

    // Log the action
    console.log('[Manual Grant] Admin granted access:', {
      adminId: adminUser.id,
      userId,
      courseId,
      note: adminNote
    })

    return NextResponse.json({ 
      success: true,
      enrollment: enrollment[0]
    })
  } catch (error) {
    console.error('[Manual Grant] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
