import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ReviewForm from '@/components/reviews/ReviewForm'

export const metadata: Metadata = {
  title: 'Tu opinión del curso | Triada',
  robots: { index: false },
}

export default async function CourseReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/courses/${id}/resena`)

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  if (!course) notFound()

  const { data: enrollment } = await supabase
    .from('user_courses')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', id)
    .maybeSingle()
  if (!enrollment) redirect(`/courses/${id}`)

  // Own row only (RLS "Users read own review").
  const { data: review } = await supabase
    .from('course_reviews')
    .select('rating, comment, status, moderation_note')
    .eq('course_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#f5f3e8]">
      <Header currentPage="courses" />

      <main id="main" className="max-w-2xl mx-auto px-4 sm:px-6 py-10 md:py-16">
        <Link href={`/courses/${id}`} className="inline-flex items-center gap-2 text-sm text-[#1a5744]/80 hover:text-[#1a5744] mb-6">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver al curso
        </Link>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-[#1a5744] leading-[1.1] mb-2">
          {review ? 'Edita tu opinión' : 'Tu opinión del curso'}
        </h1>
        <p className="text-[#1a5744]/85 mb-8">{course.title}</p>

        <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6 md:p-8">
          <ReviewForm
            courseId={id}
            initial={review
              ? {
                  rating: review.rating,
                  comment: review.comment,
                  status: review.status,
                  moderationNote: review.moderation_note,
                }
              : null}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
