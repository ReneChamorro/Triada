import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma Triada.',
  robots: { index: true, follow: true },
}

const lastUpdated = '27 de abril de 2026'

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-[#2d7a5f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Términos y Condiciones
          </h1>
          <p className="mt-2 text-white/60 text-sm">Última actualización: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-gray max-w-none">

          <p className="text-gray-600 lead">
            Bienvenido a <strong>Triada</strong>. Al acceder y utilizar nuestra plataforma en{' '}
            <strong>triadave.com</strong>, aceptas cumplir con los siguientes términos y condiciones.
            Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices el sitio.
          </p>

          <hr className="my-8 border-gray-100" />

          <Section title="1. Descripción del servicio">
            <p>
              Triada es una plataforma de aprendizaje en línea que ofrece cursos, materiales educativos
              y contenido formativo. Los cursos pueden ser de acceso gratuito o de pago, según lo
              indicado en cada oferta.
            </p>
          </Section>

          <Section title="2. Registro y cuentas">
            <p>
              Para acceder a los cursos es necesario crear una cuenta. Al registrarte, te comprometes a:
            </p>
            <ul>
              <li>Proporcionar información veraz, completa y actualizada.</li>
              <li>Mantener la confidencialidad de tu contraseña.</li>
              <li>Notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta.</li>
              <li>No compartir tu cuenta con terceros.</li>
            </ul>
            <p>
              Triada se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos.
            </p>
          </Section>

          <Section title="3. Uso aceptable">
            <p>Al utilizar la plataforma, te comprometes a no:</p>
            <ul>
              <li>Reproducir, distribuir o revender el contenido de los cursos sin autorización expresa.</li>
              <li>Compartir tus credenciales de acceso con otras personas.</li>
              <li>Utilizar la plataforma para actividades ilegales, fraudulentas o que vulneren los derechos de terceros.</li>
              <li>Interferir con el funcionamiento técnico del sitio.</li>
              <li>Publicar contenido ofensivo, difamatorio o que infrinja derechos de propiedad intelectual.</li>
            </ul>
          </Section>

          <Section title="4. Propiedad intelectual">
            <p>
              Todo el contenido disponible en Triada —incluyendo videos, textos, imágenes, logos y
              materiales de curso— es propiedad de Triada o de sus respectivos autores y está
              protegido por las leyes de propiedad intelectual aplicables.
            </p>
            <p>
              El acceso a los cursos te otorga una licencia personal, no exclusiva e intransferible
              para uso educativo privado. Queda expresamente prohibida la reproducción, distribución
              o explotación comercial del contenido sin autorización escrita.
            </p>
          </Section>

          <Section title="5. Pagos y reembolsos">
            <p>
              Los cursos de pago deben abonarse antes de acceder al contenido. Los precios se muestran
              en la plataforma y pueden cambiar sin previo aviso, aunque el precio pagado al momento
              de la compra se mantendrá.
            </p>
            <p>
              Dado que el contenido es digital e inmediatamente accesible, <strong>no se realizan
              reembolsos</strong> una vez que el acceso al curso ha sido activado, salvo en casos de
              error técnico imputable a Triada. Para solicitar revisión de un cargo, comunícate con
              nosotros a <a href="mailto:info@triadaglobal.com" className="text-[#2d7a5f]">info@triadaglobal.com</a>.
            </p>
          </Section>

          <Section title="6. Disponibilidad del servicio">
            <p>
              Triada no garantiza la disponibilidad ininterrumpida de la plataforma. Nos reservamos
              el derecho de realizar mantenimientos, actualizaciones o interrupciones temporales del
              servicio, procurando notificar con anticipación cuando sea posible.
            </p>
          </Section>

          <Section title="7. Limitación de responsabilidad">
            <p>
              Triada proporciona el contenido "tal cual" y no garantiza resultados específicos de
              aprendizaje. En ningún caso seremos responsables por daños indirectos, incidentales o
              consecuentes derivados del uso de la plataforma.
            </p>
          </Section>

          <Section title="8. Modificaciones">
            <p>
              Podemos actualizar estos Términos en cualquier momento. Te notificaremos los cambios
              relevantes publicando la nueva versión en esta página. El uso continuado de la plataforma
              tras la publicación de cambios implica la aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="9. Ley aplicable">
            <p>
              Estos Términos se rigen por las leyes de la República Bolivariana de Venezuela.
              Cualquier disputa se someterá a los tribunales competentes de dicha jurisdicción.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Para cualquier consulta sobre estos Términos, contáctanos en:{' '}
              <a href="mailto:info@triadaglobal.com" className="text-[#2d7a5f] hover:underline">
                info@triadaglobal.com
              </a>
            </p>
          </Section>

          <hr className="my-8 border-gray-100" />

          <p className="text-sm text-gray-400 text-center">
            ¿Tienes dudas? Revisa también nuestra{' '}
            <Link href="/privacidad" className="text-[#2d7a5f] hover:underline">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-600 space-y-3 text-sm leading-relaxed">{children}</div>
    </div>
  )
}
