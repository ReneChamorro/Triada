import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Mux from '@mux/mux-node'

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
  throw new Error('Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET environment variables')
}

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
})

const UPLOAD_ID_PATTERN = /^[a-zA-Z0-9]+$/

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[Mux Asset] Profile query error:', profileError.message)
    return NextResponse.json({ error: 'Error al verificar permisos' }, { status: 500 })
  }

  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const { uploadId } = await params

    if (!uploadId || !UPLOAD_ID_PATTERN.test(uploadId)) {
      return NextResponse.json({ error: 'uploadId inválido' }, { status: 400 })
    }

    const upload = await mux.video.uploads.retrieve(uploadId)

    if (upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id)
      const playbackId = asset.playback_ids?.[0]?.id || null

      return NextResponse.json({
        status: asset.status,
        playbackId,
        assetId: asset.id,
        duration: asset.duration,
      })
    }

    return NextResponse.json({
      status: upload.status === 'waiting' ? 'waiting_for_upload' : upload.status,
      playbackId: null,
      assetId: null,
    })
  } catch (error: unknown) {
    console.error('[Mux Asset] Error checking status:', error instanceof Error ? error.stack || error.message : error)
    return NextResponse.json(
      { error: 'Error al verificar el estado del video' },
      { status: 500 }
    )
  }
}
