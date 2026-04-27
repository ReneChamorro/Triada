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

export async function POST(request: Request) {
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
    console.error('[Mux Upload] Profile query error:', profileError.message)
    return NextResponse.json({ error: 'Error al verificar permisos' }, { status: 500 })
  }

  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    // Use the request's origin so Mux allows uploads from any deployment (local, Vercel, custom domain)
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create a direct upload URL
    const upload = await mux.video.uploads.create({
      cors_origin: origin,
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
    })

    return NextResponse.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    })
  } catch (error: unknown) {
    console.error('[Mux Upload] Error creating upload:', error instanceof Error ? error.stack || error.message : error)
    return NextResponse.json(
      { error: 'Error al crear el upload' },
      { status: 500 }
    )
  }
}
