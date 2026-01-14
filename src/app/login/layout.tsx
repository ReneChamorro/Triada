import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Inicia sesión en Triada para acceder a tus cursos y continuar aprendiendo.',
  alternates: {
    canonical: 'https://triadave.com/login',
  },
  openGraph: {
    title: 'Iniciar Sesión | Triada',
    description: 'Accede a tu cuenta de Triada',
    url: 'https://triadave.com/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
