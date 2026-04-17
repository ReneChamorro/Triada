'use client'

import { useEffect, useRef, useCallback } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import 'videojs-mux'

import type Player from 'video.js/dist/types/player'

interface MuxVideoPlayerProps {
  playbackId: string
  title?: string
  viewerUserId?: string
  className?: string
  autoplay?: boolean
  onEnded?: () => void
}

export default function MuxVideoPlayer({
  playbackId,
  title = 'Video',
  viewerUserId,
  className = '',
  autoplay = false,
  onEnded,
}: MuxVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playerRef = useRef<Player | null>(null)
  const onEndedRef = useRef(onEnded)

  // Keep onEnded callback fresh
  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  // Initialize player once
  useEffect(() => {
    if (!videoRef.current) return

    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`

    const player = videojs(videoRef.current, {
      controls: true,
      autoplay,
      preload: 'auto',
      fluid: true,
      responsive: true,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      controlBar: {
        pictureInPictureToggle: true,
      },
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: [{
        src: streamUrl,
        type: 'application/x-mpegURL',
      }],
      plugins: {
        mux: {
          debug: false,
          data: {
            env_key: process.env.NEXT_PUBLIC_MUX_ENV_KEY,
            player_name: 'Triada Course Player',
            player_init_time: Date.now(),
            video_id: playbackId,
            video_title: title,
            video_stream_type: 'on-demand',
            ...(viewerUserId && { viewer_user_id: viewerUserId }),
          },
        },
      },
    })

    playerRef.current = player

    // Use callback ref pattern to avoid stale closure
    player.on('ended', () => {
      onEndedRef.current?.()
    })

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  // Update source and metadata when playbackId, title, or viewerUserId changes
  useEffect(() => {
    const player = playerRef.current
    if (!player || player.isDisposed()) return

    const streamUrl = `https://stream.mux.com/${playbackId}.m3u8`

    player.src({
      src: streamUrl,
      type: 'application/x-mpegURL',
    })

    // Update poster
    player.poster(`https://image.mux.com/${playbackId}/thumbnail.webp?width=1280&height=720`)

    // Trigger videochange for Mux analytics (updates metadata)
    const muxData: Record<string, any> = {
      video_id: playbackId,
      video_title: title,
      video_stream_type: 'on-demand',
    }
    
    if (viewerUserId) {
      muxData.viewer_user_id = viewerUserId
    }

    player.trigger('videochange', muxData)
  }, [playbackId, title, viewerUserId])

  const posterUrl = `https://image.mux.com/${playbackId}/thumbnail.webp?width=1280&height=720`

  return (
    <div className={`relative w-full ${className}`} data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-16-9"
        poster={posterUrl}
        crossOrigin="anonymous"
        playsInline
      />
    </div>
  )
}
