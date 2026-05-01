import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap, Mail, ArrowUpRight } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#2d7a5f] text-white">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#2d7a5f] via-[#a4c639] to-[#2d7a5f]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#a4c639] flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-[#2d7a5f]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">TRIADA</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-[200px]">
              Global, Docencia e Investigación. Tu plataforma de aprendizaje profesional.
            </p>
            <a
              href="mailto:info@triadaglobal.com"
              className="inline-flex items-center gap-1.5 text-sm text-[#a4c639] hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              Contáctanos
            </a>
          </div>

          {/* Cursos */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-5">Cursos</h4>
            <ul className="space-y-3">
              {[
                { label: 'Ver Todos', href: '/courses' },
                { label: 'Programas', href: '/courses' },
                { label: 'Certificaciones', href: '/courses' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-5">Empresa</h4>
            <ul className="space-y-3">
              {[
                { label: 'Inicio', href: '/' },
                { label: 'Nosotros', href: '#about' },
                { label: 'Contacto', href: '#' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-5">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: 'Términos y Condiciones', href: '/terminos' },
                { label: 'Política de Privacidad', href: '/privacidad' },
                { label: 'Cookies', href: '/privacidad#cookies' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-white/40">
            &copy; {year} Triada Global. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacidad" className="text-xs text-white/70 hover:text-white transition-colors underline underline-offset-2">
              Política de Privacidad
            </Link>
            <Link href="/terminos" className="text-xs text-white/70 hover:text-white transition-colors underline underline-offset-2">
              Términos y Condiciones
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#a4c639] animate-pulse-dot" />
              <span className="text-xs text-white/35 font-medium">Plataforma activa</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
