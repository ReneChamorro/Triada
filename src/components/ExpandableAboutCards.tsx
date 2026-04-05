"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";

export function ExpandableAboutCards() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          setIsOpen(false);
        }
      }
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "auto";
        window.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [isOpen]);

  useOutsideClick(ref, () => setIsOpen(false));

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm h-full w-full z-[100]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.button
              key={`close-button-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex absolute top-4 right-4 items-center justify-center bg-white rounded-full h-10 w-10 z-10 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`about-card-${id}`}
              ref={ref}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[#2d7a5f] to-[#1a5744] p-6">
                <h2 className="text-3xl font-bold text-white">Sobre Triada Global</h2>
                <p className="text-white/90 mt-2">Docencia, Investigación e Innovación</p>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-8 space-y-6">
                {/* Historia */}
                <div>
                  <h3 className="text-2xl font-bold text-[#1a5744] mb-3">Nuestra Historia</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Triada Global nace de la pasión por la educación de calidad y la necesidad de democratizar el acceso al conocimiento profesional. Fundada por un equipo de educadores y expertos en diversas disciplinas, nuestra plataforma se ha convertido en un referente para profesionales que buscan actualizar sus competencias y certificarse en áreas de alta demanda.
                  </p>
                </div>

                {/* Misión */}
                <div>
                  <h3 className="text-2xl font-bold text-[#1a5744] mb-3">Nuestra Misión</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Transformar la educación profesional mediante metodologías innovadoras, contenido de excelencia y tecnología de vanguardia. Buscamos empoderar a profesionales de todo el mundo para que alcancen sus metas y contribuyan positivamente a sus comunidades.
                  </p>
                </div>

                {/* Visión */}
                <div>
                  <h3 className="text-2xl font-bold text-[#1a5744] mb-3">Nuestra Visión</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Ser la plataforma líder en educación profesional en América Latina, reconocida por la calidad de nuestros programas, el compromiso con nuestros estudiantes y el impacto positivo que generamos en el desarrollo profesional de miles de personas.
                  </p>
                </div>

                {/* Valores */}
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

                {/* Stats */}
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
              <div className="bg-gray-50 p-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#a4c639] text-white hover:bg-[#2d7a5f] px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      
      {/* Single Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-block bg-[#e8e4d0] text-[#1a5744] hover:bg-white px-8 md:px-8 py-3 md:py-3 rounded-full text-lg md:text-lg font-bold transition-colors shadow-lg cursor-pointer"
      >
        Ver Más
      </button>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
