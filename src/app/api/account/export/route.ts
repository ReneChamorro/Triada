import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const [profileRes, coursesRes, progressRes, purchasesRes] = await Promise.all([
    supabase.from('profiles').select('full_name, name, lastname, email, phone, role, created_at').eq('id', user.id).single(),
    supabase.from('user_courses').select('course_id, enrolled_at, progress_percentage, is_completed, courses(title)').eq('user_id', user.id),
    supabase.from('lesson_progress').select('lesson_id, completed, completed_at, last_accessed_at').eq('user_id', user.id),
    supabase.from('purchases').select('course_id, amount, currency, payment_method, status, created_at, courses(title)').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileRes.data,
    courses: coursesRes.data,
    lesson_progress: progressRes.data,
    purchases: purchasesRes.data,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="triada-datos-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
