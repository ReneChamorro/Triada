import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import SessionTimeoutProvider from "@/components/SessionTimeoutProvider";
import CookieConsent from "@/components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Reading headers makes this layout dynamically rendered, which causes
  // Next.js to read the x-nonce set by middleware and automatically inject
  // it into all inline streaming scripts it generates (self.__next_f.push).
  await headers()

  return (
    <html lang="es">
      <head>
        <link rel="canonical" href="https://triadave.com" />
      </head>
      <body className={inter.className}>
        <SessionTimeoutProvider>{children}</SessionTimeoutProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
