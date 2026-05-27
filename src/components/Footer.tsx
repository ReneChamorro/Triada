'use client'

import Link from 'next/link'
import { GraduationCap, Mail, ArrowUpRight } from 'lucide-react'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'

export default function Footer() {
  const year = new Date().getFullYear()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

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
        { label: 'Nosotros', href: '#about' },
        { label: 'Contacto', href: '#' },
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

  return (
    <footer className="bg-[#1a5744] text-white relative overflow-hidden">
      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #a4c639 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />

      {/* Top accent bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#1a5744] via-[#a4c639] to-[#1a5744]" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">

          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="col-span-2 md:col-span-1"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#a4c639] flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5 text-[#1a5744]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">TRIADA</span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed mb-4 max-w-[200px]">
              Global, Docencia e Investigación. Tu plataforma de aprendizaje profesional.
            </p>
            <a
              href="mailto:info@triadaglobal.com"
              className="inline-flex items-center gap-1.5 text-sm text-[#a4c639] hover:text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5" />
              Contáctanos
            </a>
          </motion.div>

          {/* Link columns */}
          {cols.map((col, colIdx) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + colIdx * 0.08 }}
            >
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#a4c639] mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map(({ label, href }, linkIdx) => (
                  <motion.li
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.2 + colIdx * 0.08 + linkIdx * 0.05 }}
                  >
                    <Link
                      href={href}
                      className="text-sm text-white/55 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-sm text-white/35">
            &copy; {year} Triada Global. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacidad"
              className="text-xs text-white/60 hover:text-white transition-colors underline underline-offset-2"
            >
              Política de Privacidad
            </Link>
            <Link
              href="/terminos"
              className="text-xs text-white/60 hover:text-white transition-colors underline underline-offset-2"
            >
              Términos y Condiciones
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#a4c639] animate-pulse-dot" />
              <span className="text-xs text-white/30 font-medium">Plataforma activa</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
