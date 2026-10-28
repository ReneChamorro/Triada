import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'

const cols = [
  {
    title: 'Cursos',
    links: [
      { label: 'Ver Todos', href: '/courses' },
      { label: 'Programas', href: '/courses' },
      { label: 'Certificaciones', href: '/courses' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Nosotros', href: '/#about' },
      { label: 'Contacto', href: 'mailto:info@triadaglobal.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos y Condiciones', href: '/terminos' },
      { label: 'Política de Privacidad', href: '/privacidad' },
      { label: 'Cookies', href: '/privacidad#cookies' },
    ],
  },
]

const linkClass =
  'inline-flex items-center min-h-11 text-sm text-white/75 hover:text-white transition-colors'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1a5744] text-white border-t-4 border-[#a4c639]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">

          <div className="col-span-2 md:col-span-1">
            <Image
              src="/logos/Triada-logo-dark-mode.png"
              alt="Triada"
              width={180}
              height={60}
              className="h-12 w-auto mb-4"
            />
            <p className="text-white/75 text-sm leading-relaxed mb-3 max-w-[16rem]">
              Global, Docencia e Investigación. Tu plataforma de aprendizaje profesional.
            </p>
            <a
              href="mailto:info@triadaglobal.com"
              className="inline-flex items-center gap-1.5 min-h-11 text-sm text-[#e8e4d0] hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Contáctanos
            </a>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#e8e4d0] mb-3">
                {col.title}
              </h4>
              <ul>
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className={linkClass}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-white/75">
            &copy; {year} Triada Global. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4">
            <Link href="/privacidad" className={`${linkClass} underline underline-offset-2`}>
              Política de Privacidad
            </Link>
            <Link href="/terminos" className={`${linkClass} underline underline-offset-2`}>
              Términos y Condiciones
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
