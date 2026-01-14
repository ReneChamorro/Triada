import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Triada - Plataforma de Aprendizaje',
    short_name: 'Triada',
    description: 'Aprende nuevas habilidades con cursos en línea de alta calidad',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5E6D3',
    theme_color: '#a4c639',
    icons: [
      {
        src: '/logos/Triada-logo-mono-green.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
