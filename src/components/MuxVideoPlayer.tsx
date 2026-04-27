'use client'

import MuxPlayer from '@mux/mux-player-react'

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
  return (
    <div className={`relative w-full ${className}`}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{
          video_title: title,
          ...(viewerUserId && { viewer_user_id: viewerUserId }),
        }}
        autoPlay={autoplay}
        onEnded={onEnded}
        streamType="on-demand"
        style={{ width: '100%', aspectRatio: '16/9' }}
      />
    </div>
  )
}
