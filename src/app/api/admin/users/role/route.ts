import { logger } from '@/lib/logger'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'

const updateRoleSchema = z.object({
  userId: z.uuid(),
  newRole: z.enum(['admin', 'teacher', 'user']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify the requester is authenticated and is an admin
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', adminUser.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // 2. Validate input
    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const { userId, newRole } = parsed.data

    // 3. Prevent an admin from demoting themselves
    if (userId === adminUser.id) {
      return NextResponse.json({ error: 'No puedes cambiar tu propio rol' }, { status: 400 })
    }

    // 4. Fetch target user's current role for audit log
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 5. Perform the update using the service client (bypasses RLS intentionally)
    const serviceClient = createServiceClient()
    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) {
      logger.error('[UpdateRole] Error:', updateError)
      return NextResponse.json({ error: 'Error al actualizar el rol' }, { status: 500 })
    }

    // 6. Log the action to audit_log
    try {
      await supabase.from('audit_log').insert({
        admin_id: adminUser.id,
        action: 'change_role',
        target_type: 'user',
        target_id: userId,
        details: {
          email: targetProfile.email,
          from: targetProfile.role,
          to: newRole,
        },
      })
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('[UpdateRole] Unexpected error:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
