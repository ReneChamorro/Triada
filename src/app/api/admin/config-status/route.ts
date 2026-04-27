import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Only allow admin/teacher
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  return NextResponse.json({
    muxConfigured: !!(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET),
    supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    emailConfigured: !!process.env.RESEND_API_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
  })
}
