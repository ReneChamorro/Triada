import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#a4c639] text-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-6 md:h-8 w-6 md:w-8 text-white" />
              <span className="text-xl md:text-2xl font-bold">TRIADA</span>
            </div>
            <p className="text-[#e8e4d0] text-sm md:text-base">
              Global, Docencia e Investigación
            </p>
            <p className="text-[#e8e4d0]/80 text-xs md:text-sm mt-2">
              Tu plataforma de aprendizaje profesional
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-[#1a5744]">Cursos</h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li><Link href="/courses" className="hover:text-white transition-colors">Ver Todos</Link></li>
              <li><Link href="/courses" className="hover:text-white transition-colors">Programas</Link></li>
              <li><Link href="/courses" className="hover:text-white transition-colors">Certificaciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-[#1a5744]">Empresa</h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="#about" className="hover:text-white transition-colors">Nosotros</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-[#1a5744]">Legal</h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li><Link href="#" className="hover:text-white transition-colors">Términos y Condiciones</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Política de Privacidad</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 pt-8 text-center text-sm text-white/90">
          <p>&copy; 2025 Triada Global. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
