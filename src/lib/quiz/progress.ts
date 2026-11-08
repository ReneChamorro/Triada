import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

/**
 * Marks a quiz lesson complete for a student. Written server-side with the
 * service client: students cannot complete quiz lessons themselves (RESTRICTIVE
 * policy on lesson_progress). The update_course_progress trigger recomputes
 * user_courses.progress_percentage.
 *
 * Failures are logged, not thrown: the student's grade must stand even if the
 * progress write fails (GET /api/quizzes/[lessonId] self-heals it later).
 */
export async function markQuizLessonComplete(
  svc: SupabaseClient,
  params: { userId: string; courseId: string; lessonId: string }
): Promise<void> {
  const now = new Date().toISOString()
  const { error } = await svc.from('lesson_progress').upsert(
    {
      user_id: params.userId,
      course_id: params.courseId,
      lesson_id: params.lessonId,
      completed_at: now,
      last_accessed_at: now,
    },
    { onConflict: 'user_id,lesson_id' }
  )
  if (error) logger.error('[Quiz] Could not mark lesson complete:', error)
}

export async function isLessonCompleted(
  svc: SupabaseClient,
  userId: string,
  lessonId: string
): Promise<boolean> {
  const { data } = await svc
    .from('lesson_progress')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()
  return !!data?.completed_at
}
