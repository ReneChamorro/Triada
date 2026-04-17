import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  if (body.confirm !== 'ELIMINAR') {
    return NextResponse.json({ error: 'Confirmación inválida' }, { status: 400 })
  }

  try {
    // Delete user's receipt files from storage
    const { data: files } = await supabase.storage
      .from('payment-receipts')
      .list(user.id)

    if (files && files.length > 0) {
      const filePaths = files.map(f => `${user.id}/${f.name}`)
      const serviceSupabase = createServiceClient()
      await serviceSupabase.storage.from('payment-receipts').remove(filePaths)
    }

    // Delete user via Supabase Admin API (CASCADE handles profiles, user_courses, lesson_progress, purchases)
    const serviceSupabase = createServiceClient()
    const { error } = await serviceSupabase.auth.admin.deleteUser(user.id)

    if (error) {
      return NextResponse.json({ error: 'Error al eliminar la cuenta' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error inesperado al eliminar la cuenta' }, { status: 500 })
  }
}
