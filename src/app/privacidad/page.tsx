import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y tratamiento de datos personales de Triada.',
  robots: { index: true, follow: true },
}

const lastUpdated = '27 de abril de 2026'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#f9f8f4]">
      {/* Header bar */}
      <div className="bg-[#2d7a5f] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#a4c639]/15 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <p className="text-[#a4c639] text-xs font-semibold uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Política de Privacidad
          </h1>
          <p className="mt-2 text-white/60 text-sm">Última actualización: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-gray max-w-none">

          <p className="text-gray-600 lead">
            En <strong>Triada</strong> respetamos tu privacidad y nos comprometemos a proteger tus
            datos personales. Esta Política describe qué información recopilamos, cómo la usamos y
            los derechos que tienes sobre ella.
          </p>

          <hr className="my-8 border-gray-100" />

          <Section title="1. Responsable del tratamiento">
            <p>
              El responsable del tratamiento de tus datos es <strong>Triada Global</strong>, operando
              a través del sitio <strong>triadave.com</strong>. Puedes contactarnos en{' '}
              <a href="mailto:info@triadaglobal.com" className="text-[#a4c639] hover:underline">
                info@triadaglobal.com
              </a>
              .
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>Recopilamos únicamente los datos necesarios para brindarte el servicio:</p>
            <ul>
              <li>
                <strong>Datos de registro:</strong> nombre, apellido y dirección de correo
                electrónico al crear tu cuenta.
              </li>
              <li>
                <strong>Datos de uso:</strong> progreso en cursos, lecciones completadas y actividad
                dentro de la plataforma, para ofrecerte una mejor experiencia.
              </li>
              <li>
                <strong>Datos de pago:</strong> no almacenamos datos de tarjetas de crédito/débito.
                Los pagos son procesados por proveedores externos de confianza.
              </li>
              <li>
                <strong>Datos técnicos:</strong> dirección IP y tipo de navegador, recopilados
                automáticamente para la seguridad y el funcionamiento del sitio.
              </li>
            </ul>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <p>Utilizamos tus datos para:</p>
            <ul>
              <li>Gestionar tu cuenta y el acceso a los cursos contratados.</li>
              <li>Procesar pagos y emitir comprobantes.</li>
              <li>Enviarte comunicaciones relacionadas con tu cuenta (confirmaciones, notificaciones).</li>
              <li>Mejorar la plataforma y personalizar tu experiencia de aprendizaje.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
            <p>
              <strong>No vendemos ni compartimos tus datos personales con terceros con fines
              publicitarios.</strong>
            </p>
          </Section>

          <Section title="4. Cookies" id="cookies">
            <p>
              Utilizamos cookies estrictamente necesarias para la autenticación de usuarios y el
              funcionamiento correcto de la plataforma. No empleamos cookies de rastreo, publicidad
              conductual ni análisis de terceros.
            </p>
            <p>
              Puedes gestionar las cookies desde la configuración de tu navegador. Ten en cuenta
              que desactivarlas puede afectar el funcionamiento del sitio.
            </p>
            <p>
              <strong>Tipos de cookies que usamos:</strong>
            </p>
            <ul>
              <li>
                <strong>Cookies de sesión:</strong> necesarias para mantener tu sesión activa
                mientras navegas.
              </li>
              <li>
                <strong>Cookies de preferencias:</strong> almacenan ajustes como el consentimiento
                de cookies para no mostrarte el aviso repetidamente.
              </li>
            </ul>
          </Section>

          <Section title="5. Base legal del tratamiento">
            <p>El tratamiento de tus datos se basa en:</p>
            <ul>
              <li>
                <strong>Ejecución del contrato:</strong> necesario para prestarte el servicio
                solicitado.
              </li>
              <li>
                <strong>Consentimiento:</strong> para comunicaciones opcionales (puedes retirar tu
                consentimiento en cualquier momento).
              </li>
              <li>
                <strong>Interés legítimo:</strong> para la seguridad del sitio y la prevención
                de fraudes.
              </li>
            </ul>
          </Section>

          <Section title="6. Conservación de los datos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa o sea necesario para la prestación
              del servicio. Si solicitas la eliminación de tu cuenta, borraremos tus datos personales
              en un plazo razonable, salvo que debamos conservarlos por obligación legal.
            </p>
          </Section>

          <Section title="7. Tus derechos">
            <p>Tienes derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
              <li><strong>Eliminación:</strong> solicitar la supresión de tus datos personales.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en formato electrónico.</li>
              <li><strong>Oposición:</strong> oponerte al tratamiento en determinadas circunstancias.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, escríbenos a{' '}
              <a href="mailto:info@triadaglobal.com" className="text-[#a4c639] hover:underline">
                info@triadaglobal.com
              </a>{' '}
              indicando tu solicitud y adjuntando una prueba de identidad.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos contra accesos
              no autorizados, pérdida o alteración. Utilizamos cifrado HTTPS, autenticación segura
              y seguimos buenas prácticas de seguridad en el desarrollo del software.
            </p>
          </Section>

          <Section title="9. Servicios de terceros">
            <p>
              Para el funcionamiento de la plataforma utilizamos proveedores externos que pueden
              procesar datos en tu nombre:
            </p>
            <ul>
              <li><strong>Supabase:</strong> base de datos y autenticación.</li>
              <li><strong>Vercel:</strong> alojamiento y despliegue del sitio.</li>
              <li><strong>Mux:</strong> procesamiento y entrega de video.</li>
            </ul>
            <p>
              Todos estos proveedores cumplen estándares de seguridad y privacidad reconocidos
              internacionalmente.
            </p>
          </Section>

          <Section title="10. Cambios en esta política">
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Publicaremos la versión
              actualizada en esta página junto con la fecha de revisión. Te recomendamos revisarla
              de forma ocasional.
            </p>
          </Section>

          <Section title="11. Contacto">
            <p>
              Para cualquier consulta sobre esta Política o sobre el tratamiento de tus datos,
              contáctanos en:{' '}
              <a href="mailto:info@triadaglobal.com" className="text-[#a4c639] hover:underline">
                info@triadaglobal.com
              </a>
            </p>
          </Section>

          <hr className="my-8 border-gray-100" />

          <p className="text-sm text-gray-400 text-center">
            Consulta también nuestros{' '}
            <Link href="/terminos" className="text-[#2d7a5f] hover:underline">
              Términos y Condiciones
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="mb-8" id={id}>
      <h2 className="text-base font-bold text-[#2d7a5f] mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-[#a4c639] inline-block shrink-0" />
        {title}
      </h2>
      <div className="text-gray-600 space-y-3 text-sm leading-relaxed">{children}</div>
    </div>
  )
}
