import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://triadave.com'),
  title: {
    default: 'Triada - Plataforma de Aprendizaje en Línea',
    template: '%s | Triada'
  },
  description: 'Aprende nuevas habilidades con cursos en línea de alta calidad. Triada ofrece educación accesible y profesional para todos.',
  keywords: ['cursos online', 'educación', 'aprendizaje', 'formación', 'triada', 'e-learning', 'Venezuela'],
  authors: [{ name: 'Triada' }],
  creator: 'Triada',
  publisher: 'Triada',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://triadave.com',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://triadave.com',
    siteName: 'Triada',
    title: 'Triada - Plataforma de Aprendizaje en Línea',
    description: 'Aprende nuevas habilidades con cursos en línea de alta calidad.',
    images: [
      {
        url: '/logos/Triada-logo-Light-mode.png',
        width: 1200,
        height: 630,
        alt: 'Triada Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Triada - Plataforma de Aprendizaje en Línea',
    description: 'Aprende nuevas habilidades con cursos en línea de alta calidad.',
    images: ['/logos/Triada-logo-Light-mode.png'],
  },
  verification: {
    google: 'nMi_taN_DUkA25A4OTK3dfjo2MsHNiFI1qZIkCqH6H0',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="canonical" href="https://triadave.com" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
