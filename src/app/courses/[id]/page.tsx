import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock, BookOpen, CheckCircle, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CourseReviews, { type PublicReview } from '@/components/reviews/CourseReviews'

const primaryBtn =
  'w-full bg-[#1a5744] hover:bg-[#2d7a5f] text-white px-6 min-h-12 flex items-center justify-center rounded-xl font-semibold text-center active:scale-[0.98] [transition:transform_150ms_var(--ease-out),background-color_300ms_var(--ease-brand)]'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch course details
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (!course) {
    notFound()
  }

  // Check if user is authenticated and owns the course
  const { data: { user } } = await supabase.auth.getUser()
  let hasAccess = false

  if (user) {
    const { data: userCourse } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .single()

    hasAccess = !!userCourse
  }

  // Approved reviews only, via SECURITY DEFINER functions (the table itself is not public).
  const [{ data: summaryRows }, { data: reviewRows }] = await Promise.all([
    supabase.rpc('get_course_rating_summary', { p_course_id: id }),
    supabase.rpc('get_course_reviews', { p_course_id: id, p_limit: 10, p_offset: 0 }),
  ])
  const summary = Array.isArray(summaryRows) ? summaryRows[0] ?? null : null
  const reviews: PublicReview[] = Array.isArray(reviewRows) ? reviewRows : []
  const reviewCount = summary?.review_count ?? 0
  const averageRating = Number(summary?.average_rating ?? 0)

  let hasOwnReview = false
  if (user && hasAccess) {
    const { data: ownReview } = await supabase
      .from('course_reviews')
      .select('id')
      .eq('course_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    hasOwnReview = !!ownReview
  }

  return (
    <div className="min-h-screen bg-[#f5f3e8]">
      <Header currentPage="courses" />

      <main id="main">
        {/* Course Hero */}
        <div className="bg-[#1a5744] relative overflow-hidden">
          <div className="absolute -top-16 right-0 w-96 h-72 bg-[#2d7a5f]/55 rounded-full translate-x-1/3 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative">
            <div className="max-w-3xl">
              <p className="flex items-center gap-3 text-[#e8e4d0] text-xs font-bold uppercase tracking-widest mb-5">
                <span className="h-0.5 w-8 bg-[#a4c639]" aria-hidden="true" />
                Curso profesional
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-[#e8e4d0] mb-3 md:mb-4 leading-[1.1]">
                {course.title}
              </h1>
              {course.short_description && (
                <p className="text-base md:text-lg text-[#e8e4d0]/90 mb-4 md:mb-6">{course.short_description}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[#e8e4d0]/90 text-sm">
                {course.duration_minutes && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>{course.duration_minutes} minutos de contenido</span>
                  </div>
                )}
                {reviewCount > 0 && (
                  <a href="#reviews-heading" className="flex items-center hover:text-white transition-colors">
                    <Star className="h-4 w-4 mr-2 text-[#a4c639] fill-[#a4c639]" aria-hidden="true" />
                    <span>
                      {averageRating.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      {' '}({reviewCount} {reviewCount === 1 ? 'opinión' : 'opiniones'})
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="w-full lg:col-span-2 order-2 lg:order-1">
              <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-[#1a5744] mb-4">
                  Acerca de este curso
                </h2>
                {course.description ? (
                  <div className="text-[#1a5744]/90 text-sm md:text-base leading-relaxed space-y-4 max-w-[65ch]">
                    {course.description.split('\n').map((paragraph: string, index: number) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#1a5744]/90">
                    Este curso está diseñado para ayudarte a dominar nuevas habilidades
                    y avanzar en tu carrera profesional.
                  </p>
                )}
              </div>

              <CourseReviews summary={summary} reviews={reviews} />
            </div>

            {/* Purchase card */}
            <div className="w-full lg:col-span-1 order-1 lg:order-2">
              <div className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-5 md:p-6 lg:sticky lg:top-24">
                <div className="aspect-video bg-[#f5f3e8] rounded-xl mb-5 overflow-hidden">
                  {course.image_url ? (
                    <img src={course.image_url} alt="" className="w-full h-full object-contain p-6" />
                  ) : (
                    <div className="w-full h-full bg-[#1a5744] flex items-center justify-center">
                      <BookOpen className="h-14 w-14 text-[#a4c639]" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <div className="text-3xl font-bold text-[#1a5744] mb-1">
                    {formatPrice(course.price, course.currency)}
                  </div>
                  <p className="text-sm text-[#1a5744]/80">Pago único · Acceso de por vida</p>
                </div>

                {hasAccess ? (
                  <div className="space-y-3 mb-4">
                    <Link href={`/courses/${course.id}/learn`} className={primaryBtn}>
                      Ir al Curso
                    </Link>
                    <Link
                      href={`/courses/${course.id}/resena`}
                      className="w-full bg-white text-[#1a5744] border-2 border-[#1a5744]/30 hover:border-[#1a5744]/60 hover:bg-[#1a5744]/5 px-6 min-h-12 flex items-center justify-center rounded-xl font-semibold text-center active:scale-[0.98] [transition:transform_150ms_var(--ease-out),border-color_300ms_var(--ease-brand),background-color_300ms_var(--ease-brand)]"
                    >
                      {hasOwnReview ? 'Editar tu opinión' : 'Deja tu opinión'}
                    </Link>
                  </div>
                ) : user ? (
                  <Link href={`/courses/${course.id}/checkout`} className={`${primaryBtn} mb-4`}>
                    Comprar Ahora
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <Link href={`/register?redirect=/courses/${course.id}`} className={primaryBtn}>
                      Registrarse para Comprar
                    </Link>
                    <Link
                      href={`/login?redirect=/courses/${course.id}`}
                      className="w-full bg-white text-[#1a5744] border-2 border-[#1a5744]/30 hover:border-[#1a5744]/60 hover:bg-[#1a5744]/5 px-6 min-h-12 flex items-center justify-center rounded-xl font-semibold text-center active:scale-[0.98] [transition:transform_150ms_var(--ease-out),border-color_300ms_var(--ease-brand),background-color_300ms_var(--ease-brand)]"
                    >
                      Ya tengo cuenta
                    </Link>
                  </div>
                )}

                <ul className="mt-5 pt-5 border-t border-[#e8e4d0] space-y-2.5">
                  {['Acceso de por vida', 'Certificado de finalización', 'Contenido protegido'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#1a5744]/90">
                      <CheckCircle className="h-4 w-4 text-[#2d7a5f] shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
