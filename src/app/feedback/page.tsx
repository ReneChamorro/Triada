import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeedbackForm from '@/components/feedback/FeedbackForm'

export const metadata: Metadata = {
  title: 'Enviar comentarios | Triada',
  robots: { index: false },
}

export default async function FeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/feedback')

  return (
    <div className="min-h-screen bg-[#f5f3e8]">
      <Header currentPage={null} />

      <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-[#1a5744] leading-[1.1] mb-3">
          Ayúdanos a mejorar
        </h1>
        <p className="text-[#1a5744]/85 mb-8 max-w-[55ch]">
          Tus comentarios sobre la plataforma llegan directamente al equipo de Triada. Si quieres
          opinar sobre un curso en particular, hazlo desde la página de ese curso.
        </p>

        <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6 md:p-8">
          <FeedbackForm />
        </div>
      </main>

      <Footer />
    </div>
  )
}
