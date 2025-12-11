'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface AboutModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#2d7a5f] to-[#1a5744] p-6 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-3xl font-bold text-white">Sobre Triada Global</h2>
          <p className="text-white/90 mt-2">Docencia, Investigación e Innovación</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-[#1a5744] mb-3">Nuestra Historia</h3>
            <p className="text-gray-700 leading-relaxed">
              Triada Global nace de la pasión por la educación de calidad y la necesidad de democratizar el acceso al conocimiento profesional. Fundada por un equipo de educadores y expertos en diversas disciplinas, nuestra plataforma se ha convertido en un referente para profesionales que buscan actualizar sus competencias y certificarse en áreas de alta demanda.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1a5744] mb-3">Nuestra Misión</h3>
            <p className="text-gray-700 leading-relaxed">
              Transformar la educación profesional mediante metodologías innovadoras, contenido de excelencia y tecnología de vanguardia. Buscamos empoderar a profesionales de todo el mundo para que alcancen sus metas y contribuyan positivamente a sus comunidades.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1a5744] mb-3">Nuestra Visión</h3>
            <p className="text-gray-700 leading-relaxed">
              Ser la plataforma líder en educación profesional en América Latina, reconocida por la calidad de nuestros programas, el compromiso con nuestros estudiantes y el impacto positivo que generamos en el desarrollo profesional de miles de personas.
            </p>
          </div>

          <div className="bg-[#e8e4d0] rounded-xl p-6">
            <h3 className="text-2xl font-bold text-[#1a5744] mb-4">Nuestros Valores</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-[#a4c639] font-bold mr-2">✓</span>
                <div>
                  <strong className="text-[#1a5744]">Excelencia:</strong>
                  <span className="text-gray-700"> Compromiso con la más alta calidad en cada curso que ofrecemos</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] font-bold mr-2">✓</span>
                <div>
                  <strong className="text-[#1a5744]">Innovación:</strong>
                  <span className="text-gray-700"> Adoptamos las mejores prácticas y tecnologías educativas</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] font-bold mr-2">✓</span>
                <div>
                  <strong className="text-[#1a5744]">Accesibilidad:</strong>
                  <span className="text-gray-700"> Educación de calidad al alcance de todos</span>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-[#a4c639] font-bold mr-2">✓</span>
                <div>
                  <strong className="text-[#1a5744]">Integridad:</strong>
                  <span className="text-gray-700"> Transparencia y ética en todas nuestras operaciones</span>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1a5744] mb-3">¿Por qué elegirnos?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#2d7a5f] to-[#1a5744] text-white p-5 rounded-xl">
                <div className="text-3xl font-bold mb-1">500+</div>
                <div className="text-sm">Estudiantes satisfechos</div>
              </div>
              <div className="bg-gradient-to-br from-[#2d7a5f] to-[#1a5744] text-white p-5 rounded-xl">
                <div className="text-3xl font-bold mb-1">50+</div>
                <div className="text-sm">Cursos disponibles</div>
              </div>
              <div className="bg-gradient-to-br from-[#2d7a5f] to-[#1a5744] text-white p-5 rounded-xl">
                <div className="text-3xl font-bold mb-1">95%</div>
                <div className="text-sm">Índice de satisfacción</div>
              </div>
              <div className="bg-gradient-to-br from-[#2d7a5f] to-[#1a5744] text-white p-5 rounded-xl">
                <div className="text-3xl font-bold mb-1">24/7</div>
                <div className="text-sm">Acceso al contenido</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-[#2d7a5f] text-white hover:bg-[#1a5744] px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
