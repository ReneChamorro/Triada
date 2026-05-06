import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paymentSubmitSchema, formatZodErrors } from '@/lib/validations'
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = process.env.RESEND_FROM_EMAIL || 'Triada <hola@triadave.com>'
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'triadaglobal2026@gmail.com').split(',').map(e => e.trim()).filter(Boolean)

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // 2. Rate limit
    const rl = await checkRateLimit(`payment:${user.id}`, RATE_LIMITS.paymentSubmit)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        { status: 429, headers: getRateLimitHeaders(rl) }
      )
    }

    // 3. Parse & validate body
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type debe ser multipart/form-data' }, { status: 400 })
    }

    const formData = await request.formData()
    const body = {
      courseId: formData.get('courseId') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      referenceCode: formData.get('referenceCode') as string,
      notes: (formData.get('notes') as string) || undefined,
    }

    const parsed = paymentSubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }
    const { courseId, paymentMethod, referenceCode, notes } = parsed.data

    // 4. Validate receipt image
    const receiptFile = formData.get('receipt') as File | null
    if (!receiptFile || receiptFile.size === 0) {
      return NextResponse.json({ error: 'La imagen del comprobante es requerida' }, { status: 400 })
    }
    if (receiptFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede superar 5MB' }, { status: 400 })
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(receiptFile.type)) {
      return NextResponse.json({ error: 'Solo se aceptan imágenes JPG, PNG o WebP' }, { status: 400 })
    }

    // 5. Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, currency')
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    // 6. Check user is not already enrolled
    const { data: existing } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ya tienes acceso a este curso' }, { status: 400 })
    }

    // 7. Upload receipt to Supabase Storage
    const extMap: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
    const fileExt = extMap[receiptFile.type] ?? 'jpg'
    const fileName = `${user.id}/${courseId}_${Date.now()}.${fileExt}`
    const buffer = Buffer.from(await receiptFile.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(fileName, buffer, {
        contentType: receiptFile.type,
        upsert: false,
      })

    if (uploadError) {
      logger.error('[PaymentSubmit] Upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir el comprobante' }, { status: 500 })
    }

    // 8. Insert purchase record
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: user.id,
      course_id: courseId,
      amount: course.price,
      currency: course.currency || 'USD',
      payment_method: paymentMethod,
      payment_id: referenceCode,
      status: 'pending',
      admin_notes: notes || null,
      receipt_image_url: fileName,
    })

    if (purchaseError) {
      logger.error('[PaymentSubmit] Purchase insert error:', purchaseError)
      return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 })
    }

    // 9. Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // 10. Send email notification to admins
    const methodLabels: Record<string, string> = {
      zelle: 'Zelle',
      pago_movil: 'Pago Móvil',
      transferencia_usd: 'Transferencia USD',
      paypal_manual: 'PayPal (manual)',
    }

    try {
      // Email to admins
      await resend.emails.send({
          from: FROM,
          to: ADMIN_EMAILS,
          replyTo: user.email!,
          subject: `Nuevo pago pendiente — ${course.title}`,
          text: `
NUEVO PAGO PENDIENTE

Estudiante: ${profile?.full_name || user.email || ''}
Email: ${user.email || ''}
Curso: ${course.title}
Monto: ${course.price} ${course.currency || 'USD'}
Método: ${methodLabels[paymentMethod] || paymentMethod}

Código de referencia: ${referenceCode}
${notes ? `\nNotas: ${notes}` : ''}

Revisar en Panel Admin:
${process.env.NEXT_PUBLIC_APP_URL}/admin/purchases
          `.trim(),
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <div style="background:#a4c639;color:white;padding:20px;border-radius:8px 8px 0 0">
                <h1 style="margin:0">Nuevo Pago Pendiente</h1>
              </div>
              <div style="background:#f9f9f9;padding:20px;border:1px solid #ddd">
                <p><strong>Estudiante:</strong> ${escapeHtml(profile?.full_name || user.email || '')}</p>
                <p><strong>Email:</strong> ${escapeHtml(user.email || '')}</p>
                <p><strong>Curso:</strong> ${escapeHtml(course.title)}</p>
                <p><strong>Monto:</strong> ${course.price} ${escapeHtml(course.currency || 'USD')}</p>
                <p><strong>Método:</strong> ${escapeHtml(methodLabels[paymentMethod] || paymentMethod)}</p>
                <div style="background:#fff;padding:15px;margin:15px 0;border-left:4px solid #a4c639">
                  <strong>Código de referencia:</strong><br/>
                  <span style="font-size:18px;font-family:monospace">${referenceCode}</span>
                </div>
                ${notes ? `<p><strong>Notas:</strong> ${escapeHtml(notes)}</p>` : ''}
                <p style="margin-top:20px">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/purchases"
                     style="background:#a4c639;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">
                    Revisar en Panel Admin
                  </a>
                </p>
              </div>
            </div>
          `.trim(),
        })

      // Email confirmation to student
      await resend.emails.send({
        from: FROM,
        to: user.email!,
        replyTo: ADMIN_EMAILS[0],
        subject: `Comprobante recibido — ${course.title}`,
        text: `
¡COMPROBANTE RECIBIDO!

Hola ${profile?.full_name || ''},

Hemos recibido tu comprobante de pago para el curso:

${course.title}
Monto: ${course.price} ${course.currency || 'USD'}

Nuestro equipo está verificando tu pago. Una vez confirmado, recibirás un correo de confirmación y tendrás acceso inmediato al curso.

Este proceso puede tomar entre 1-24 horas hábiles. Te notificaremos tan pronto como sea aprobado.

Si tienes alguna pregunta, responde a este correo o contáctanos.

© 2026 Triada Global. Todos los derechos reservados.
        `.trim(),
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <div style="background:#2d7a5f;color:white;padding:20px;border-radius:8px 8px 0 0">
              <h1 style="margin:0">¡Comprobante recibido!</h1>
            </div>
            <div style="background:#f9f9f9;padding:30px;border:1px solid #ddd">
              <p>Hola <strong>${escapeHtml(profile?.full_name || '')}</strong>,</p>
              <p>Hemos recibido tu comprobante de pago para el curso:</p>
              <div style="background:#fff;padding:20px;margin:20px 0;border-left:4px solid #a4c639;border-radius:4px">
                <h2 style="margin:0 0 10px 0;color:#2d7a5f;font-size:20px">${escapeHtml(course.title)}</h2>
                <p style="margin:0;color:#666">Monto: ${course.price} ${escapeHtml(course.currency || 'USD')}</p>
              </div>
              <p>Nuestro equipo está verificando tu pago. Una vez confirmado, recibirás un correo de confirmación y tendrás acceso inmediato al curso.</p>
              <p style="color:#666;font-size:14px;margin-top:30px">Este proceso puede tomar entre <strong>1-24 horas hábiles</strong>. Te notificaremos tan pronto como sea aprobado.</p>
              <div style="border-top:1px solid #ddd;margin-top:30px;padding-top:20px">
                <p style="margin:0;color:#999;font-size:12px">Si tienes alguna pregunta, responde a este correo o contáctanos.</p>
              </div>
            </div>
            <div style="text-align:center;padding:20px;color:#999;font-size:12px">
              <p style="margin:0">© 2026 Triada Global. Todos los derechos reservados.</p>
            </div>
          </div>
        `.trim(),
      })
    } catch (emailErr) {
      logger.error('[PaymentSubmit] Email error:', emailErr)
    }

    return NextResponse.json({ success: true }, { headers: getRateLimitHeaders(rl) })
  } catch (error) {
    logger.error('[PaymentSubmit] Unexpected error:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
