import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { grantAccessSchema, formatZodErrors } from '@/lib/validations'
import { sendApprovalEmail } from '@/lib/emails'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = grantAccessSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }
    const { userId, courseId, paymentMethod, amountPaid, paymentId, adminNote } = parsed.data

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
      logger.error('[Manual Grant] Error:', enrollError)
      return NextResponse.json({ 
        error: 'Error al otorgar acceso',
        details: enrollError
      }, { status: 500 })
    }

    // Log to audit_log table
    try {
      const { data: targetProfile } = await supabase.from('profiles').select('email').eq('id', userId).single()
      const { data: courseData } = await supabase.from('courses').select('title').eq('id', courseId).single()
      await supabase.from('audit_log').insert({
        admin_id: adminUser.id,
        action: 'grant_access',
        target_type: 'user',
        target_id: userId,
        details: { student: targetProfile?.email, course: courseData?.title, amount: amountPaid, note: adminNote },
      })
    } catch {
      // Non-blocking
    }
    // Send approval email to the student
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      const { data: course } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single()

      if (userProfile && course) {
        logger.log('[Grant Access] Sending approval email to:', userProfile.email)
        await sendApprovalEmail(
          userProfile.email,
          userProfile.full_name || userProfile.email,
          course.title,
          courseId
        )
        logger.log('[Grant Access] Approval email sent successfully')
      } else {
        logger.error('[Grant Access] Missing user profile or course data')
      }
    } catch (emailError) {
      logger.error('[Manual Grant] Failed to send approval email:', emailError)
      // Don't fail the request if email fails
    }

    
    return NextResponse.json({ 
      success: true,
      enrollment: enrollment[0]
    })
  } catch (error) {
    logger.error('[Manual Grant] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Error al procesar la solicitud',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
