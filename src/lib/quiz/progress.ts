import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Live lesson_progress schema: id, user_id, lesson_id, completed,
// last_position_seconds, completed_at, created_at, updated_at,
// last_accessed_at. There is NO course_id column, so we write the same shape
// as the learn page and recompute user_courses.progress_percentage ourselves.

/**
 * Marks a quiz lesson complete for a student. Written server-side with the
 * service client: students cannot complete quiz lessons themselves (RESTRICTIVE
 * policy on lesson_progress).
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
      lesson_id: params.lessonId,
      completed: true,
      completed_at: now,
      last_accessed_at: now,
    },
    { onConflict: 'user_id,lesson_id' }
  )
  if (error) {
    logger.error('[Quiz] Could not mark lesson complete:', error)
    return
  }
  await recomputeCourseProgress(svc, params.userId, params.courseId)
}

/** Same formula as the learn page: completed published lessons / published lessons. */
async function recomputeCourseProgress(svc: SupabaseClient, userId: string, courseId: string) {
  try {
    const { data: modules } = await svc
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true)
    const moduleIds = (modules ?? []).map((m) => m.id)
    if (moduleIds.length === 0) return

    const { data: lessons } = await svc
      .from('course_lessons')
      .select('id')
      .in('module_id', moduleIds)
      .eq('is_published', true)
    const lessonIds = (lessons ?? []).map((l) => l.id)
    if (lessonIds.length === 0) return

    const { data: done } = await svc
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .not('completed_at', 'is', null)

    const percentage = Math.round(((done?.length ?? 0) / lessonIds.length) * 100)
    const { error } = await svc
      .from('user_courses')
      .update({ progress_percentage: percentage })
      .eq('user_id', userId)
      .eq('course_id', courseId)
    if (error) logger.error('[Quiz] Could not update course progress:', error)
  } catch (error) {
    logger.error('[Quiz] Could not recompute course progress:', error)
  }
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
