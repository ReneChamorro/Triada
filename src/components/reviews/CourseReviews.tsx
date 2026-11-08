import StarRating from './StarRating'

export interface PublicReview {
  id: string
  display_name: string
  rating: number
  comment: string | null
  created_at: string
}

interface Props {
  summary: { review_count: number; average_rating: number | string | null } | null
  reviews: PublicReview[]
}

// Approved reviews only (served by the get_course_reviews SQL function).
export default function CourseReviews({ summary, reviews }: Props) {
  const count = summary?.review_count ?? 0
  if (count === 0 || reviews.length === 0) return null

  const average = Number(summary?.average_rating ?? 0)

  return (
    <section aria-labelledby="reviews-heading" className="bg-white rounded-[1.5rem] border border-[#e8e4d0] p-6 md:p-8 mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
        <h2 id="reviews-heading" className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-[#1a5744]">
          Opiniones de estudiantes
        </h2>
        <div className="flex items-center gap-2 text-sm text-[#1a5744]/90">
          <StarRating value={average} size="sm" />
          <span className="font-semibold">{average.toLocaleString('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
          <span>({count} {count === 1 ? 'opinión' : 'opiniones'})</span>
        </div>
      </div>

      <ul className="divide-y divide-[#e8e4d0]">
        {reviews.map((review) => (
          <li key={review.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="font-semibold text-[#1a5744] text-sm">{review.display_name}</span>
              <time dateTime={review.created_at} className="text-xs text-[#1a5744]/70">
                {new Date(review.created_at).toLocaleDateString('es', { year: 'numeric', month: 'long' })}
              </time>
            </div>
            <StarRating value={review.rating} size="sm" />
            {review.comment && (
              <p className="mt-2 text-sm text-[#1a5744]/90 leading-relaxed max-w-[65ch] whitespace-pre-line">{review.comment}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
