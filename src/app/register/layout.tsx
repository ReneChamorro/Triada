import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Registrarse',
  description: 'Crea tu cuenta en Triada y comienza a aprender con los mejores cursos en línea.',
  alternates: {
    canonical: 'https://triadave.com/register',
  },
  openGraph: {
    title: 'Registrarse | Triada',
    description: 'Únete a Triada y comienza tu viaje de aprendizaje',
    url: 'https://triadave.com/register',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
