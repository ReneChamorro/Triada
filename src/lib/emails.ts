import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
// Domain triadave.com is verified in Resend — use it as the sending domain.
const FROM = process.env.RESEND_FROM_EMAIL || 'Triada <hola@triadave.com>'

export async function sendApprovalEmail(
  to: string,
  studentName: string,
  courseName: string,
  courseId: string
) {
  const courseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseId}/learn`

  await resend.emails.send({
    from: FROM,
    to,
    subject: `✅ ¡Acceso al curso listo! — ${courseName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#a4c639;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0">✅ ¡Tu pago ha sido aprobado!</h1>
        </div>
        <div style="background:#f9f9f9;padding:20px;border:1px solid #ddd">
          <p>Hola <strong>${studentName}</strong>,</p>
          <p>Tu pago para el curso <strong>${courseName}</strong> ha sido verificado y aprobado.</p>
          <p>Ya tienes acceso completo al curso. ¡Comienza a aprender ahora!</p>
          <p style="margin-top:20px">
            <a href="${courseUrl}"
               style="background:#a4c639;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold;font-size:16px">
              Ir al Curso
            </a>
          </p>
        </div>
        <div style="background:#f5e6d3;padding:15px;text-align:center;border-radius:0 0 8px 8px">
          <p style="color:#666;font-size:12px;margin:0">Triada — Plataforma de Aprendizaje en Línea</p>
        </div>
      </div>
    `.trim(),
  })
}

export async function sendRejectionEmail(
  to: string,
  studentName: string,
  courseName: string,
  reason?: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `❌ Pago no verificado — ${courseName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0">❌ Pago no verificado</h1>
        </div>
        <div style="background:#f9f9f9;padding:20px;border:1px solid #ddd">
          <p>Hola <strong>${studentName}</strong>,</p>
          <p>Lamentamos informarte que no pudimos verificar tu pago para el curso <strong>${courseName}</strong>.</p>
          ${reason ? `<div style="background:#fff;padding:15px;margin:15px 0;border-left:4px solid #dc2626"><strong>Motivo:</strong> ${reason}</div>` : ''}
          <p>Si crees que esto es un error, puedes:</p>
          <ul>
            <li>Reenviar tu comprobante realizando una nueva compra</li>
            <li>Contactarnos por email para más asistencia</li>
          </ul>
          <p style="margin-top:20px">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses"
               style="background:#1a5744;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:bold">
              Ver Cursos
            </a>
          </p>
        </div>
        <div style="background:#f5e6d3;padding:15px;text-align:center;border-radius:0 0 8px 8px">
          <p style="color:#666;font-size:12px;margin:0">Triada — Plataforma de Aprendizaje en Línea</p>
        </div>
      </div>
    `.trim(),
  })
}
