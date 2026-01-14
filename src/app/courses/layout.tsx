import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cursos',
  description: 'Explora todos los cursos disponibles en Triada. Aprende nuevas habilidades con educación de calidad.',
  alternates: {
    canonical: 'https://triadave.com/courses',
  },
  openGraph: {
    title: 'Cursos | Triada',
    description: 'Explora todos nuestros cursos y comienza a aprender',
    url: 'https://triadave.com/courses',
  },
}

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
