import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { courseId, courseTitle, amount, referenceCode, userId } = await request.json()

    // Verificar sesión
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, lastname, email')
      .eq('id', session.user.id)
      .single()

    // Crear registro de pago pendiente en enrollments
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: session.user.id,
        course_id: courseId,
        payment_status: 'pending',
        payment_method: 'zelle',
        payment_reference: referenceCode,
      })
      .select()
      .single()

    if (enrollmentError) {
      throw enrollmentError
    }

    // Enviar email al admin
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Triada <noreply@triadave.com>',
      to: process.env.RESEND_ADMIN_EMAIL || 'renebehrens90@gmail.com',
      subject: `💰 Nueva solicitud de pago Zelle - ${courseTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #a4c639; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
              .info-row { padding: 10px 0; border-bottom: 1px solid #ddd; }
              .label { font-weight: bold; color: #1a5744; }
              .value { color: #333; }
              .footer { background: #f5e6d3; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; }
              .reference { background: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #a4c639; font-size: 18px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Nueva Solicitud de Pago Zelle</h1>
              </div>
              <div class="content">
                <h2>Detalles del Pago</h2>
                
                <div class="info-row">
                  <span class="label">Curso:</span>
                  <span class="value">${courseTitle}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Monto:</span>
                  <span class="value">$${amount.toFixed(2)} USD</span>
                </div>
                
                <div class="reference">
                  <div class="label">Código de Referencia Zelle:</div>
                  <div style="margin-top: 8px;">${referenceCode}</div>
                </div>
                
                <h3>Datos del Usuario</h3>
                
                <div class="info-row">
                  <span class="label">Nombre:</span>
                  <span class="value">${profile?.name || ''} ${profile?.lastname || ''}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${session.user.email}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">ID de Inscripción:</span>
                  <span class="value">${enrollment.id}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Fecha:</span>
                  <span class="value">${new Date().toLocaleString('es-MX')}</span>
                </div>
              </div>
              <div class="footer">
                <p><strong>⚠️ Acción Requerida:</strong></p>
                <p>Verifica el pago en tu cuenta Zelle y actualiza el estado de la inscripción en el panel de admin.</p>
                <p style="margin-top: 15px; color: #666; font-size: 12px;">
                  Este es un email automático. Para gestionar inscripciones, ingresa al panel de admin de Triada.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('Error sending email:', emailError)
      // No fallar la request si el email falla, solo loguearlo
    }

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      message: 'Solicitud de pago recibida. Te notificaremos cuando sea verificada.'
    })

  } catch (error) {
    console.error('Error processing Zelle payment:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    )
  }
}
